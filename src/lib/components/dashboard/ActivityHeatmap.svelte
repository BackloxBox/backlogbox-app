<script lang="ts">
	/**
	 * GitHub-style activity heatmap — pure CSS grid, 53 columns x 7 rows.
	 * Blue gradient from transparent through 4 intensity levels.
	 */

	type DayActivity = { date: string; count: number };

	type Props = {
		addedActivity: DayActivity[];
		completedActivity: DayActivity[];
		totalItems: number;
	};

	let { addedActivity, completedActivity, totalItems }: Props = $props();

	/** Merge added + completed into total per-day counts */
	const dailyCounts = $derived.by(() => {
		const map = new Map<string, number>();
		for (const { date, count } of addedActivity) {
			map.set(date, (map.get(date) ?? 0) + count);
		}
		for (const { date, count } of completedActivity) {
			map.set(date, (map.get(date) ?? 0) + count);
		}
		return map;
	});

	/** Generate 371 days (53 weeks) ending today, aligned to start on Sunday */
	const cells = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// End of the grid is Saturday of this week (or today's week-end)
		const endDay = new Date(today);
		// Walk forward to Saturday
		endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

		// Start from 52 weeks before endDay's Sunday
		const startDay = new Date(endDay);
		startDay.setDate(startDay.getDate() - 52 * 7);

		const result: Array<{ date: string; count: number; col: number; row: number }> = [];
		const cursor = new Date(startDay);
		let col = 0;

		while (cursor <= endDay) {
			const row = cursor.getDay(); // 0=Sun .. 6=Sat
			const dateStr = cursor.toISOString().slice(0, 10);
			const isFuture = cursor > today;
			result.push({
				date: dateStr,
				count: isFuture ? -1 : (dailyCounts.get(dateStr) ?? 0),
				col,
				row
			});

			// Advance
			cursor.setDate(cursor.getDate() + 1);
			if (cursor.getDay() === 0) col++;
		}

		return result;
	});

	/** Month labels positioned at their starting column */
	const monthLabels = $derived.by(() => {
		const labels: Array<{ label: string; col: number }> = [];
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
		let lastMonth = -1;

		for (const cell of cells) {
			if (cell.row !== 0) continue; // Only check Sundays (top row)
			const month = new Date(cell.date + 'T00:00:00').getMonth();
			if (month !== lastMonth) {
				labels.push({ label: months[month], col: cell.col });
				lastMonth = month;
			}
		}

		return labels;
	});

	/** Current streak — consecutive days with activity ending today */
	const streak = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let days = 0;
		const cursor = new Date(today);

		while (true) {
			const dateStr = cursor.toISOString().slice(0, 10);
			if ((dailyCounts.get(dateStr) ?? 0) > 0) {
				days++;
				cursor.setDate(cursor.getDate() - 1);
			} else {
				break;
			}
		}

		return days;
	});

	/** Map count to intensity level 0-4 */
	function intensity(count: number): number {
		if (count <= 0) return 0;
		if (count === 1) return 1;
		if (count <= 3) return 2;
		if (count <= 5) return 3;
		return 4;
	}

	/** Format date for tooltip */
	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="space-y-2">
	<!-- Month labels -->
	<div class="flex pl-8">
		<div class="relative h-4 flex-1" style="--cols: 53">
			{#each monthLabels as { label, col }}
				<span
					class="absolute top-0 text-[10px] text-muted-foreground"
					style="left: calc({col} / 53 * 100%)"
				>
					{label}
				</span>
			{/each}
		</div>
	</div>

	<!-- Grid -->
	<div class="flex gap-1">
		<!-- Day labels -->
		<div class="flex w-6 shrink-0 flex-col justify-between py-px text-[10px] text-muted-foreground">
			<span></span>
			<span>Mon</span>
			<span></span>
			<span>Wed</span>
			<span></span>
			<span>Fri</span>
			<span></span>
		</div>

		<!-- Heatmap cells -->
		<div class="heatmap-grid flex-1" style="--cols: 53">
			{#each cells as cell (cell.date)}
				{@const level = cell.count === -1 ? -1 : intensity(cell.count)}
				<div
					class="heatmap-cell"
					class:future={level === -1}
					data-level={level}
					style="grid-column: {cell.col + 1}; grid-row: {cell.row + 1}"
					title={level === -1
						? ''
						: `${formatDate(cell.date)}: ${cell.count} item${cell.count !== 1 ? 's' : ''}`}
				></div>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<span>
			{totalItems} item{totalItems !== 1 ? 's' : ''} tracked{#if streak > 0}
				&middot; {streak}-day streak
			{/if}
		</span>
		<div class="flex items-center gap-1">
			<span>Less</span>
			{#each [0, 1, 2, 3, 4] as level}
				<div class="heatmap-cell legend" data-level={level}></div>
			{/each}
			<span>More</span>
		</div>
	</div>
</div>

<style>
	.heatmap-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(7, 1fr);
		gap: 2px;
	}

	.heatmap-cell {
		aspect-ratio: 1;
		border-radius: 3px;
		min-width: 0;
	}

	.heatmap-cell.legend {
		width: 10px;
		height: 10px;
	}

	.heatmap-cell.future {
		background: transparent;
	}

	.heatmap-cell[data-level='0'] {
		background: var(--heatmap-0, oklch(0.95 0 0));
	}
	.heatmap-cell[data-level='1'] {
		background: var(--heatmap-1, #dbeafe);
	}
	.heatmap-cell[data-level='2'] {
		background: var(--heatmap-2, #93c5fd);
	}
	.heatmap-cell[data-level='3'] {
		background: var(--heatmap-3, #3b82f6);
	}
	.heatmap-cell[data-level='4'] {
		background: var(--heatmap-4, #1d4ed8);
	}

	:global(.dark) .heatmap-cell[data-level='0'] {
		background: var(--heatmap-0-dark, oklch(0.25 0 0));
	}
	:global(.dark) .heatmap-cell[data-level='1'] {
		background: var(--heatmap-1-dark, #1e3a5f);
	}
	:global(.dark) .heatmap-cell[data-level='2'] {
		background: var(--heatmap-2-dark, #1d4ed8);
	}
	:global(.dark) .heatmap-cell[data-level='3'] {
		background: var(--heatmap-3-dark, #3b82f6);
	}
	:global(.dark) .heatmap-cell[data-level='4'] {
		background: var(--heatmap-4-dark, #60a5fa);
	}
</style>
