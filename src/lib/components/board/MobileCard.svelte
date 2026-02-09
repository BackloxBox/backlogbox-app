<script lang="ts">
	import MediaCover from './MediaCover.svelte';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let { item, onclick }: Props = $props();

	/** Star rating display */
	function stars(rating: number | null): string {
		if (rating === null || rating === undefined) return '';
		return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
	}

	/** Season badge label for series items (e.g. "S2" or "All") */
	const seasonBadge = $derived.by(() => {
		if (!item.seriesMeta) return null;
		const s = item.seriesMeta.currentSeason;
		return s ? `S${s}` : 'All';
	});

	/** Runtime badge for movies (e.g. "1h 32m") */
	const runtimeBadge = $derived.by(() => {
		const rt = item.movieMeta?.runtime;
		if (!rt) return null;
		const h = Math.floor(rt / 60);
		const m = rt % 60;
		return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
	});

	const sub = $derived.by(() => {
		if (item.bookMeta) {
			const parts = [item.bookMeta.author, item.bookMeta.genre].filter(Boolean);
			return parts.join(' \u00b7 ');
		}
		if (item.movieMeta) {
			const parts = [
				item.releaseYear ? String(item.releaseYear) : null,
				item.movieMeta.genre
			].filter(Boolean);
			return parts.join(' \u00b7 ');
		}
		if (item.seriesMeta) return item.seriesMeta.genre ?? '';
		if (item.gameMeta) return item.gameMeta.genre ?? item.gameMeta.platform ?? '';
		if (item.podcastMeta?.host) return item.podcastMeta.host;
		return '';
	});
</script>

<div
	role="button"
	tabindex="0"
	class="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition hover:bg-accent"
	onclick={() => onclick?.(item)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') onclick?.(item);
	}}
>
	<div class="flex gap-2.5">
		<div class="relative shrink-0">
			<MediaCover title={item.title} coverUrl={item.coverUrl} size="md" />
			{#if seasonBadge}
				<span
					class="absolute -right-1.5 -bottom-1 rounded bg-primary px-1 py-0.5 text-[10px] leading-none font-bold text-primary-foreground"
				>
					{seasonBadge}
				</span>
			{/if}
			{#if runtimeBadge}
				<span
					class="absolute -right-1.5 -bottom-1 rounded bg-muted px-1 py-0.5 text-[10px] leading-none font-semibold text-foreground shadow-sm ring-1 ring-border"
				>
					{runtimeBadge}
				</span>
			{/if}
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-foreground">{item.title}</p>
			{#if sub}
				<p class="truncate text-xs text-muted-foreground">{sub}</p>
			{/if}
			{#if item.rating}
				<p class="mt-0.5 text-xs text-amber-400">{stars(item.rating)}</p>
			{/if}
		</div>
	</div>
</div>
