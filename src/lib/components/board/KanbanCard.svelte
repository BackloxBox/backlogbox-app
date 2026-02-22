<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import CardBody from './CardBody.svelte';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';
	import type { SvelteSet } from 'svelte/reactivity';

	type Props = {
		item: MediaItemWithMeta;
		index?: number;
		group?: string;
		isOverlay?: boolean;
		recentlyCompleted?: SvelteSet<string>;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let {
		item,
		index = 0,
		group = '',
		isOverlay = false,
		recentlyCompleted,
		onclick
	}: Props = $props();

	const glowing = $derived(recentlyCompleted?.has(item.id) ?? false);

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
		{isOverlay ? 'shadow-lg ring-2 ring-ring' : 'hover:bg-accent'}
		{glowing ? 'neon-glow' : ''}"
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

<style>
	@keyframes neon-flash {
		0% {
			box-shadow:
				0 0 8px #22c55e,
				0 0 20px #22c55e60;
			border-color: #22c55e;
		}
		100% {
			box-shadow: none;
			border-color: var(--color-border);
		}
	}

	:global(.neon-glow) {
		animation: neon-flash 0.8s ease-out;
	}
</style>
