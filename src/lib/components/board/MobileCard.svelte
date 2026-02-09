<script lang="ts">
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
	class="cursor-pointer rounded-md border border-gray-700 bg-gray-800 p-3 transition hover:border-gray-600"
	onclick={() => onclick?.(item)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') onclick?.(item);
	}}
>
	<div class="flex gap-3">
		{#if item.coverUrl}
			<img src={item.coverUrl} alt="" class="h-16 w-11 shrink-0 rounded-sm object-cover" />
		{/if}
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-white">{item.title}</p>
			{#if sub}
				<p class="truncate text-xs text-gray-400">{sub}</p>
			{/if}
			{#if item.rating}
				<p class="mt-1 text-xs text-amber-400">{stars(item.rating)}</p>
			{/if}
		</div>
	</div>
</div>
