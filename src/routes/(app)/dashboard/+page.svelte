<script lang="ts">
	import {
		MEDIA_TYPES,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		mediaTypeToSlug,
		type MediaType
	} from '$lib/types';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { AreaChart } from 'layerchart';
	import { curveMonotoneX } from 'd3-shape';
	import ActivityHeatmap from '$lib/components/dashboard/ActivityHeatmap.svelte';
	import GenreChart from '$lib/components/dashboard/GenreChart.svelte';
	import StatusDonut from '$lib/components/dashboard/StatusDonut.svelte';
	import MediaCover from '$lib/components/board/MediaCover.svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Flame from '@lucide/svelte/icons/flame';
	import type { Component } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const stats = $derived(data.stats);

	// --- Media type cards config ---

	const TYPE_ICONS: Record<MediaType, Component<{ class?: string }>> = {
		book: BookOpen,
		movie: Film,
		series: Tv,
		game: Gamepad2,
		podcast: Podcast
	};

	const TYPE_COLORS = MEDIA_TYPE_COLORS;

	const typeCards = $derived(
		MEDIA_TYPES.map((type) => ({
			type,
			slug: mediaTypeToSlug(type),
			label: MEDIA_TYPE_LABELS[type].plural,
			icon: TYPE_ICONS[type],
			color: TYPE_COLORS[type],
			total: stats.typeCounts[type].total,
			completed: stats.typeCounts[type].completed
		}))
	);

	// --- Area chart config ---

	const chartConfig = {
		book: { label: 'Books', color: TYPE_COLORS.book },
		movie: { label: 'Movies', color: TYPE_COLORS.movie },
		series: { label: 'Series', color: TYPE_COLORS.series },
		game: { label: 'Games', color: TYPE_COLORS.game },
		podcast: { label: 'Podcasts', color: TYPE_COLORS.podcast }
	} satisfies Chart.ChartConfig;

	const chartSeries = MEDIA_TYPES.map((type) => ({
		key: type,
		label: MEDIA_TYPE_LABELS[type].plural,
		color: TYPE_COLORS[type]
	}));

	const chartData = $derived(
		stats.monthlyCompletions.map((row) => ({
			...row,
			monthLabel: formatMonth(row.month)
		}))
	);

	/** Completion rate as percentage */
	const completionRate = $derived(
		stats.totalItems > 0 ? Math.round((stats.totalCompleted / stats.totalItems) * 100) : 0
	);

	/** Items added in last 30 days */
	const recentlyAddedCount = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- local computation, not reactive state
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);
		return stats.addedActivity.filter((d) => d.date >= cutoff).reduce((sum, d) => sum + d.count, 0);
	});

	function formatMonth(yyyymm: string): string {
		const [, month] = yyyymm.split('-');
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		return months[parseInt(month, 10) - 1] ?? month;
	}

	function timeAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - new Date(date).getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		const diffWeeks = Math.floor(diffDays / 7);
		if (diffWeeks < 4) return `${diffWeeks}w ago`;
		const diffMonths = Math.floor(diffDays / 30);
		return `${diffMonths}mo ago`;
	}
</script>

