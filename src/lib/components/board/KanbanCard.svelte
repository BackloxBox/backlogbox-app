<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
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
		index?: number;
		group?: string;
		isOverlay?: boolean;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let { item, index = 0, group = '', isOverlay = false, onclick }: Props = $props();

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

	const seasonBadge = $derived(getSeasonBadge(item));
	const yearBadge = $derived(getYearBadge(item));
	const runtimeBadge = $derived(getRuntimeBadge(item));
	const sub = $derived(getSubtitle(item));
</script>

{#snippet cardContent()}
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
{/snippet}

{#if ref}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		{@attach ref}
		role="button"
		tabindex="0"
		class="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition select-none
		{isDragging ? 'opacity-30' : 'opacity-100'}
		{isOverlay ? 'shadow-lg ring-2 ring-ring' : 'hover:bg-accent'}"
		onclick={() => onclick?.(item)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onclick?.(item);
		}}
	>
		{@render cardContent()}
	</div>
{:else}
	<div
		class="rounded-lg border border-border bg-card p-2.5
		{isOverlay ? 'shadow-lg ring-2 ring-ring' : ''}"
	>
		{@render cardContent()}
	</div>
{/if}
