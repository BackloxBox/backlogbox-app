<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import MediaCover from './MediaCover.svelte';
	import type { SearchResult } from '$lib/server/search';
	import { STREAMING_PLATFORMS } from '$lib/types';

	type Props = {
		slug: string;
		open: boolean;
		onClose: () => void;
		onSearch: (query: string) => Promise<SearchResult[]>;
		onAdd: (result: SearchResult) => Promise<void>;
		onManualAdd: (data: Record<string, unknown>) => Promise<void>;
		onFetchSeasons?: (tmdbId: number) => Promise<number | null>;
	};

	let { slug, open, onClose, onSearch, onAdd, onManualAdd, onFetchSeasons }: Props = $props();

	let searchQuery = $state('');
	let results = $state<SearchResult[]>([]);
	let searching = $state(false);
	let adding = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Clear search debounce on unmount
	$effect(() => {
		return () => clearTimeout(debounceTimer);
	});

	// Manual add form state
	let showManualForm = $state(false);
	let manualTitle = $state('');
	let manualAuthor = $state('');
	let manualDirector = $state('');
	let manualGenre = $state('');
	let manualPlatform = $state('');
	let manualHost = $state('');
	let manualYear = $state('');
	let manualPageCount = $state('');
	let manualIsbn = $state('');
	let manualRuntime = $state('');
	let manualCreator = $state('');
	let manualTotalSeasons = $state('');

	// Season picker state for series
	// Season 0 = "All seasons" (no specific season)
	let pendingResult = $state<SearchResult | null>(null);
	let pendingTotalSeasons = $state(0);
	let selectedSeasons = $state<Set<number>>(new Set());
	let loadingSeasons = $state(false);
	let pendingWatchingOn = $state<string | undefined>(undefined);

	const isSeries = $derived(slug === 'series');
	const allSeasonsSelected = $derived(selectedSeasons.has(0));

	function reset() {
		searchQuery = '';
		results = [];
		searching = false;
		adding = false;
		showManualForm = false;
		manualTitle = '';
		manualAuthor = '';
		manualDirector = '';
		manualGenre = '';
		manualPlatform = '';
		manualHost = '';
		manualYear = '';
		manualPageCount = '';
		manualIsbn = '';
		manualRuntime = '';
		manualCreator = '';
		manualTotalSeasons = '';
		pendingResult = null;
		pendingTotalSeasons = 0;
		selectedSeasons = new Set();
		loadingSeasons = false;
		pendingWatchingOn = undefined;
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
		if (!isSeries) {
			// Non-series — add directly
			adding = true;
			try {
				await onAdd(result);
				handleClose();
			} catch (err) {
				console.error('add from search failed', { slug, title: result.title, err });
			} finally {
				adding = false;
			}
			return;
		}

		// Series — fetch season count from TMDB details, then show picker
		pendingResult = result;
		selectedSeasons = new Set();
		pendingTotalSeasons = 0;

		const tmdbId = typeof result.meta.tmdbId === 'number' ? result.meta.tmdbId : null;
		if (tmdbId && onFetchSeasons) {
			loadingSeasons = true;
			try {
				const count = await onFetchSeasons(tmdbId);
				pendingTotalSeasons = count ?? 0;
			} catch {
				pendingTotalSeasons = 0;
			} finally {
				loadingSeasons = false;
			}
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
			const baseMeta = {
				...pendingResult.meta,
				totalSeasons: pendingTotalSeasons > 0 ? pendingTotalSeasons : null,
				...(pendingWatchingOn ? { watchingOn: pendingWatchingOn } : {})
			};
			if (selectedSeasons.has(0)) {
				// "All seasons" — add without currentSeason
				await onAdd({ ...pendingResult, meta: baseMeta });
			} else {
				const seasons = [...selectedSeasons].sort((a, b) => a - b);
				for (const season of seasons) {
					const seasonResult: SearchResult = {
						...pendingResult,
						meta: { ...baseMeta, currentSeason: season }
					};
					await onAdd(seasonResult);
				}
			}
			handleClose();
		} catch (err) {
			console.error('add seasons failed', {
				slug,
				title: pendingResult?.title,
				seasons: [...selectedSeasons],
				err
			});
		} finally {
			adding = false;
		}
	}

	/** Build a subtitle string from search result metadata */
	function resultDetail(result: SearchResult): string {
		const parts: string[] = [];
		const m = result.meta;

		const genre = typeof m.genre === 'string' ? m.genre : null;
		if (genre) parts.push(genre);

		const detail = [m.author, m.director, m.host, m.platform].find(
			(v): v is string => typeof v === 'string' && v.length > 0
		);
		if (detail) parts.push(detail);

		if (result.releaseYear) parts.push(String(result.releaseYear));

		return parts.join(' \u00b7 ');
	}

	/** Collect manual form fields into a flat data object for the add command */
	function collectManualData(): Record<string, unknown> {
		const data: Record<string, unknown> = { title: manualTitle.trim() };
		const year = parseInt(manualYear);
		if (!isNaN(year)) data.releaseYear = year;

		if (slug === 'books') {
			if (manualAuthor.trim()) data.author = manualAuthor.trim();
			if (manualGenre.trim()) data.genre = manualGenre.trim();
			const pages = parseInt(manualPageCount);
			if (!isNaN(pages)) data.pageCount = pages;
			if (manualIsbn.trim()) data.isbn = manualIsbn.trim();
		} else if (slug === 'movies') {
			if (manualDirector.trim()) data.director = manualDirector.trim();
			if (manualGenre.trim()) data.genre = manualGenre.trim();
			const rt = parseInt(manualRuntime);
			if (!isNaN(rt)) data.runtime = rt;
		} else if (slug === 'series') {
			if (manualCreator.trim()) data.creator = manualCreator.trim();
			if (manualGenre.trim()) data.genre = manualGenre.trim();
			const ts = parseInt(manualTotalSeasons);
			if (!isNaN(ts)) data.totalSeasons = ts;
		} else if (slug === 'games') {
			if (manualPlatform.trim()) data.platform = manualPlatform.trim();
			if (manualGenre.trim()) data.genre = manualGenre.trim();
		} else if (slug === 'podcasts') {
			if (manualHost.trim()) data.host = manualHost.trim();
		}

		return data;
	}

	async function handleManualAdd() {
		if (!manualTitle.trim()) return;
		adding = true;
		try {
			await onManualAdd(collectManualData());
			handleClose();
		} catch (err) {
			console.error('manual add failed', { slug, title: manualTitle, err });
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
	<Dialog.Content class="max-w-[calc(100%-2rem)] sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add item</Dialog.Title>
			<Dialog.Description class="sr-only">Search or manually add an item</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			{#if pendingResult}
				<!-- Season picker for series -->
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<MediaCover title={pendingResult.title} coverUrl={pendingResult.coverUrl} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{pendingResult.title}</p>
							<p class="text-xs text-muted-foreground">Select seasons to add</p>
						</div>
					</div>

					{#if loadingSeasons}
						<p class="py-4 text-center text-sm text-muted-foreground">Loading seasons...</p>
					{:else}
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
							{#each { length: pendingTotalSeasons } as _, i}
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
					{/if}

					<!-- Watching on -->
					<div class="space-y-1.5">
						<Label>Watching on</Label>
						<Select.Root type="single" bind:value={pendingWatchingOn}>
							<Select.Trigger class="w-full">
								{pendingWatchingOn ?? 'Select platform...'}
							</Select.Trigger>
							<Select.Content>
								{#each STREAMING_PLATFORMS as platform}
									<Select.Item value={platform}>{platform}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
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
					<Separator />
					<div class="space-y-3">
						<div class="space-y-1.5">
							<Label for="manual-title">Title *</Label>
							<Input id="manual-title" placeholder="Title" bind:value={manualTitle} />
						</div>

						{#if slug === 'books'}
							<div class="space-y-1.5">
								<Label for="manual-author">Author</Label>
								<Input id="manual-author" placeholder="Author" bind:value={manualAuthor} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-genre">Genre</Label>
								<Input id="manual-genre" placeholder="Genre" bind:value={manualGenre} />
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="manual-pages">Pages</Label>
									<Input
										id="manual-pages"
										type="number"
										placeholder="320"
										bind:value={manualPageCount}
									/>
								</div>
								<div class="space-y-1.5">
									<Label for="manual-year">Year</Label>
									<Input
										id="manual-year"
										type="number"
										placeholder="2024"
										bind:value={manualYear}
									/>
								</div>
							</div>
							<div class="space-y-1.5">
								<Label for="manual-isbn">ISBN</Label>
								<Input id="manual-isbn" placeholder="978-0-00-000000-0" bind:value={manualIsbn} />
							</div>
						{:else if slug === 'movies'}
							<div class="space-y-1.5">
								<Label for="manual-director">Director</Label>
								<Input id="manual-director" placeholder="Director" bind:value={manualDirector} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-genre">Genre</Label>
								<Input id="manual-genre" placeholder="Genre" bind:value={manualGenre} />
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="manual-runtime">Runtime (min)</Label>
									<Input
										id="manual-runtime"
										type="number"
										placeholder="120"
										bind:value={manualRuntime}
									/>
								</div>
								<div class="space-y-1.5">
									<Label for="manual-year">Year</Label>
									<Input
										id="manual-year"
										type="number"
										placeholder="2024"
										bind:value={manualYear}
									/>
								</div>
							</div>
						{:else if slug === 'series'}
							<div class="space-y-1.5">
								<Label for="manual-creator">Creator</Label>
								<Input id="manual-creator" placeholder="Creator" bind:value={manualCreator} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-genre">Genre</Label>
								<Input id="manual-genre" placeholder="Genre" bind:value={manualGenre} />
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="manual-seasons">Total seasons</Label>
									<Input
										id="manual-seasons"
										type="number"
										placeholder="3"
										bind:value={manualTotalSeasons}
									/>
								</div>
								<div class="space-y-1.5">
									<Label for="manual-year">Year</Label>
									<Input
										id="manual-year"
										type="number"
										placeholder="2024"
										bind:value={manualYear}
									/>
								</div>
							</div>
						{:else if slug === 'games'}
							<div class="space-y-1.5">
								<Label for="manual-platform">Platform</Label>
								<Input
									id="manual-platform"
									placeholder="PC, PS5, Switch..."
									bind:value={manualPlatform}
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="manual-genre">Genre</Label>
									<Input id="manual-genre" placeholder="Genre" bind:value={manualGenre} />
								</div>
								<div class="space-y-1.5">
									<Label for="manual-year">Year</Label>
									<Input
										id="manual-year"
										type="number"
										placeholder="2024"
										bind:value={manualYear}
									/>
								</div>
							</div>
						{:else if slug === 'podcasts'}
							<div class="grid grid-cols-2 gap-3">
								<div class="space-y-1.5">
									<Label for="manual-host">Host</Label>
									<Input id="manual-host" placeholder="Host" bind:value={manualHost} />
								</div>
								<div class="space-y-1.5">
									<Label for="manual-year">Year</Label>
									<Input
										id="manual-year"
										type="number"
										placeholder="2024"
										bind:value={manualYear}
									/>
								</div>
							</div>
						{/if}

						<Button
							class="w-full"
							size="sm"
							onclick={handleManualAdd}
							disabled={adding || !manualTitle.trim()}
						>
							{adding ? 'Adding...' : 'Add'}
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
