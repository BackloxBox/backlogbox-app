<script lang="ts">
	import { useDroppable } from '@dnd-kit-svelte/svelte';
	import { CollisionPriority } from '@dnd-kit/abstract';
	import KanbanCard from './KanbanCard.svelte';
	import type { MediaStatus } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		status: MediaStatus;
		label: string;
		items: MediaItemWithMeta[];
		slug: string;
		onCardClick?: (item: MediaItemWithMeta) => void;
	};

	let { status, label, items, slug, onCardClick }: Props = $props();

	const { ref, isDropTarget } = useDroppable({
		id: status,
		type: 'column',
		accept: ['item'],
		collisionPriority: CollisionPriority.Low
	});
</script>

<div
	class="flex w-72 min-w-72 flex-col rounded-lg border bg-gray-900
	{isDropTarget.current ? 'border-indigo-500' : 'border-gray-800'}"
>
	<div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
		<h2 class="text-sm font-semibold text-gray-300">{label}</h2>
		<span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
			{items.length}
		</span>
	</div>

	<div {@attach ref} class="flex flex-1 flex-col gap-2 overflow-y-auto p-2" data-group={status}>
		{#each items as item, index (item.id)}
			<KanbanCard {item} {index} group={status} onclick={onCardClick} />
		{/each}

		{#if items.length === 0}
			<div class="flex flex-1 items-center justify-center py-8 text-xs text-gray-600">No items</div>
		{/if}
	</div>
</div>
