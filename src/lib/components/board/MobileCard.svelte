<script lang="ts">
	import MediaCover from './MediaCover.svelte';
	import {
		formatStars,
		getSeasonBadge,
		getYearBadge,
		getRuntimeBadge,
		getSubtitle
	} from './card-utils';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let { item, onclick }: Props = $props();

	const seasonBadge = $derived(getSeasonBadge(item));
	const yearBadge = $derived(getYearBadge(item));
	const runtimeBadge = $derived(getRuntimeBadge(item));
	const sub = $derived(getSubtitle(item));
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
					class="absolute -right-1.5 -bottom-1 rounded bg-muted px-1 py-0.5 text-[10px] leading-none font-semibold text-foreground shadow-sm ring-1 ring-border"
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
			{#if yearBadge}
				<span
					class="absolute -right-1.5 -bottom-1 rounded bg-muted px-1 py-0.5 text-[10px] leading-none font-semibold text-foreground shadow-sm ring-1 ring-border"
				>
					{yearBadge}
				</span>
			{/if}
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-foreground">{item.title}</p>
			{#if sub}
				<p class="truncate text-xs text-muted-foreground">{sub}</p>
			{/if}
			{#if item.rating}
				<p class="mt-0.5 text-xs text-amber-400">{formatStars(item.rating)}</p>
			{/if}
		</div>
	</div>
</div>
