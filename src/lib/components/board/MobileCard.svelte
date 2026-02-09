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

	const sub = $derived.by(() => {
		if (item.bookMeta?.author) return item.bookMeta.author;
		if (item.movieMeta?.director) return item.movieMeta.director;
		if (item.seriesMeta?.totalSeasons) return `${item.seriesMeta.totalSeasons} seasons`;
		if (item.gameMeta?.platform) return item.gameMeta.platform;
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
		<MediaCover title={item.title} coverUrl={item.coverUrl} size="md" />
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
