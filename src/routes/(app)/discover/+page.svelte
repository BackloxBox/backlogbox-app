<script lang="ts">
	import { dev } from '$app/environment';
	import {
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		slugToMediaType,
		type MediaTypeSlug
	} from '$lib/types';
	import { getTrending, getRecommendations, getAnticipated } from './discover.remote';
	import { addItem } from '../[type=mediaType]/data.remote';
	import { debugMode } from '$lib/components/dev/debug-state.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import { trackEvent } from '$lib/analytics';
	import type { SearchResult } from '$lib/server/search';
	import type { CacheDebugMeta } from '$lib/server/search/cache';
	import Plus from '@lucide/svelte/icons/plus';
	import Info from '@lucide/svelte/icons/info';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Rocket from '@lucide/svelte/icons/rocket';
	import Sparkles from '@lucide/svelte/icons/sparkles';
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

	async function handleAdd(result: SearchResult) {
		if (!type || addingIds.has(result.externalId)) return;

		addingIds = new Set([...addingIds, result.externalId]);
		try {
			await addItem({
				slug: activeTab,
				title: result.title,
				coverUrl: result.coverUrl,
				releaseYear: result.releaseYear,
				status: 'backlog',
				...result.meta
			});
			trackEvent('item_added', { type, source: 'discover' });
			toast.success(`Added "${result.title}" to backlog`);
		} catch (err) {
			if (!handleSubscriptionError(err)) {
				toast.error(`Failed to add "${result.title}"`);
			}
		} finally {
			addingIds = new Set([...addingIds].filter((id) => id !== result.externalId));
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
			<div class="flex items-center gap-2">
				<span style:color="#3B82F6"><Sparkles class="size-5" /></span>
				<h2 class="text-lg font-semibold">For You</h2>
			</div>

			{#if recsQuery.error}
				<p class="py-8 text-center text-sm text-muted-foreground">
					Could not load recommendations right now.
				</p>
			{:else if recsQuery.loading}
				{#each Array(2) as _, i (i)}
					<div class="space-y-3">
						<div class="h-4 w-48 animate-pulse rounded bg-muted"></div>
						<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
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
							{#if showDebug && group._debug}
								<span
									class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] {debugBadgeClass(
										group._debug
									)}"
								>
									{debugLabel(group._debug)}
								</span>
							{/if}
						</div>
						<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
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
					<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
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
					<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
						{#each anticipatedData.slice(0, 20) as result (result.externalId)}
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
				<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
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
				<div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
					{#each trendingData.slice(0, 20) as result (result.externalId)}
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
							<p class="truncate text-[11px] text-muted-foreground">{subtitle(result)}</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
