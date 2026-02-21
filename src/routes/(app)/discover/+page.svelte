<script lang="ts">
	import { dev } from '$app/environment';
	import {
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		MEDIA_STATUSES,
		STATUS_LABELS,
		slugToMediaType,
		type MediaTypeSlug,
		type MediaStatus
	} from '$lib/types';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		getTrending,
		getRecommendations,
		getAnticipated,
		excludeSeed,
		undoExcludeSeed,
		fetchExcludedSeeds,
		type RecommendationGroup
	} from './discover.remote';
	import { addItem } from '../[type=mediaType]/data.remote';
	import { debugMode } from '$lib/components/dev/debug-state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import { trackEvent } from '$lib/analytics';
	import { invalidateAll } from '$app/navigation';
	import type { SearchResult } from '$lib/server/search';
	import type { CacheDebugMeta } from '$lib/server/search/cache';
	import Plus from '@lucide/svelte/icons/plus';
	import Info from '@lucide/svelte/icons/info';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import type { Component } from 'svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';

	const TAB_ICONS: Record<MediaTypeSlug, Component<{ class?: string }>> = {
		books: BookOpen,
		movies: Film,
		series: Tv,
		games: Gamepad2,
		podcasts: Podcast
	};

	let activeTab = $state<MediaTypeSlug>('movies');
	let addingIds = $state(new Set<string>());

	const type = $derived(slugToMediaType(activeTab));

	const ANTICIPATED_TABS = new Set<MediaTypeSlug>(['movies', 'series', 'games']);

	// Fetch data reactively when tab changes
	const trendingQuery = $derived(getTrending(activeTab));
	const recsQuery = $derived(getRecommendations(activeTab));
	const anticipatedQuery = $derived(
		ANTICIPATED_TABS.has(activeTab) ? getAnticipated(activeTab) : null
	);

	// Unwrap response data
	const trendingData = $derived(trendingQuery.current?.data ?? []);
	const trendingDebug = $derived(trendingQuery.current?._debug ?? null);
	const recsData = $derived(recsQuery.current?.data ?? []);
	const anticipatedData = $derived(anticipatedQuery?.current?.data ?? []);
	const anticipatedDebug = $derived(anticipatedQuery?.current?._debug ?? null);

	const anticipatedLabel = $derived(activeTab === 'games' ? 'Anticipated' : 'Upcoming');

	const showDebug = $derived(dev && debugMode.enabled);

	function titleToHue(t: string): number {
		let hash = 0;
		for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
		return ((hash % 360) + 360) % 360;
	}

	/** Format ISO date (YYYY-MM-DD) as short localized string (e.g. "Mar 15, 2026") */
	function formatDate(iso: string): string {
		const [year, month, day] = iso.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	/** Subtitle string for a search result based on its meta */
	function subtitle(result: SearchResult, options?: { showFullDate?: boolean }): string {
		const meta = result.meta;
		const parts: string[] = [];

		if ('author' in meta && meta.author) parts.push(meta.author as string);
		if ('director' in meta && meta.director) parts.push(meta.director as string);
		if ('host' in meta && meta.host) parts.push(meta.host as string);
		if ('developer' in meta && meta.developer) parts.push(meta.developer as string);
		if ('genre' in meta && meta.genre && parts.length === 0) parts.push(meta.genre as string);

		if (options?.showFullDate && result.releaseDate) {
			parts.push(formatDate(result.releaseDate));
		} else if (result.releaseYear) {
			parts.push(String(result.releaseYear));
		}
		return parts.join(' \u00b7 ');
	}

	function debugBadgeClass(debug: CacheDebugMeta): string {
		switch (debug.source) {
			case 'cache-fresh':
				return 'border-green-500/50 bg-green-500/10 text-green-400';
			case 'cache-stale':
				return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
			case 'fetch':
				return 'border-red-500/50 bg-red-500/10 text-red-400';
			case 'coalesced':
				return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
			default: {
				const _exhaustive: never = debug.source;
				return _exhaustive;
			}
		}
	}

	function debugLabel(debug: CacheDebugMeta): string {
		const label =
			debug.source === 'cache-fresh'
				? 'CACHED'
				: debug.source === 'cache-stale'
					? 'STALE'
					: debug.source === 'coalesced'
						? 'COALESCED'
						: 'FRESH';

		const parts = [label];
		if (debug.ageMs !== null) {
			const sec = Math.round(debug.ageMs / 1000);
			parts.push(sec < 60 ? `${sec}s ago` : `${Math.round(sec / 60)}m ago`);
		}
		if (debug.fetchDurationMs !== null) {
			parts.push(`${debug.fetchDurationMs}ms`);
		}
		parts.push(debug.provider);
		return parts.join(' · ');
	}

	function debugBorderClass(debug: CacheDebugMeta | null): string {
		if (!debug) return '';
		switch (debug.source) {
			case 'cache-fresh':
				return 'ring-2 ring-green-500/40';
			case 'cache-stale':
				return 'ring-2 ring-yellow-500/40';
			case 'fetch':
				return 'ring-2 ring-red-500/40';
			case 'coalesced':
				return 'ring-2 ring-blue-500/40';
			default: {
				const _exhaustive: never = debug.source;
				return _exhaustive;
			}
		}
	}

	async function handleAdd(result: SearchResult, status: MediaStatus = 'backlog') {
		if (!type || addingIds.has(result.externalId)) return;

		addingIds = new Set([...addingIds, result.externalId]);
		try {
			await addItem({
				slug: activeTab,
				title: result.title,
				coverUrl: result.coverUrl,
				releaseYear: result.releaseYear,
				status,
				...result.meta
			});
			trackEvent('item_added', { type, source: 'discover' });
			toast.success(`Added "${result.title}" to ${status.replace('_', ' ')}`);
		} catch (err) {
			if (!handleSubscriptionError(err)) {
				toast.error(`Failed to add "${result.title}"`);
			}
		} finally {
			addingIds = new Set([...addingIds].filter((id) => id !== result.externalId));
		}
	}

	// --- Exclude seeds ---

	let excludeConfirm = $state<{ group: RecommendationGroup } | null>(null);
	let manageExcludedOpen = $state(false);
	let excludedSeedsQuery = $derived(manageExcludedOpen ? fetchExcludedSeeds() : null);
	let excludedSeeds = $derived(excludedSeedsQuery?.current ?? []);

	async function handleExclude(group: RecommendationGroup) {
		excludeConfirm = null;
		try {
			for (const id of group.seedItemIds) {
				await excludeSeed({ mediaItemId: id });
			}
			await invalidateAll();
			toast(`Excluded "${group.seedTitle}" from recommendations`, {
				action: {
					label: 'Undo',
					onClick: async () => {
						for (const id of group.seedItemIds) {
							await undoExcludeSeed({ mediaItemId: id });
						}
						await invalidateAll();
					}
				}
			});
			trackEvent('seed_excluded', { title: group.seedTitle });
		} catch (err) {
			if (!handleSubscriptionError(err)) {
				toast.error('Failed to exclude item');
			}
		}
	}

	async function handleRestore(mediaItemId: string) {
		try {
			await undoExcludeSeed({ mediaItemId });
			await invalidateAll();
			toast.success('Restored item for recommendations');
		} catch (err) {
			if (!handleSubscriptionError(err)) {
				toast.error('Failed to restore item');
			}
		}
	}
</script>

<svelte:head>
	<title>Discover | BacklogBox</title>
</svelte:head>

<div class="space-y-6 p-4 pt-14 lg:p-6 lg:pt-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Discover</h1>
		<p class="text-sm text-muted-foreground">Trending and personalized recommendations</p>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
		{#each MEDIA_TYPE_SLUGS as slug (slug)}
			{@const tabType = slugToMediaType(slug)}
			{@const isActive = slug === activeTab}
			{@const Icon = TAB_ICONS[slug]}
			<button
				class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors
					{isActive
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => {
					activeTab = slug;
					trackEvent('discover_tab_viewed', { tab: slug });
				}}
			>
				<Icon class="size-4" />
				<span class="hidden sm:inline">
					{tabType ? MEDIA_TYPE_LABELS[tabType].plural : slug}
				</span>
			</button>
		{/each}
	</div>

	<!-- Recommendations -->
	{#if type !== 'podcast'}
		<section class="space-y-6">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<span style:color="#3B82F6"><Sparkles class="size-5" /></span>
					<h2 class="text-lg font-semibold">For You</h2>
				</div>
				<Button
					variant="ghost"
					size="sm"
					class="h-7 gap-1.5 text-xs text-muted-foreground"
					onclick={() => (manageExcludedOpen = true)}
				>
					<SettingsIcon class="size-3" />
					Manage
				</Button>
			</div>

			{#if recsQuery.error}
				<p class="py-8 text-center text-sm text-muted-foreground">
					Could not load recommendations right now.
				</p>
			{:else if recsQuery.loading}
				{#each Array(2) as _, i (i)}
					<div class="space-y-3">
						<div class="h-4 w-48 animate-pulse rounded bg-muted"></div>
						<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
							{#each Array(5) as _, j (j)}
								<div class="animate-pulse space-y-1.5">
									<div class="aspect-[2/3] rounded-md bg-muted"></div>
									<div class="h-3 w-3/4 rounded bg-muted"></div>
									<div class="h-3 w-1/2 rounded bg-muted"></div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{:else if recsData.length === 0}
				<div
					class="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-center text-sm text-muted-foreground"
				>
					Add some {type ? MEDIA_TYPE_LABELS[type].plural.toLowerCase() : 'items'} to your library to
					get personalized recommendations.
				</div>
			{:else}
				{#each recsData as group, i (i)}
					<div
						class="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4 {showDebug &&
						group._debug
							? debugBorderClass(group._debug)
							: ''}"
					>
						<div class="flex items-center justify-between gap-2">
							<h3 class="text-sm font-medium text-muted-foreground">
								Because you added
								<span
									class="font-semibold text-foreground"
									style:color={type ? MEDIA_TYPE_COLORS[type] : undefined}
								>
									{group.seedTitle}
								</span>
							</h3>
							<div class="flex shrink-0 items-center gap-1.5">
								{#if showDebug && group._debug}
									<span
										class="rounded border px-1.5 py-0.5 font-mono text-[10px] {debugBadgeClass(
											group._debug
										)}"
									>
										{debugLabel(group._debug)}
									</span>
								{/if}
								<Tooltip.Root>
									<Tooltip.Trigger>
										<button
											class="rounded-md p-1 text-muted-foreground/60 transition hover:bg-muted hover:text-muted-foreground"
											onclick={() => (excludeConfirm = { group })}
											aria-label="Don't recommend based on {group.seedTitle}"
										>
											<EyeOff class="size-3.5" />
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>Don't recommend based on this</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</div>
						</div>
						<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
							{#each group.items as result (result.externalId)}
								{@const isAdding = addingIds.has(result.externalId)}
								<div class="group space-y-1.5">
									<div class="relative aspect-[2/3] overflow-hidden rounded-md">
										{#if result.coverUrl}
											<img
												src={result.coverUrl}
												alt={result.title}
												loading="lazy"
												class="h-full w-full object-cover"
											/>
										{:else}
											<div
												class="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80 select-none"
												style:background-color="hsl({titleToHue(result.title)} 40% 30%)"
											>
												{result.title.trim().charAt(0).toUpperCase()}
											</div>
										{/if}
										{#if result.description}
											<Popover.Root>
												<Popover.Trigger
													class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white/80 transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
												>
													<Info class="size-3" />
												</Popover.Trigger>
												<Popover.Content
													class="max-h-64 w-64 overflow-y-auto text-xs"
													side="bottom"
													align="end"
												>
													<p>{result.description}</p>
												</Popover.Content>
											</Popover.Root>
										{/if}
										<div
											class="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
										>
											<Button
												variant="secondary"
												size="sm"
												class="h-7 w-full text-xs"
												disabled={isAdding}
												onclick={() => handleAdd(result)}
											>
												{#if isAdding}
													<LoaderCircle class="size-3 animate-spin" />
												{:else}
													<Plus class="size-3" />
												{/if}
												Add
											</Button>
										</div>
									</div>
									<p class="truncate text-xs font-medium">{result.title}</p>
									<p class="truncate text-[11px] text-muted-foreground">
										{subtitle(result)}
									</p>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</section>
		<Separator />
	{/if}

	<!-- Anticipated / Upcoming -->
	{#if anticipatedQuery}
		<section class="space-y-3">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<span style:color="#F97316"><Rocket class="size-5" /></span>
					<h2 class="text-lg font-semibold">{anticipatedLabel}</h2>
				</div>
				{#if showDebug && anticipatedDebug}
					<span
						class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] {debugBadgeClass(
							anticipatedDebug
						)}"
					>
						{debugLabel(anticipatedDebug)}
					</span>
				{/if}
			</div>

			<div
				class="rounded-lg border border-border/50 bg-muted/20 p-4 {showDebug && anticipatedDebug
					? debugBorderClass(anticipatedDebug)
					: ''}"
			>
				{#if anticipatedQuery.error}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Could not load {anticipatedLabel.toLowerCase()} items right now.
					</p>
				{:else if anticipatedQuery.loading}
					<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
						{#each Array(10) as _, i (i)}
							<div class="animate-pulse space-y-1.5">
								<div class="aspect-[2/3] rounded-md bg-muted"></div>
								<div class="h-3 w-3/4 rounded bg-muted"></div>
								<div class="h-3 w-1/2 rounded bg-muted"></div>
							</div>
						{/each}
					</div>
				{:else if anticipatedData.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						No {anticipatedLabel.toLowerCase()} items available right now.
					</p>
				{:else}
					<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
						{#each anticipatedData.slice(0, 20) as result (result.externalId)}
							{@const isAdding = addingIds.has(result.externalId)}
							<div class="group space-y-1.5">
								<div class="relative aspect-[2/3] overflow-hidden rounded-md">
									{#if result.coverUrl}
										<img
											src={result.coverUrl}
											alt={result.title}
											crossorigin="anonymous"
											loading="lazy"
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80 select-none"
											style:background-color="hsl({titleToHue(result.title)} 40% 30%)"
										>
											{result.title.trim().charAt(0).toUpperCase()}
										</div>
									{/if}
									{#if result.description}
										<Popover.Root>
											<Popover.Trigger
												class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white/80 transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
											>
												<Info class="size-3" />
											</Popover.Trigger>
											<Popover.Content
												class="max-h-64 w-64 overflow-y-auto text-xs"
												side="bottom"
												align="end"
											>
												<p>{result.description}</p>
											</Popover.Content>
										</Popover.Root>
									{/if}
									<div
										class="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
									>
										<Button
											variant="secondary"
											size="sm"
											class="h-7 w-full text-xs"
											disabled={isAdding}
											onclick={() => handleAdd(result)}
										>
											{#if isAdding}
												<LoaderCircle class="size-3 animate-spin" />
											{:else}
												<Plus class="size-3" />
											{/if}
											Add
										</Button>
									</div>
								</div>
								<p class="truncate text-xs font-medium">{result.title}</p>
								<p class="truncate text-[11px] text-muted-foreground">
									{subtitle(result, { showFullDate: true })}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
		<Separator />
	{/if}

	<!-- Trending -->
	<section class="space-y-3">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<span style:color="#A855F7"><TrendingUp class="size-5" /></span>
				<h2 class="text-lg font-semibold">Trending</h2>
			</div>
			{#if showDebug && trendingDebug}
				<span
					class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] {debugBadgeClass(
						trendingDebug
					)}"
				>
					{debugLabel(trendingDebug)}
				</span>
			{/if}
		</div>

		<div
			class="rounded-lg border border-border/50 bg-muted/20 p-4 {showDebug && trendingDebug
				? debugBorderClass(trendingDebug)
				: ''}"
		>
			{#if trendingQuery.error}
				<p class="py-8 text-center text-sm text-muted-foreground">
					Could not load trending items right now.
				</p>
			{:else if trendingQuery.loading}
				<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
					{#each Array(10) as _, i (i)}
						<div class="animate-pulse space-y-1.5">
							<div class="aspect-[2/3] rounded-md bg-muted"></div>
							<div class="h-3 w-3/4 rounded bg-muted"></div>
							<div class="h-3 w-1/2 rounded bg-muted"></div>
						</div>
					{/each}
				</div>
			{:else if trendingData.length === 0}
				<p class="py-8 text-center text-sm text-muted-foreground">
					No trending items available right now.
				</p>
			{:else}
				<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
					{#each trendingData.slice(0, 20) as result (result.externalId)}
						{@const isAdding = addingIds.has(result.externalId)}
						<div class="group space-y-1.5">
							<div class="relative aspect-[2/3] overflow-hidden rounded-md">
								{#if result.coverUrl}
									<img
										src={result.coverUrl}
										alt={result.title}
										crossorigin="anonymous"
										loading="lazy"
										class="h-full w-full object-cover"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80 select-none"
										style:background-color="hsl({titleToHue(result.title)} 40% 30%)"
									>
										{result.title.trim().charAt(0).toUpperCase()}
									</div>
								{/if}
								{#if result.description}
									<Popover.Root>
										<Popover.Trigger
											class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white/80 transition-opacity hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
										>
											<Info class="size-3" />
										</Popover.Trigger>
										<Popover.Content
											class="max-h-64 w-64 overflow-y-auto text-xs"
											side="bottom"
											align="end"
										>
											<p>{result.description}</p>
										</Popover.Content>
									</Popover.Root>
								{/if}
								<div
									class="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
								>
									<div class="flex w-full gap-px">
										<Button
											variant="secondary"
											size="sm"
											class="h-7 flex-1 rounded-r-none text-xs"
											disabled={isAdding}
											onclick={() => handleAdd(result)}
										>
											{#if isAdding}
												<LoaderCircle class="size-3 animate-spin" />
											{:else}
												<Plus class="size-3" />
											{/if}
											Add
										</Button>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												class="flex h-7 items-center rounded-r-md bg-secondary px-1 text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
												disabled={isAdding}
											>
												<ChevronDown class="size-3" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content align="end" class="min-w-[8rem]">
													{#each MEDIA_STATUSES as s (s)}
														<DropdownMenu.Item onclick={() => handleAdd(result, s)}>
															{type ? STATUS_LABELS[type][s] : s}
														</DropdownMenu.Item>
													{/each}
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</div>
								</div>
							</div>
							<p class="truncate text-xs font-medium">{result.title}</p>
							<p class="truncate text-[11px] text-muted-foreground">{subtitle(result)}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<!-- Exclude confirmation dialog -->
<AlertDialog.Root
	open={excludeConfirm !== null}
	onOpenChange={(open) => {
		if (!open) excludeConfirm = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Exclude from recommendations?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if excludeConfirm}
					Recommendations based on <strong>{excludeConfirm.group.seedTitle}</strong> will no longer appear.
					You can restore this anytime from the Manage menu.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					if (excludeConfirm) handleExclude(excludeConfirm.group);
				}}>Exclude</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Manage excluded seeds dialog -->
<Dialog.Root bind:open={manageExcludedOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Excluded items</Dialog.Title>
			<Dialog.Description>
				These items won't be used for recommendations. Restore them to use them again.
			</Dialog.Description>
		</Dialog.Header>
		{#if excludedSeeds.length === 0}
			<p class="py-6 text-center text-sm text-muted-foreground">No excluded items yet.</p>
		{:else}
			<div class="max-h-80 space-y-2 overflow-y-auto">
				{#each excludedSeeds as seed (seed.mediaItemId)}
					<div class="flex items-center gap-3 rounded-lg border border-border/50 p-2">
						<div class="size-10 shrink-0 overflow-hidden rounded">
							{#if seed.coverUrl}
								<img src={seed.coverUrl} alt={seed.title} class="h-full w-full object-cover" />
							{:else}
								<div
									class="flex h-full w-full items-center justify-center text-xs font-semibold text-white/80"
									style:background-color="hsl({titleToHue(seed.title)} 40% 30%)"
								>
									{seed.title.trim().charAt(0).toUpperCase()}
								</div>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{seed.title}</p>
							<p class="text-[11px] text-muted-foreground capitalize">{seed.type}</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 shrink-0 gap-1.5 text-xs"
							onclick={() => handleRestore(seed.mediaItemId)}
						>
							<RotateCcw class="size-3" />
							Restore
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
