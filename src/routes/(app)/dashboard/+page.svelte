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
	import type { Component } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { stats } = data;

	// --- Media type cards config ---

	const TYPE_ICONS: Record<MediaType, Component<{ class?: string }>> = {
		book: BookOpen,
		movie: Film,
		series: Tv,
		game: Gamepad2,
		podcast: Podcast
	};

	const TYPE_COLORS = MEDIA_TYPE_COLORS;

	const typeCards = MEDIA_TYPES.map((type) => ({
		type,
		slug: mediaTypeToSlug(type),
		label: MEDIA_TYPE_LABELS[type].plural,
		icon: TYPE_ICONS[type],
		color: TYPE_COLORS[type],
		total: stats.typeCounts[type].total,
		completed: stats.typeCounts[type].completed
	}));

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
	<!-- Header -->
	<div>
		<h1 class="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
		<p class="mt-0.5 text-xs text-muted-foreground">
			{stats.totalItems} item{stats.totalItems !== 1 ? 's' : ''} tracked &middot;
			{stats.totalCompleted} completed
		</p>
	</div>

	<!-- Media type cards -->
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
		{#each typeCards as card (card.type)}
			<a
				href="/{card.slug}"
				class="group relative overflow-hidden rounded-lg border border-border bg-card p-3 transition hover:border-transparent hover:shadow-md"
			>
				<div
					class="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-[0.08] dark:group-hover:opacity-[0.12]"
					style:background={card.color}
				></div>
				<div class="relative flex items-center gap-2.5">
					<span style:color={card.color}>
						<card.icon class="size-4" />
					</span>
					<div class="min-w-0">
						<span class="text-xs font-medium text-foreground">{card.label}</span>
						<div class="flex items-baseline gap-1.5">
							<span class="text-base font-bold text-foreground tabular-nums">{card.total}</span>
							<span class="text-[10px] text-muted-foreground">{card.completed} done</span>
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<!-- Activity heatmap -->
	<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
		<h2 class="mb-2 text-xs font-medium text-foreground">Activity</h2>
		<div class="overflow-x-auto">
			<div class="min-w-[580px]">
				<ActivityHeatmap
					addedActivity={stats.addedActivity}
					completedActivity={stats.completedActivity}
					totalItems={stats.totalItems}
				/>
			</div>
		</div>
	</div>

	<!-- Middle row: status donut + genres + completions chart -->
	<div class="grid gap-4 lg:grid-cols-6">
		<!-- Status distribution -->
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4 lg:col-span-2">
			<h2 class="mb-1 text-xs font-medium text-foreground">Status Distribution</h2>
			<StatusDonut statusCounts={stats.statusCounts} totalItems={stats.totalItems} />
		</div>

		<!-- Top genres -->
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4 lg:col-span-2">
			<h2 class="mb-1 text-xs font-medium text-foreground">Top Genres</h2>
			<GenreChart genres={stats.topGenres} />
		</div>

		<!-- Completions area chart -->
		<div class="rounded-lg border border-border bg-card p-3 sm:p-4 lg:col-span-2">
			<h2 class="mb-1 text-xs font-medium text-foreground">Completions</h2>
			{#if chartData.length > 0}
				<Chart.Container config={chartConfig} class="h-[180px] w-full">
					<AreaChart
						data={chartData}
						x="monthLabel"
						series={chartSeries}
						seriesLayout="stack"
						props={{
							area: {
								curve: curveMonotoneX,
								line: { class: 'stroke-1' },
								'fill-opacity': 0.4
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			{:else}
				<div class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
					No completions yet
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom row: recently added -->
	<div class="rounded-lg border border-border bg-card p-3 sm:p-4">
		<h2 class="mb-2 text-xs font-medium text-foreground">Recently Added</h2>
		{#if stats.recentItems.length > 0}
			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
				{#each stats.recentItems as item (item.title + item.createdAt)}
					<div class="flex items-center gap-2.5 rounded-md p-1.5 transition hover:bg-accent">
						<MediaCover title={item.title} coverUrl={item.coverUrl} size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-xs font-medium text-foreground">{item.title}</p>
							<p class="text-[10px] text-muted-foreground">
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
			<div class="flex h-16 items-center justify-center text-sm text-muted-foreground">
				No items yet
			</div>
		{/if}
	</div>
</div>
