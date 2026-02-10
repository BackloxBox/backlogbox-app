<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { PieChart, Text } from 'layerchart';
	import { STATUS_COLORS, type MediaStatus } from '$lib/types';

	type StatusEntry = { status: MediaStatus; count: number };

	type Props = {
		statusCounts: StatusEntry[];
		totalItems: number;
	};

	let { statusCounts, totalItems }: Props = $props();

	const STATUS_LABELS: Record<MediaStatus, string> = {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'In Progress',
		on_hold: 'On Hold',
		completed: 'Completed',
		abandoned: 'Abandoned'
	};

	/** Use human-readable labels as keys so tooltip config lookup works */
	const chartData = $derived(
		statusCounts.map((s) => ({
			name: STATUS_LABELS[s.status],
			count: s.count,
			color: STATUS_COLORS[s.status]
		}))
	);

	const chartConfig = $derived(
		Object.fromEntries(
			statusCounts.map((s) => [
				STATUS_LABELS[s.status],
				{ label: STATUS_LABELS[s.status], color: STATUS_COLORS[s.status] }
			])
		) as Chart.ChartConfig
	);
</script>

{#if statusCounts.length > 0}
	<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[180px]">
		<PieChart
			data={chartData}
			key="name"
			value="count"
			c="color"
			innerRadius={50}
			padding={20}
			props={{ pie: { motion: 'tween' } }}
		>
			{#snippet aboveMarks()}
				<Text
					value={String(totalItems)}
					textAnchor="middle"
					verticalAnchor="middle"
					class="fill-foreground text-2xl! font-bold"
					dy={-2}
				/>
				<Text
					value="items"
					textAnchor="middle"
					verticalAnchor="middle"
					class="fill-muted-foreground! text-xs! text-muted-foreground"
					dy={16}
				/>
			{/snippet}
			{#snippet tooltip()}
				<Chart.Tooltip nameKey="name" indicator="dot" />
			{/snippet}
		</PieChart>
	</Chart.Container>
{:else}
	<div class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
		No items yet
	</div>
{/if}
