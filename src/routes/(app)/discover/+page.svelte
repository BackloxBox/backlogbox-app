<script lang="ts">
	import {
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		slugToMediaType,
		type MediaTypeSlug
	} from '$lib/types';
	import { getTrending, getRecommendations } from './discover.remote';
	import { addItem } from '../[type=mediaType]/data.remote';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import type { SearchResult } from '$lib/server/search';
	import Plus from '@lucide/svelte/icons/plus';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
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

	// Fetch data reactively when tab changes
	const trendingQuery = $derived(getTrending(activeTab));
	const recsQuery = $derived(getRecommendations(activeTab));

	function titleToHue(t: string): number {
		let hash = 0;
		for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
		return ((hash % 360) + 360) % 360;
	}

	/** Subtitle string for a search result based on its meta */
	function subtitle(result: SearchResult): string {
		const meta = result.meta;
		const parts: string[] = [];

		if ('author' in meta && meta.author) parts.push(meta.author as string);
		if ('director' in meta && meta.director) parts.push(meta.director as string);
		if ('host' in meta && meta.host) parts.push(meta.host as string);
		if ('developer' in meta && meta.developer) parts.push(meta.developer as string);
		if ('genre' in meta && meta.genre && parts.length === 0) parts.push(meta.genre as string);

		if (result.releaseYear) parts.push(String(result.releaseYear));
		return parts.join(' \u00b7 ');
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

<div class="mx-auto max-w-5xl space-y-6 p-4 pt-14 sm:p-6 lg:pt-6">
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
				onclick={() => (activeTab = slug)}
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
						<div class="flex gap-3 overflow-x-auto pb-2">
							{#each Array(5) as _, j (j)}
								<div class="w-32 shrink-0 animate-pulse space-y-1.5">
									<div class="aspect-[2/3] rounded-md bg-muted"></div>
									<div class="h-3 w-3/4 rounded bg-muted"></div>
									<div class="h-3 w-1/2 rounded bg-muted"></div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{:else if (recsQuery.current ?? []).length === 0}
				<div
					class="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground"
				>
					Add some {type ? MEDIA_TYPE_LABELS[type].plural.toLowerCase() : 'items'} to your library to
					get personalized recommendations.
				</div>
			{:else}
				{#each recsQuery.current ?? [] as group, i (i)}
					<div class="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
						<h3 class="text-sm font-medium text-muted-foreground">
							Because you added
							<span
								class="font-semibold text-foreground"
								style:color={type ? MEDIA_TYPE_COLORS[type] : undefined}
							>
								{group.seedTitle}
							</span>
						</h3>
						<div class="flex gap-3 overflow-x-auto pb-1">
							{#each group.items as result (result.externalId)}
								{@const isAdding = addingIds.has(result.externalId)}
								<div class="group w-32 shrink-0 space-y-1.5">
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
										<div
											class="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
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
	{/if}

	<!-- Trending -->
	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<span style:color="#A855F7"><TrendingUp class="size-5" /></span>
			<h2 class="text-lg font-semibold">Trending</h2>
		</div>

		{#if trendingQuery.error}
			<p class="py-8 text-center text-sm text-muted-foreground">
				Could not load trending items right now.
			</p>
		{:else if trendingQuery.loading}
			<div
				class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
			>
				{#each Array(10) as _, i (i)}
					<div class="animate-pulse space-y-1.5">
						<div class="aspect-[2/3] rounded-md bg-muted"></div>
						<div class="h-3 w-3/4 rounded bg-muted"></div>
						<div class="h-3 w-1/2 rounded bg-muted"></div>
					</div>
				{/each}
			</div>
		{:else if (trendingQuery.current ?? []).length === 0}
			<p class="py-8 text-center text-sm text-muted-foreground">
				No trending items available right now.
			</p>
		{:else}
			<div
				class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
			>
				{#each (trendingQuery.current ?? []).slice(0, 14) as result (result.externalId)}
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
							<div
								class="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
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
	</section>
</div>
