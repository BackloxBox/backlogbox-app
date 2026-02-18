<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { MEDIA_TYPE_LABELS, MEDIA_TYPE_COLORS, type MediaType } from '$lib/types';

	type GenreEntry = { genre: string; type: MediaType; count: number };

	type Props = {
		genres: GenreEntry[];
	};

	let { genres }: Props = $props();

	const TYPE_COLORS = MEDIA_TYPE_COLORS;

	const chartData = $derived(
		genres.map((g) => ({
			label: `${g.genre}`,
			genre: g.genre,
			type: MEDIA_TYPE_LABELS[g.type].singular,
			count: g.count,
			color: TYPE_COLORS[g.type]
		}))
	);

	/** Config keyed by genre so tooltip label resolves */
	const chartConfig = $derived(
		Object.fromEntries([
			['count', { label: 'Items' }],
			...genres.map((g) => [
				g.genre,
				{ label: `${g.genre} (${MEDIA_TYPE_LABELS[g.type].singular})`, color: TYPE_COLORS[g.type] }
			])
		]) as Chart.ChartConfig
	);
</script>

{#if genres.length > 0}
	<Chart.Container config={chartConfig} class="h-[260px] w-full">
		<BarChart
			data={chartData}
			xScale={scaleBand().padding(0.3)}
			x="label"
			axis="x"
			series={[{ key: 'count', label: 'Items', color: 'var(--chart-1)' }]}
			padding={{ bottom: 60 }}
			props={{
				bars: {
					stroke: 'none',
					rounded: 'all',
					radius: 5,
					initialHeight: 0
				},
				highlight: { area: { fill: 'none' } },
				xAxis: {
					format: (d: string) => (d.length > 12 ? d.slice(0, 11) + '\u2026' : d),
					tickLabelProps: {
						rotate: -45,
						textAnchor: 'end' as const,
						dy: 4,
						class: 'text-[10px]'
					}
				}
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip labelKey="genre" indicator="dot" />
			{/snippet}
		</BarChart>
	</Chart.Container>
{:else}
	<div class="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
		No genre data yet
	</div>
{/if}