<div class="space-y-4 p-4 lg:p-6">
	<!-- Header row: title + summary stats -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">Your collection at a glance</p>
		</div>
		<div class="flex gap-6">
			<div class="text-right">
				<p class="text-2xl font-bold text-foreground tabular-nums">{stats.totalItems}</p>
				<p class="text-xs text-muted-foreground">total items</p>
			</div>
			<div class="text-right">
				<div class="flex items-center justify-end gap-1.5">
					<TrendingUp class="size-3.5 text-emerald-500" />
					<p class="text-2xl font-bold text-foreground tabular-nums">{completionRate}%</p>
				</div>
				<p class="text-xs text-muted-foreground">completed</p>
			</div>
			<div class="text-right">
				<div class="flex items-center justify-end gap-1.5">
					<Flame class="size-3.5 text-amber-500" />
					<p class="text-2xl font-bold text-foreground tabular-nums">{recentlyAddedCount}</p>
				</div>
				<p class="text-xs text-muted-foreground">added (30d)</p>
			</div>
		</div>
	</div>

	<!-- Media type cards -->
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
		{#each typeCards as card (card.type)}
			<a
				href="/{card.slug}"
				class="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
			>
				<!-- Colored gradient background on hover -->
				<div
					class="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					style:background="linear-gradient(135deg, {card.color}08, {card.color}15)"
				></div>
				<div class="relative">
					<div class="flex items-center gap-2">
						<div
							class="flex size-7 items-center justify-center rounded-lg transition-colors duration-200"
							style:background="{card.color}15"
							style:color={card.color}
						>
							<card.icon class="size-3.5" />
						</div>
						<span class="text-xs font-medium text-muted-foreground">{card.label}</span>
					</div>
					<div class="mt-2 flex items-baseline gap-2">
						<span class="text-lg font-bold text-foreground tabular-nums">{card.total}</span>
						{#if card.completed > 0}
							<span class="text-xs text-muted-foreground">{card.completed} done</span>
						{/if}
					</div>
					{#if card.total > 0}
						<!-- Mini progress bar -->
						<div class="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full transition-all duration-500"
								style:background={card.color}
								style:width="{Math.round((card.completed / card.total) * 100)}%"
							></div>
						</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>

	<!-- Activity heatmap -->
	<div class="rounded-xl border border-border bg-card p-3 sm:p-4">
		<h2 class="mb-2 text-sm font-medium text-foreground">Activity</h2>
		<div class="scrollbar-none overflow-x-auto">
			<div class="min-w-[580px]">
				<ActivityHeatmap
					addedActivity={stats.addedActivity}
					completedActivity={stats.completedActivity}
					totalItems={stats.totalItems}
				/>
			</div>
		</div>
	</div>

	<!-- Charts row: status + completions (wider) -->
	<div class="grid gap-3 lg:grid-cols-5">
		<!-- Status distribution — donut -->
		<div class="rounded-xl border border-border bg-card p-3 sm:p-4 lg:col-span-2">
			<h2 class="mb-0.5 text-sm font-medium text-foreground">Status Breakdown</h2>
			<p class="mb-1.5 text-xs text-muted-foreground">Across all media types</p>
			<StatusDonut statusCounts={stats.statusCounts} totalItems={stats.totalItems} />
		</div>

		<!-- Completions over time — area chart -->
		<div class="rounded-xl border border-border bg-card p-3 sm:p-4 lg:col-span-3">
			<h2 class="mb-0.5 text-sm font-medium text-foreground">Completions</h2>
			<p class="mb-1.5 text-xs text-muted-foreground">Last 6 months by media type</p>
			{#if chartData.length > 0}
				<Chart.Container config={chartConfig} class="h-[200px] w-full">
					<AreaChart
						data={chartData}
						x="monthLabel"
						series={chartSeries}
						seriesLayout="stack"
						props={{
							area: {
								curve: curveMonotoneX,
								line: { class: 'stroke-1' },
								'fill-opacity': 0.35
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			{:else}
				<div class="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
					No completions yet
				</div>
			{/if}
		</div>
	</div>

	<!-- Genres row -->
	<div class="grid gap-3 lg:grid-cols-5">
		<!-- Top genres -->
		<div class="rounded-xl border border-border bg-card p-3 sm:p-4 lg:col-span-3">
			<h2 class="mb-0.5 text-sm font-medium text-foreground">Top Genres</h2>
			<p class="mb-1.5 text-xs text-muted-foreground">Most tracked genres across your collection</p>
			<GenreChart genres={stats.topGenres} />
		</div>

		<!-- Recently added -->
		<div class="rounded-xl border border-border bg-card p-3 sm:p-4 lg:col-span-2">
			<h2 class="mb-2 text-sm font-medium text-foreground">Recently Added</h2>
			{#if stats.recentItems.length > 0}
				<div class="space-y-1">
					{#each stats.recentItems as item, i (item.title + item.createdAt)}
						<div
							class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
						>
							<span class="w-4 text-center text-xs font-medium text-muted-foreground tabular-nums">
								{i + 1}
							</span>
							<MediaCover title={item.title} coverUrl={item.coverUrl} size="sm" />
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{item.title}</p>
								<p class="text-xs text-muted-foreground">
									<span style:color={TYPE_COLORS[item.type]}>
										{MEDIA_TYPE_LABELS[item.type].singular}
									</span>
									&middot; {timeAgo(item.createdAt)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex h-32 items-center justify-center text-sm text-muted-foreground">
					No items yet
				</div>
			{/if}
		</div>
	</div>
</div>
