<script lang="ts">
	import MediaCover from './MediaCover.svelte';
	import Pin from '@lucide/svelte/icons/pin';
	import { formatStars, getBadge, getSubtitle } from './card-utils';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
	};

	let { item }: Props = $props();

	const badge = $derived(getBadge(item));
	const sub = $derived(getSubtitle(item));
</script>

<div class="flex gap-2.5">
	<div class="relative shrink-0">
		<MediaCover title={item.title} coverUrl={item.coverUrl} size="md" />
		{#if badge}
			<span
				class="absolute -right-1.5 -bottom-1 rounded bg-muted px-1 py-0.5 text-[10px] leading-none font-semibold text-foreground shadow-sm ring-1 ring-border"
			>
				{badge}
			</span>
		{/if}
	</div>
	<div class="min-w-0 flex-1">
		<p class="flex items-center gap-1 truncate text-sm font-medium text-foreground">
			{#if item.pinned}<Pin
					class="size-3 shrink-0 fill-muted-foreground text-muted-foreground"
				/>{/if}
			<span class="truncate">{item.title}</span>
		</p>
		{#if sub}
			<p class="truncate text-xs text-muted-foreground">{sub}</p>
		{/if}
		{#if item.rating}
			<p class="mt-0.5 text-xs text-amber-400">{formatStars(item.rating)}</p>
		{/if}
	</div>
</div>
