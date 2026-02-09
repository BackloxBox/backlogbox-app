<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
		index?: number;
		group?: string;
		isOverlay?: boolean;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let { item, index = 0, group = '', isOverlay = false, onclick }: Props = $props();

	// useSortable is a hook that must be called unconditionally;
	// when used as overlay, we still call it but won't attach the ref
	const sortable = useSortable({
		id: () => item.id,
		index: () => index,
		group: () => group,
		type: 'item',
		accept: 'item',
		data: () => ({ group })
	});

	const ref = $derived(isOverlay ? undefined : sortable.ref);
	const isDragging = $derived(sortable.isDragging.current);

	/** Star rating display */
	function stars(rating: number | null): string {
		if (rating === null || rating === undefined) return '';
		return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
	}

	/** Subtitle based on media type metadata */
	const sub = $derived.by(() => {
		if (item.bookMeta?.author) return item.bookMeta.author;
		if (item.movieMeta?.director) return item.movieMeta.director;
		if (item.seriesMeta?.totalSeasons) return `${item.seriesMeta.totalSeasons} seasons`;
		if (item.gameMeta?.platform) return item.gameMeta.platform;
		if (item.podcastMeta?.host) return item.podcastMeta.host;
		return '';
	});
</script>

{#snippet cardContent()}
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
{/snippet}

{#if ref}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		{@attach ref}
		role="button"
		tabindex="0"
		class="cursor-pointer rounded-md border border-gray-700 bg-gray-800 p-3 transition select-none
		{isDragging ? 'opacity-30' : 'opacity-100'}
		{isOverlay ? 'shadow-xl ring-2 ring-indigo-500' : 'hover:border-gray-600'}"
		onclick={() => onclick?.(item)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onclick?.(item);
		}}
	>
		{@render cardContent()}
	</div>
{:else}
	<div
		class="rounded-md border border-gray-700 bg-gray-800 p-3
		{isOverlay ? 'shadow-xl ring-2 ring-indigo-500' : ''}"
	>
		{@render cardContent()}
	</div>
{/if}
