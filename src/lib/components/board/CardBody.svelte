<script lang="ts">
	import MediaCover from './MediaCover.svelte';
	import Pin from '@lucide/svelte/icons/pin';
	import { formatStars, getBadge, getSubtitle, getProgress } from './card-utils';
	import { MEDIA_TYPE_COLORS } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
	};

	let { item }: Props = $props();

	const badge = $derived(getBadge(item));
	const sub = $derived(getSubtitle(item));
	const progress = $derived(getProgress(item));
	const progressPct = $derived(
		progress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0
	);
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
{#if progress}
	<div
		class="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted"
		role="progressbar"
		aria-valuenow={progress.current}
		aria-valuemin={0}
		aria-valuemax={progress.total}
		aria-label="{progressPct}% complete"
	>
		<div
			class="h-full rounded-full transition-[width] duration-300"
			style="width: {progressPct}%; background-color: {MEDIA_TYPE_COLORS[item.type]}"
		></div>
	</div>
{/if}
