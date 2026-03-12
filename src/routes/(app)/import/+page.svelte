<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import UpgradeBanner from '$lib/components/UpgradeBanner.svelte';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import { toast } from 'svelte-sonner';
	import { trackEvent } from '$lib/analytics';
	import { parseGoodreadsCsv } from '$lib/import/goodreads';
	import { parseLetterboxdCsv } from '$lib/import/letterboxd';
	import type { ImportCandidate, ImportResult } from '$lib/import/types';
	import { importItems } from './import.remote';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Upload from '@lucide/svelte/icons/upload';
	import Check from '@lucide/svelte/icons/check';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { SvelteSet } from 'svelte/reactivity';
	import type { AccessLevel } from '$lib/server/access';

	type ImportSource = 'goodreads' | 'letterboxd';
	type Step = 'select' | 'preview' | 'done';

	const isFree = $derived((page.data.accessLevel as AccessLevel) === 'free');

	let step = $state<Step>('select');
	let source = $state<ImportSource | null>(null);
	let candidates = $state<ImportCandidate[]>([]);
	let selected = new SvelteSet<number>();
	let importing = $state(false);
	let result = $state<ImportResult | null>(null);
	let parseError = $state<string | null>(null);
	// Letterboxd: whether the uploaded file is a watchlist
	let letterboxdIsWatchlist = $state(false);

	const selectedCount = $derived(selected.size);
	const duplicateCount = $derived(candidates.filter((c) => c.duplicate).length);

	function reset() {
		step = 'select';
		source = null;
		candidates = [];
		selected = new SvelteSet();
		result = null;
		parseError = null;
		letterboxdIsWatchlist = false;
	}

	function handleFileSelect(src: ImportSource) {
		source = src;
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.csv';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				parseFile(src, text);
			};
			reader.readAsText(file);
		};
		input.click();
	}

	function parseFile(src: ImportSource, csvText: string) {
		parseError = null;

		if (src === 'goodreads') {
			const result = parseGoodreadsCsv(csvText);
			if (!result.ok) {
				parseError = `Missing required columns: ${result.error.missing.join(', ')}`;
				return;
			}
			candidates = result.items;
		} else {
			const result = parseLetterboxdCsv(csvText, letterboxdIsWatchlist);
			if (!result.ok) {
				parseError =
					'Unrecognized CSV format. Please upload a Letterboxd export file (watched.csv, watchlist.csv, diary.csv, or ratings.csv).';
				return;
			}
			candidates = result.items;
		}

		if (candidates.length === 0) {
			parseError = 'No items found in the CSV file.';
			return;
		}

		// Pre-select all non-duplicates
		selected = new SvelteSet(candidates.map((_, i) => i).filter((i) => !candidates[i].duplicate));
		step = 'preview';
	}

	function toggleItem(index: number) {
		if (selected.has(index)) {
			selected.delete(index);
		} else {
			selected.add(index);
		}
	}

	function toggleAll() {
		if (selected.size === candidates.length) {
			selected = new SvelteSet();
		} else {
			selected = new SvelteSet(candidates.map((_, i) => i));
		}
	}

	async function handleImport() {
		if (importing || selectedCount === 0 || !source) return;
		importing = true;

		try {
			const items = candidates.filter((_, i) => selected.has(i));

			if (source === 'goodreads') {
				result = await importItems({
					source: 'goodreads',
					items: items.map((c) => {
						const gc = c as Extract<ImportCandidate, { source: 'goodreads' }>;
						return {
							title: gc.title,
							releaseYear: gc.releaseYear,
							status: gc.status,
							rating: gc.rating,
							completedAt: gc.completedAt?.toISOString() ?? null,
							author: gc.meta.author ?? null,
							isbn: gc.meta.isbn ?? null,
							pageCount: gc.meta.pageCount ?? null
						};
					})
				});
			} else {
				result = await importItems({
					source: 'letterboxd',
					items: items.map((c) => ({
						title: c.title,
						releaseYear: c.releaseYear,
						status: c.status,
						rating: c.rating,
						completedAt: c.completedAt?.toISOString() ?? null
					}))
				});
			}

			step = 'done';
			trackEvent('import_completed', { source, count: result.imported });
			toast.success(`Imported ${result.imported} items`);
			// Refresh sidebar counts
			await invalidateAll();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('import failed', err);
			toast.error('Import failed. Please try again.');
		} finally {
			importing = false;
		}
	}

	const STATUS_LABELS: Record<string, string> = {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'In Progress',
		on_hold: 'On Hold',
		completed: 'Completed',
		abandoned: 'Abandoned'
	};

	const stars = (n: number | null) => (n ? '\u2605'.repeat(n) : '\u2014');
</script>

