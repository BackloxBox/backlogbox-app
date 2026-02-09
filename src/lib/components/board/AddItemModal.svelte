<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import MediaCover from './MediaCover.svelte';
	import type { SearchResult } from '$lib/server/search';

	type Props = {
		slug: string;
		open: boolean;
		onClose: () => void;
		onSearch: (query: string) => Promise<SearchResult[]>;
		onAdd: (result: SearchResult) => Promise<void>;
		onManualAdd: (title: string) => Promise<void>;
	};

	let { slug, open, onClose, onSearch, onAdd, onManualAdd }: Props = $props();

	let searchQuery = $state('');
	let results = $state<SearchResult[]>([]);
	let searching = $state(false);
	let adding = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Manual add form state
	let showManualForm = $state(false);
	let manualTitle = $state('');

	// Season picker state for series
	// Season 0 = "All seasons" (no specific season)
	let pendingResult = $state<SearchResult | null>(null);
	let selectedSeasons = $state<Set<number>>(new Set());

	const isSeries = $derived(slug === 'series');
	const allSeasonsSelected = $derived(selectedSeasons.has(0));

	function reset() {
		searchQuery = '';
		results = [];
		searching = false;
		adding = false;
		showManualForm = false;
		manualTitle = '';
		pendingResult = null;
		selectedSeasons = new Set();
	}

	function handleClose() {
		reset();
		onClose();
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		showManualForm = false;
		pendingResult = null;

		if (searchQuery.trim().length < 2) {
			results = [];
			return;
		}

		searching = true;
		debounceTimer = setTimeout(async () => {
			try {
				results = await onSearch(searchQuery.trim());
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 400);
	}

	async function handleSelect(result: SearchResult) {
		const totalSeasons = result.meta.totalSeasons as number | null;
		if (isSeries && totalSeasons && totalSeasons > 0) {
			// Show season picker
			pendingResult = result;
			selectedSeasons = new Set();
			return;
		}

		// Non-series or series without season info — add directly
		adding = true;
		try {
			await onAdd(result);
			handleClose();
		} catch (err) {
			console.error('Failed to add item:', err);
		} finally {
			adding = false;
		}
	}

	function toggleSeason(season: number) {
		const next = new Set(selectedSeasons);
		if (season === 0) {
			// "All seasons" is exclusive — deselect individual seasons
			if (next.has(0)) {
				next.delete(0);
			} else {
				next.clear();
				next.add(0);
			}
		} else {
			// Individual season — deselect "All"
			next.delete(0);
			if (next.has(season)) {
				next.delete(season);
			} else {
				next.add(season);
			}
		}
		selectedSeasons = next;
	}

	async function handleAddSeasons() {
		if (!pendingResult || selectedSeasons.size === 0) return;
		adding = true;
		try {
			if (selectedSeasons.has(0)) {
				// "All seasons" — add without currentSeason
				await onAdd(pendingResult);
			} else {
				const seasons = [...selectedSeasons].sort((a, b) => a - b);
				for (const season of seasons) {
					const seasonResult: SearchResult = {
						...pendingResult,
						meta: { ...pendingResult.meta, currentSeason: season }
					};
					await onAdd(seasonResult);
				}
			}
			handleClose();
		} catch (err) {
			console.error('Failed to add item:', err);
		} finally {
			adding = false;
		}
	}

	/** Build a subtitle string from search result metadata */
	function resultDetail(result: SearchResult): string {
		const parts: string[] = [];
		const genre = result.meta.genre as string | null;
		if (genre) parts.push(genre);

		const detail = (result.meta.author ??
			result.meta.director ??
			result.meta.host ??
			result.meta.platform ??
			'') as string;
		if (detail) parts.push(detail);

		const year = result.releaseYear ? String(result.releaseYear) : '';
		if (year) parts.push(year);

		return parts.join(' \u00b7 ');
	}

	async function handleManualAdd() {
		if (!manualTitle.trim()) return;
		adding = true;
		try {
			await onManualAdd(manualTitle.trim());
			handleClose();
		} catch (err) {
			console.error('Failed to add item:', err);
		} finally {
			adding = false;
		}
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(v) => {
		if (!v) handleClose();
	}}
>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add item</Dialog.Title>
			<Dialog.Description class="sr-only">Search or manually add an item</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			{#if pendingResult}
				<!-- Season picker for series -->
				{@const totalSeasons = (pendingResult.meta.totalSeasons as number | null) ?? 0}
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<MediaCover title={pendingResult.title} coverUrl={pendingResult.coverUrl} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{pendingResult.title}</p>
							<p class="text-xs text-muted-foreground">Select seasons to add</p>
						</div>
					</div>

					<div class="flex flex-wrap gap-1.5">
						<button
							class="rounded border px-2.5 py-1 text-xs font-medium transition
							{allSeasonsSelected
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-muted text-muted-foreground hover:border-foreground/30'}"
							onclick={() => toggleSeason(0)}
						>
							All
						</button>
						{#each { length: totalSeasons } as _, i}
							{@const season = i + 1}
							{@const selected = selectedSeasons.has(season)}
							<button
								class="rounded border px-2.5 py-1 text-xs font-medium transition
								{selected
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-muted text-muted-foreground hover:border-foreground/30'}"
								onclick={() => toggleSeason(season)}
							>
								S{season}
							</button>
						{/each}
					</div>

					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							class="flex-1"
							onclick={() => (pendingResult = null)}
						>
							Back
						</Button>
						<Button
							size="sm"
							class="flex-1"
							onclick={handleAddSeasons}
							disabled={adding || selectedSeasons.size === 0}
						>
							{adding
								? 'Adding...'
								: allSeasonsSelected
									? 'Add all seasons'
									: `Add ${selectedSeasons.size} season${selectedSeasons.size !== 1 ? 's' : ''}`}
						</Button>
					</div>
				</div>
			{:else}
				<!-- Search input -->
				<Input
					type="text"
					placeholder="Search by title..."
					bind:value={searchQuery}
					oninput={handleInput}
				/>

				<!-- Results list -->
				<div class="max-h-72 overflow-y-auto">
					{#if searching}
						<p class="py-6 text-center text-sm text-muted-foreground">Searching...</p>
					{:else if results.length > 0}
						<div class="divide-y divide-border">
							{#each results as result (result.externalId)}
								<button
									class="flex w-full items-center gap-3 px-1 py-2.5 text-left transition hover:bg-accent disabled:opacity-50"
									onclick={() => handleSelect(result)}
									disabled={adding}
								>
									<MediaCover title={result.title} coverUrl={result.coverUrl} size="sm" />
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-foreground">{result.title}</p>
										{#if resultDetail(result)}
											<p class="truncate text-xs text-muted-foreground">
												{resultDetail(result)}
											</p>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{:else if searchQuery.trim().length >= 2 && !searching}
						<p class="py-6 text-center text-sm text-muted-foreground">No results found</p>
					{/if}
				</div>

				<!-- Manual add toggle -->
				{#if !showManualForm}
					<button
						class="w-full rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
						onclick={() => (showManualForm = true)}
					>
						Add manually
					</button>
				{:else}
					<div class="flex gap-2">
						<Input
							type="text"
							placeholder="Title"
							bind:value={manualTitle}
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter') handleManualAdd();
							}}
						/>
						<Button size="sm" onclick={handleManualAdd} disabled={adding || !manualTitle.trim()}>
							Add
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
