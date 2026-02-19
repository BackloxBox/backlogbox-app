<script lang="ts">
	import { MEDIA_TYPES, MEDIA_TYPE_LABELS, MEDIA_TYPE_COLORS } from '$lib/types';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { AreaChart, Area, LinearGradient, BarChart, PieChart, Text } from 'layerchart';
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import Users from '@lucide/svelte/icons/users';
	import Activity from '@lucide/svelte/icons/activity';
	import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
	import Package from '@lucide/svelte/icons/package';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const stats = $derived(data.stats);

	// --- Time range filter (client-side) ---

	type Range = '7d' | '30d' | '90d' | 'all';
	let range = $state<Range>('30d');

	const RANGE_DAYS: Record<Range, number | null> = {
		'7d': 7,
		'30d': 30,
		'90d': 90,
		all: null
	};

	function cutoffDate(r: Range): string | null {
		const days = RANGE_DAYS[r];
		if (days === null) return null;
		const ms = Date.now() - days * 24 * 60 * 60 * 1000;
		return new Date(ms).toISOString().slice(0, 10);
	}

	function filterByRange<T extends { date: string }>(rows: T[], r: Range): T[] {
		const cutoff = cutoffDate(r);
		if (!cutoff) return rows;
		return rows.filter((row) => row.date >= cutoff);
	}

	// --- Derived filtered data ---

	const filteredSignups = $derived(filterByRange(stats.signupsByDay, range));
	const filteredItems = $derived(filterByRange(stats.itemsByDay, range));

	// Compute period totals from filtered data
	const periodSignups = $derived(filteredSignups.reduce((s, r) => s + r.count, 0));
	const periodItems = $derived(
		filteredItems.reduce((s, r) => s + MEDIA_TYPES.reduce((acc, t) => acc + (r[t] ?? 0), 0), 0)
	);

	// --- Signup area chart ---

	const signupChartData = $derived(
		filteredSignups.map((r) => ({ date: new Date(r.date), signups: r.count }))
	);

	const signupChartConfig = {
		signups: { label: 'Signups', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	// --- Items stacked area chart ---

	const itemsChartData = $derived(
		filteredItems.map((r) => ({
			date: new Date(r.date),
			book: r.book ?? 0,
			movie: r.movie ?? 0,
			series: r.series ?? 0,
			game: r.game ?? 0,
			podcast: r.podcast ?? 0
		}))
	);

	const itemsChartConfig = Object.fromEntries(
		MEDIA_TYPES.map((t) => [t, { label: MEDIA_TYPE_LABELS[t].plural, color: MEDIA_TYPE_COLORS[t] }])
	) satisfies Chart.ChartConfig;

	const itemsSeries = MEDIA_TYPES.map((t) => ({
		key: t,
		label: MEDIA_TYPE_LABELS[t].plural,
		color: MEDIA_TYPE_COLORS[t]
	}));

	// --- User status donut ---

	const USER_STATUS_COLORS: Record<string, string> = {
		subscribed: '#22C55E',
		trial: '#3B82F6',
		free_access: '#A855F7',
		expired: '#EF4444',
		no_trial: '#6B7280'
	};

	const USER_STATUS_LABELS: Record<string, string> = {
		subscribed: 'Subscribed',
		trial: 'Trial',
		free_access: 'Free Access',
		expired: 'Expired',
		no_trial: 'No Trial'
	};

	const donutData = $derived(
		stats.userStatusBreakdown
			.filter((s) => s.status !== 'deleted')
			.map((s) => ({
				name: USER_STATUS_LABELS[s.status] ?? s.status,
				count: s.count,
				color: USER_STATUS_COLORS[s.status] ?? '#6B7280'
			}))
	);

	const donutConfig = $derived(
		Object.fromEntries(
			donutData.map((d) => [d.name, { label: d.name, color: d.color }])
		) as Chart.ChartConfig
	);

	// --- Items by type bar chart ---

	const typeBarData = $derived(
		stats.itemsByType.map((r) => ({
			label: MEDIA_TYPE_LABELS[r.type].plural,
			type: r.type,
			count: r.count,
			color: MEDIA_TYPE_COLORS[r.type]
		}))
	);

	const typeBarConfig = $derived(
		Object.fromEntries(
			typeBarData.map((d) => [d.label, { label: d.label, color: d.color }])
		) as Chart.ChartConfig
	);

	// --- Helpers ---

	function pct(n: number): string {
		return `${Math.round(n * 100)}%`;
	}

	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'subscribed':
				return 'bg-green-500/10 text-green-500 border-green-500/30';
			case 'trial':
				return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
			case 'free_access':
				return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
			case 'expired':
				return 'bg-red-500/10 text-red-500 border-red-500/30';
			default:
				return 'bg-muted text-muted-foreground border-border';
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard | BacklogBox</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
			<p class="text-sm text-muted-foreground">App-wide metrics and growth</p>
		</div>
		<div class="flex gap-1 rounded-lg bg-muted p-1">
			{#each ['7d', '30d', '90d', 'all'] as const as r (r)}
				<button
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
						{range === r
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (range = r)}
				>
					{r === 'all' ? 'All' : r.toUpperCase()}
				</button>
			{/each}
		</div>
	</div>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		<div class="rounded-lg border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Users class="size-4" />
				Total Users
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.totalUsers}</p>
			<p class="text-xs text-muted-foreground">+{periodSignups} in period</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Activity class="size-4" />
				Active (30d)
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.activeUsers30d}</p>
			<p class="text-xs text-muted-foreground">{stats.activeUsers7d} in last 7d</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<ArrowRightLeft class="size-4" />
				Conversion
			</div>
			<p class="mt-1 text-2xl font-bold">{pct(stats.conversionRate)}</p>
			<p class="text-xs text-muted-foreground">
				{stats.subscribedCount} paid / {stats.expiredCount} expired
			</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Package class="size-4" />
				Total Items
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.totalItems}</p>
			<p class="text-xs text-muted-foreground">+{periodItems} in period</p>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<BarChart3 class="size-4" />
				Avg/User
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.avgItemsPerUser}</p>
			<p class="text-xs text-muted-foreground">{stats.usersWithZeroItems} with 0 items</p>
		</div>
	</div>

	<Separator />

	<!-- User Growth Chart -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">User Growth</h2>
		{#if signupChartData.length > 1}
			<div class="rounded-lg border bg-card p-4">
				<Chart.Container config={signupChartConfig} class="h-[250px] w-full">
					<AreaChart
						data={signupChartData}
						x="date"
						xScale={scaleUtc()}
						yPadding={[0, 25]}
						series={[{ key: 'signups', label: 'Signups', color: 'var(--color-signups)' }]}
						props={{
							area: {
								curve: curveMonotoneX,
								'fill-opacity': 0.4,
								line: { class: 'stroke-1' },
								motion: 'tween'
							},
							xAxis: {
								format: (v: Date) =>
									v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip
								indicator="dot"
								labelFormatter={(v: Date) =>
									v.toLocaleDateString('en-US', {
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})}
							/>
						{/snippet}
						{#snippet marks({ series, getAreaProps })}
							{#each series as s, i (s.key)}
								<LinearGradient
									stops={[
										s.color ?? '',
										'color-mix(in lch, ' + (s.color ?? '') + ' 10%, transparent)'
									]}
									vertical
								>
									{#snippet children({ gradient })}
										<Area {...getAreaProps(s, i)} fill={gradient} />
									{/snippet}
								</LinearGradient>
							{/each}
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</div>
		{:else}
			<div
				class="flex h-[250px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground"
			>
				Not enough data for this period
			</div>
		{/if}
	</section>

	<!-- Items Added Over Time -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Items Added Over Time</h2>
		{#if itemsChartData.length > 1}
			<div class="rounded-lg border bg-card p-4">
				<Chart.Container config={itemsChartConfig} class="h-[250px] w-full">
					<AreaChart
						data={itemsChartData}
						x="date"
						xScale={scaleUtc()}
						yPadding={[0, 25]}
						series={itemsSeries}
						seriesLayout="stack"
						props={{
							area: {
								curve: curveMonotoneX,
								'fill-opacity': 0.4,
								line: { class: 'stroke-1' },
								motion: 'tween'
							},
							xAxis: {
								format: (v: Date) =>
									v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							},
							yAxis: { format: () => '' }
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip indicator="dot" />
						{/snippet}
						{#snippet marks({ series, getAreaProps })}
							{#each series as s, i (s.key)}
								<LinearGradient
									stops={[
										s.color ?? '',
										'color-mix(in lch, ' + (s.color ?? '') + ' 10%, transparent)'
									]}
									vertical
								>
									{#snippet children({ gradient })}
										<Area {...getAreaProps(s, i)} fill={gradient} />
									{/snippet}
								</LinearGradient>
							{/each}
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</div>
		{:else}
			<div
				class="flex h-[250px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground"
			>
				Not enough data for this period
			</div>
		{/if}
	</section>

	<Separator />

	<!-- Side by side: User Status + Items by Type -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- User Status Donut -->
		<section class="space-y-3">
			<h2 class="text-lg font-semibold">User Status</h2>
			<div class="rounded-lg border bg-card p-4">
				{#if donutData.length > 0}
					<Chart.Container config={donutConfig} class="mx-auto aspect-square max-h-[250px]">
						<PieChart
							data={donutData}
							key="name"
							value="count"
							c="color"
							innerRadius={55}
							padding={20}
							props={{ pie: { motion: 'tween' } }}
						>
							{#snippet aboveMarks()}
								<Text
									value={String(stats.totalUsers)}
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-foreground text-3xl! font-bold"
									dy={-4}
								/>
								<Text
									value="users"
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-muted-foreground! text-xs!"
									dy={18}
								/>
							{/snippet}
							{#snippet tooltip()}
								<Chart.Tooltip nameKey="name" indicator="dot" />
							{/snippet}
						</PieChart>
					</Chart.Container>
				{:else}
					<div class="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
						No users
					</div>
				{/if}
			</div>
		</section>

		<!-- Items by Type Bar -->
		<section class="space-y-3">
			<h2 class="text-lg font-semibold">Items by Type</h2>
			<div class="rounded-lg border bg-card p-4">
				{#if typeBarData.length > 0}
					<Chart.Container config={typeBarConfig} class="h-[250px] w-full">
						<BarChart
							data={typeBarData}
							x="label"
							series={[{ key: 'count', label: 'Items', color: 'var(--chart-1)' }]}
							props={{
								bars: { stroke: 'none', rounded: 'all', radius: 5 },
								highlight: { area: { fill: 'none' } },
								xAxis: {
									tickLabelProps: {
										class: 'text-xs'
									}
								}
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip labelKey="type" indicator="dot" />
							{/snippet}
						</BarChart>
					</Chart.Container>
				{:else}
					<div class="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
						No items
					</div>
				{/if}
			</div>
		</section>
	</div>

	<Separator />

	<!-- Top Users Table -->
	<section class="space-y-3">
		<h2 class="text-lg font-semibold">Top Users</h2>
		<div class="overflow-x-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b text-left text-muted-foreground">
						<th class="px-4 py-3 font-medium">#</th>
						<th class="px-4 py-3 font-medium">User</th>
						<th class="px-4 py-3 text-right font-medium">Items</th>
						<th class="px-4 py-3 font-medium">Last Active</th>
						<th class="px-4 py-3 font-medium">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each stats.topUsers as row, i (row.username ?? row.name)}
						<tr class="border-b last:border-0">
							<td class="px-4 py-3 text-muted-foreground">{i + 1}</td>
							<td class="px-4 py-3 font-medium">
								{row.username ?? row.name}
							</td>
							<td class="px-4 py-3 text-right tabular-nums">{row.itemCount}</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.lastActive ?? '—'}
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium {statusBadgeClass(
										row.status
									)}"
								>
									{USER_STATUS_LABELS[row.status] ?? row.status}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Footer stats -->
	<div class="flex flex-wrap gap-4 pb-8 text-xs text-muted-foreground">
		<span>Custom lists: {stats.totalCustomLists}</span>
		<span>Trial: {stats.trialCount}</span>
		<span>Free access: {stats.freeAccessCount}</span>
	</div>
</div>
