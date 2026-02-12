<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import CardBody from './CardBody.svelte';
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
</script>

{#if ref}
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
		<CardBody {item} />
	</div>
{:else}
	<div
		class="rounded-lg border border-border bg-card p-2.5
		{isOverlay ? 'shadow-lg ring-2 ring-ring' : ''}"
	>
		<CardBody {item} />
	</div>
{/if}
