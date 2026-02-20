<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import MediaCover from './MediaCover.svelte';
	import type { SearchResult } from '$lib/server/search';
	import { STREAMING_PLATFORMS, PODCAST_PLATFORMS } from '$lib/types';
	import { MediaQuery, SvelteSet } from 'svelte/reactivity';

	const isDesktop = new MediaQuery('(min-width: 640px)');

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

	function emptyForm() {
		return {
			title: '',
			author: '',
			director: '',
			genre: '',
			platform: '',
			developer: '',
			publisher: '',
			host: '',
			year: '',
			pageCount: '',
			isbn: '',
			runtime: '',
			creator: '',
			totalSeasons: ''
		};
	}

	let manual = $state(emptyForm());
	let manualFormEl = $state<HTMLDivElement | null>(null);

	// Season picker state for series
	// Season 0 = "All seasons" (no specific season)
	let pendingResult = $state<SearchResult | null>(null);
	let pendingTotalSeasons = $state(0);
	let selectedSeasons = $state<Set<number>>(new Set());
	let loadingSeasons = $state(false);
	let pendingWatchingOn = $state<string | undefined>(undefined);

	// Game platform picker state
	let pendingGame = $state<SearchResult | null>(null);
	let pendingPlayingOn = $state<string | undefined>(undefined);

	// Podcast platform picker state
	let pendingPodcast = $state<SearchResult | null>(null);
	let pendingListeningOn = $state<string | undefined>(undefined);

	const isSeries = $derived(slug === 'series');
	const isGame = $derived(slug === 'games');
	const isPodcast = $derived(slug === 'podcasts');
	const allSeasonsSelected = $derived(selectedSeasons.has(0));

	/** Available platforms from a game search result's meta.platform (comma-separated) */
	const pendingGamePlatforms = $derived(
		typeof pendingGame?.meta.platform === 'string'
			? pendingGame.meta.platform.split(', ').filter(Boolean)
			: []
	);

	function reset() {
		searchQuery = '';
		results = [];
		searching = false;
		adding = false;
		showManualForm = false;
		manual = emptyForm();
		pendingResult = null;
		pendingTotalSeasons = 0;
		selectedSeasons = new Set();
		loadingSeasons = false;
		pendingWatchingOn = undefined;
		pendingGame = null;
		pendingPlayingOn = undefined;
		pendingPodcast = null;
		pendingListeningOn = undefined;
	}

	function handleClose() {
		reset();
		onClose();
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		showManualForm = false;
		pendingResult = null;
		pendingGame = null;
		pendingPodcast = null;

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

	async function handleAddGame() {
		if (!pendingGame) return;
		adding = true;
		try {
			const enriched: SearchResult = {
				...pendingGame,
				meta: {
					...pendingGame.meta,
					...(pendingPlayingOn ? { playingOn: pendingPlayingOn } : {})
				}
			};
			await onAdd(enriched);
			handleClose();
		} catch (err) {
			console.error('add game failed', { slug, title: pendingGame?.title, err });
		} finally {
			adding = false;
		}
	}

	async function handleAddPodcast() {
		if (!pendingPodcast) return;
		adding = true;
		try {
			const enriched: SearchResult = {
				...pendingPodcast,
				meta: {
					...pendingPodcast.meta,
					...(pendingListeningOn ? { listeningOn: pendingListeningOn } : {})
				}
			};
			await onAdd(enriched);
			handleClose();
		} catch (err) {
			console.error('add podcast failed', { slug, title: pendingPodcast?.title, err });
		} finally {
			adding = false;
		}
	}

	async function handleSelect(result: SearchResult) {
		if (isGame) {
			// Game — show platform picker
			pendingGame = result;
			pendingPlayingOn = undefined;
			return;
		}

		if (isPodcast) {
			// Podcast — show platform picker
			pendingPodcast = result;
			pendingListeningOn = undefined;
			return;
		}

		if (!isSeries) {
			// Other types — add directly
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
		const next = new SvelteSet(selectedSeasons);
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
		const data: Record<string, unknown> = { title: manual.title.trim() };
		const year = parseInt(manual.year);
		if (!isNaN(year)) data.releaseYear = year;

		if (slug === 'books') {
			if (manual.author.trim()) data.author = manual.author.trim();
			if (manual.genre.trim()) data.genre = manual.genre.trim();
			const pages = parseInt(manual.pageCount);
			if (!isNaN(pages)) data.pageCount = pages;
			if (manual.isbn.trim()) data.isbn = manual.isbn.trim();
		} else if (slug === 'movies') {
			if (manual.director.trim()) data.director = manual.director.trim();
			if (manual.genre.trim()) data.genre = manual.genre.trim();
			const rt = parseInt(manual.runtime);
			if (!isNaN(rt)) data.runtime = rt;
		} else if (slug === 'series') {
			if (manual.creator.trim()) data.creator = manual.creator.trim();
			if (manual.genre.trim()) data.genre = manual.genre.trim();
			const ts = parseInt(manual.totalSeasons);
			if (!isNaN(ts)) data.totalSeasons = ts;
		} else if (slug === 'games') {
			if (manual.platform.trim()) data.platform = manual.platform.trim();
			if (manual.genre.trim()) data.genre = manual.genre.trim();
			if (manual.developer.trim()) data.developer = manual.developer.trim();
			if (manual.publisher.trim()) data.publisher = manual.publisher.trim();
		} else if (slug === 'podcasts') {
			if (manual.host.trim()) data.host = manual.host.trim();
			if (manual.genre.trim()) data.genre = manual.genre.trim();
			if (manual.publisher.trim()) data.publisher = manual.publisher.trim();
		}

		return data;
	}

	async function handleManualAdd() {
		if (!manual.title.trim()) return;
		adding = true;
		try {
			await onManualAdd(collectManualData());
			handleClose();
		} catch (err) {
			console.error('manual add failed', { slug, title: manual.title, err });
		} finally {
			adding = false;
		}
	}
</script>

{#snippet modalBody()}
	<div class="min-w-0 space-y-3">
		{#if pendingPodcast}
			<!-- Platform picker for podcasts -->
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<MediaCover title={pendingPodcast.title} coverUrl={pendingPodcast.coverUrl} size="md" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{pendingPodcast.title}</p>
						{#if pendingPodcast.meta.host}
							<p class="truncate text-xs text-muted-foreground">
								{pendingPodcast.meta.host}
							</p>
						{/if}
					</div>
				</div>

				<div class="space-y-1.5">
					<Label>Listening on</Label>
					<Select.Root type="single" bind:value={pendingListeningOn}>
						<Select.Trigger class="w-full">
							{pendingListeningOn ?? 'Select platform...'}
						</Select.Trigger>
						<Select.Content>
							{#each PODCAST_PLATFORMS as platform (platform)}
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
						onclick={() => (pendingPodcast = null)}
					>
						Back
					</Button>
					<Button size="sm" class="flex-1" onclick={handleAddPodcast} disabled={adding}>
						{adding ? 'Adding...' : 'Add'}
					</Button>
				</div>
			</div>
		{:else if pendingGame}
			<!-- Platform picker for games -->
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<MediaCover title={pendingGame.title} coverUrl={pendingGame.coverUrl} size="md" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{pendingGame.title}</p>
						{#if pendingGame.meta.developer}
							<p class="truncate text-xs text-muted-foreground">
								{pendingGame.meta.developer}
							</p>
						{/if}
					</div>
				</div>

				{#if pendingGamePlatforms.length > 0}
					<div class="space-y-1.5">
						<Label>Playing on</Label>
						<Select.Root type="single" bind:value={pendingPlayingOn}>
							<Select.Trigger class="w-full">
								{pendingPlayingOn ?? 'Select platform...'}
							</Select.Trigger>
							<Select.Content>
								{#each pendingGamePlatforms as platform (platform)}
									<Select.Item value={platform}>{platform}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<div class="flex gap-2">
					<Button variant="outline" size="sm" class="flex-1" onclick={() => (pendingGame = null)}>
						Back
					</Button>
					<Button size="sm" class="flex-1" onclick={handleAddGame} disabled={adding}>
						{adding ? 'Adding...' : 'Add'}
					</Button>
				</div>
			</div>
		{:else if pendingResult}
			<!-- Season picker for series -->
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<MediaCover title={pendingResult.title} coverUrl={pendingResult.coverUrl} size="md" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{pendingResult.title}</p>
						<p class="text-xs text-muted-foreground">Select seasons to add</p>
					</div>
				</div>

				{#if loadingSeasons}
					<p class="py-4 text-center text-sm text-muted-foreground">Loading seasons...</p>
				{:else}
					<div class="flex flex-wrap gap-1.5" role="group" aria-label="Seasons">
						<button
							aria-pressed={allSeasonsSelected}
							class="rounded border px-2.5 py-1 text-xs font-medium transition
							{allSeasonsSelected
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-muted text-muted-foreground hover:border-foreground/30'}"
							onclick={() => toggleSeason(0)}
						>
							All
						</button>
						{#each Array.from({ length: pendingTotalSeasons }, (_, i) => i + 1) as season (season)}
							{@const selected = selectedSeasons.has(season)}
							<button
								aria-pressed={selected}
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
							{#each STREAMING_PLATFORMS as platform (platform)}
								<Select.Item value={platform}>{platform}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex gap-2">
					<Button variant="outline" size="sm" class="flex-1" onclick={() => (pendingResult = null)}>
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
				type="search"
				enterkeyhint="search"
				placeholder="Search by title..."
				bind:value={searchQuery}
				oninput={handleInput}
				onkeydown={(e: KeyboardEvent) => {
					if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
				}}
			/>

			<!-- Provider attribution -->
			{#if results.length > 0}
				{#if slug === 'movies' || slug === 'series'}
					<p class="text-right text-[10px] text-muted-foreground/60">
						Data by <a
							href="https://www.themoviedb.org"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-muted-foreground">TMDB</a
						>
					</p>
				{:else if slug === 'games'}
					<p class="text-right text-[10px] text-muted-foreground/60">
						Data by <a
							href="https://www.igdb.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-muted-foreground">IGDB</a
						>
					</p>
				{/if}
			{/if}

			<!-- Results list (scrollable, capped height) -->
			<div class="min-h-0 overflow-y-auto sm:max-h-72" class:max-h-[40vh]={!showManualForm}>
				{#if searching}
					<p class="py-6 text-center text-sm text-muted-foreground">Searching...</p>
				{:else if results.length > 0}
					<div class="divide-y divide-border">
						{#each results as result (result.externalId)}
							<button
								class="flex w-full items-center gap-3 px-1 py-3 text-left transition hover:bg-accent disabled:opacity-50"
								onclick={() => handleSelect(result)}
								disabled={adding}
							>
								<MediaCover title={result.title} coverUrl={result.coverUrl} size="md" />
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

			<!-- Manual add toggle (always visible below results) -->
			{#if !showManualForm}
				<button
					class="w-full shrink-0 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
					onclick={() => (showManualForm = true)}
				>
					Add manually
				</button>
			{:else}
				<Separator />
				<div class="space-y-3" bind:this={manualFormEl}>
					<div class="space-y-1.5">
						<Label for="manual-title">Title *</Label>
						<Input id="manual-title" placeholder="Title" bind:value={manual.title} />
					</div>

					{#if slug === 'books'}
						<div class="space-y-1.5">
							<Label for="manual-author">Author</Label>
							<Input id="manual-author" placeholder="Author" bind:value={manual.author} />
						</div>
						<div class="space-y-1.5">
							<Label for="manual-genre">Genre</Label>
							<Input id="manual-genre" placeholder="Genre" bind:value={manual.genre} />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-pages">Pages</Label>
								<Input
									id="manual-pages"
									type="number"
									placeholder="320"
									bind:value={manual.pageCount}
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="manual-year">Year</Label>
								<Input id="manual-year" type="number" placeholder="2024" bind:value={manual.year} />
							</div>
						</div>
						<div class="space-y-1.5">
							<Label for="manual-isbn">ISBN</Label>
							<Input id="manual-isbn" placeholder="978-0-00-000000-0" bind:value={manual.isbn} />
						</div>
					{:else if slug === 'movies'}
						<div class="space-y-1.5">
							<Label for="manual-director">Director</Label>
							<Input id="manual-director" placeholder="Director" bind:value={manual.director} />
						</div>
						<div class="space-y-1.5">
							<Label for="manual-genre">Genre</Label>
							<Input id="manual-genre" placeholder="Genre" bind:value={manual.genre} />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-runtime">Runtime (min)</Label>
								<Input
									id="manual-runtime"
									type="number"
									placeholder="120"
									bind:value={manual.runtime}
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="manual-year">Year</Label>
								<Input id="manual-year" type="number" placeholder="2024" bind:value={manual.year} />
							</div>
						</div>
					{:else if slug === 'series'}
						<div class="space-y-1.5">
							<Label for="manual-creator">Creator</Label>
							<Input id="manual-creator" placeholder="Creator" bind:value={manual.creator} />
						</div>
						<div class="space-y-1.5">
							<Label for="manual-genre">Genre</Label>
							<Input id="manual-genre" placeholder="Genre" bind:value={manual.genre} />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-seasons">Total seasons</Label>
								<Input
									id="manual-seasons"
									type="number"
									placeholder="3"
									bind:value={manual.totalSeasons}
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="manual-year">Year</Label>
								<Input id="manual-year" type="number" placeholder="2024" bind:value={manual.year} />
							</div>
						</div>
					{:else if slug === 'games'}
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-developer">Developer</Label>
								<Input id="manual-developer" placeholder="Studio" bind:value={manual.developer} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-publisher">Publisher</Label>
								<Input
									id="manual-publisher"
									placeholder="Publisher"
									bind:value={manual.publisher}
								/>
							</div>
						</div>
						<div class="space-y-1.5">
							<Label for="manual-platform">Platforms</Label>
							<Input
								id="manual-platform"
								placeholder="PC, PS5, Switch..."
								bind:value={manual.platform}
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-genre">Genre</Label>
								<Input id="manual-genre" placeholder="Genre" bind:value={manual.genre} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-year">Year</Label>
								<Input id="manual-year" type="number" placeholder="2024" bind:value={manual.year} />
							</div>
						</div>
					{:else if slug === 'podcasts'}
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-host">Host</Label>
								<Input id="manual-host" placeholder="Host" bind:value={manual.host} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-publisher">Publisher</Label>
								<Input
									id="manual-publisher"
									placeholder="Publisher"
									bind:value={manual.publisher}
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-1.5">
								<Label for="manual-genre">Genre</Label>
								<Input id="manual-genre" placeholder="Genre" bind:value={manual.genre} />
							</div>
							<div class="space-y-1.5">
								<Label for="manual-year">Year</Label>
								<Input id="manual-year" type="number" placeholder="2024" bind:value={manual.year} />
							</div>
						</div>
					{/if}

					<Button
						class="w-full"
						size="sm"
						onclick={handleManualAdd}
						disabled={adding || !manual.title.trim()}
					>
						{adding ? 'Adding...' : 'Add'}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

{#if isDesktop.current}
	<Dialog.Root
		{open}
		onOpenChange={(v) => {
			if (!v) handleClose();
		}}
	>
		<Dialog.Content class="max-h-[85vh] overflow-x-hidden overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>Add item</Dialog.Title>
				<Dialog.Description class="sr-only">Search or manually add an item</Dialog.Description>
			</Dialog.Header>
			{@render modalBody()}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root
		{open}
		onOpenChange={(v) => {
			if (!v) handleClose();
		}}
	>
		<Drawer.Content>
			<Drawer.Header class="text-start">
				<Drawer.Title>Add item</Drawer.Title>
				<Drawer.Description class="sr-only">Search or manually add an item</Drawer.Description>
			</Drawer.Header>
			<div class="min-h-[60vh] px-4 pt-1 pb-4">
				{@render modalBody()}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