<div class="flex h-full flex-col">
	<header class="flex h-14 items-center gap-2 px-6 pl-14 lg:pl-6">
		{#if step !== 'select'}
			<Button variant="ghost" size="icon" class="size-8" onclick={reset}>
				<ArrowLeft class="size-4" />
			</Button>
		{/if}
		<h1 class="text-lg font-semibold tracking-tight text-foreground">Import</h1>
	</header>

	<Separator />

	<div class="flex-1 overflow-auto p-6">
		{#if isFree}
			<div class="mx-auto max-w-lg">
				<UpgradeBanner
					message="Import your library from Goodreads, Letterboxd, and more."
					variant="overlay"
				/>
			</div>
		{:else if step === 'select'}
			<!-- Source selection -->
			<div class="mx-auto max-w-lg space-y-4">
				<p class="text-sm text-muted-foreground">
					Import your existing library from another platform. Your items will be added to the
					matching board, and cover art will be fetched automatically in the background.
				</p>

				{#if parseError}
					<div
						class="rounded-lg border border-red-400/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
					>
						{parseError}
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-2">
					<button
						class="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition hover:border-primary/50 hover:bg-accent"
						onclick={() => handleFileSelect('goodreads')}
					>
						<BookOpen class="size-8 text-blue-500" />
						<div class="text-center">
							<p class="font-medium">Goodreads</p>
							<p class="text-xs text-muted-foreground">Import books from CSV export</p>
						</div>
					</button>

					<div class="space-y-2">
						<button
							class="flex w-full flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition hover:border-primary/50 hover:bg-accent"
							onclick={() => handleFileSelect('letterboxd')}
						>
							<Film class="size-8 text-emerald-500" />
							<div class="text-center">
								<p class="font-medium">Letterboxd</p>
								<p class="text-xs text-muted-foreground">Import movies from CSV export</p>
							</div>
						</button>
						<label class="flex items-center gap-2 px-2 text-xs text-muted-foreground">
							<input type="checkbox" bind:checked={letterboxdIsWatchlist} class="rounded" />
							This is a watchlist file
						</label>
					</div>
				</div>

				<div class="space-y-2 rounded-lg border border-dashed border-border p-4">
					<p class="text-xs font-medium text-muted-foreground">How to export</p>
					<div class="space-y-1.5 text-xs text-muted-foreground/80">
						<p>
							<strong>Goodreads:</strong> My Books → Import and export → Export Library
						</p>
						<p>
							<strong>Letterboxd:</strong> Settings → Import & Export → Export Your Data → upload watched.csv,
							watchlist.csv, diary.csv, or ratings.csv
						</p>
					</div>
				</div>
			</div>
		{:else if step === 'preview'}
			<!-- Preview parsed items -->
			<div class="mx-auto max-w-3xl space-y-4">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<p class="text-sm font-medium">
							{candidates.length} items found
							{#if duplicateCount > 0}
								<span class="text-muted-foreground">
									({duplicateCount} already in library)
								</span>
							{/if}
						</p>
						<p class="text-xs text-muted-foreground">
							{selectedCount} selected for import
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" onclick={toggleAll}>
							{selected.size === candidates.length ? 'Deselect all' : 'Select all'}
						</Button>
						<Button size="sm" disabled={selectedCount === 0 || importing} onclick={handleImport}>
							{#if importing}
								<LoaderCircle class="size-4 animate-spin" />
								Importing...
							{:else}
								<Upload class="size-4" />
								Import {selectedCount} items
							{/if}
						</Button>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg border border-border">
					<table class="w-full text-sm">
						<thead>
							<tr
								class="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground"
							>
								<th class="w-10 px-3 py-2"></th>
								<th class="px-3 py-2">Title</th>
								{#if source === 'goodreads'}
									<th class="px-3 py-2">Author</th>
								{/if}
								<th class="w-16 px-3 py-2">Year</th>
								<th class="w-24 px-3 py-2">Status</th>
								<th class="w-20 px-3 py-2">Rating</th>
							</tr>
						</thead>
						<tbody>
							{#each candidates as item, i (i)}
								{@const isSelected = selected.has(i)}
								<tr
									class="border-b border-border/50 transition last:border-0 {item.duplicate
										? 'bg-muted/30 opacity-60'
										: isSelected
											? 'bg-background'
											: 'bg-background opacity-50'}"
								>
									<td class="px-3 py-2 text-center">
										<input
											type="checkbox"
											checked={isSelected}
											onchange={() => toggleItem(i)}
											class="rounded"
										/>
									</td>
									<td class="px-3 py-2">
										<span class="line-clamp-1">{item.title}</span>
										{#if item.duplicate}
											<span class="ml-1 text-[10px] text-amber-600 dark:text-amber-400"
												>already in library</span
											>
										{/if}
									</td>
									{#if source === 'goodreads'}
										<td class="px-3 py-2 text-muted-foreground">
											{#if item.source === 'goodreads'}
												{item.meta.author ?? '\u2014'}
											{/if}
										</td>
									{/if}
									<td class="px-3 py-2 text-muted-foreground tabular-nums">
										{item.releaseYear ?? '\u2014'}
									</td>
									<td class="px-3 py-2">
										<span
											class="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
										>
											{STATUS_LABELS[item.status] ?? item.status}
										</span>
									</td>
									<td class="px-3 py-2 text-amber-500">
										{stars(item.rating)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else if step === 'done' && result}
			<!-- Success -->
			<div class="mx-auto max-w-md space-y-6 pt-12 text-center">
				<div
					class="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20"
				>
					<Check class="size-8 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">Import complete</p>
					<p class="text-sm text-muted-foreground">
						{result.imported} items imported{result.duplicatesSkipped > 0
							? `, ${result.duplicatesSkipped} duplicates skipped`
							: ''}
					</p>
					<p class="text-xs text-muted-foreground">
						Cover art and metadata are being fetched in the background.
					</p>
				</div>
				<div class="flex justify-center gap-3">
					<Button variant="outline" onclick={reset}>Import more</Button>
					<Button
						onclick={() => {
							const href = source === 'goodreads' ? '/books' : '/movies';
							window.location.href = href;
						}}
					>
						View board
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
