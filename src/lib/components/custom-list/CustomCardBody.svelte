<script lang="ts">
	import MediaCover from '$lib/components/board/MediaCover.svelte';
	import { formatStars } from '$lib/components/board/card-utils';
	import type { CustomListItemWithFields } from '$lib/server/db/custom-list-queries';

	type Props = {
		item: CustomListItemWithFields;
	};

	let { item }: Props = $props();
</script>

<div class="flex gap-2.5">
	<div class="relative shrink-0">
		<MediaCover title={item.title} coverUrl={item.imageUrl} size="md" />
	</div>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-foreground">{item.title}</p>
		{#if item.subtitle}
			<p class="truncate text-xs text-muted-foreground">{item.subtitle}</p>
		{/if}
		{#if item.rating}
			<p class="mt-0.5 text-xs text-amber-400">{formatStars(item.rating)}</p>
		{/if}
	</div>
</div>
