<script lang="ts">
	import { useDroppable } from '@dnd-kit-svelte/svelte';
	import { CollisionPriority } from '@dnd-kit/abstract';
	import KanbanCard from './KanbanCard.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import type { MediaStatus } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		status: MediaStatus;
		label: string;
		color: string;
		items: MediaItemWithMeta[];
		slug: string;
		onCardClick?: (item: MediaItemWithMeta) => void;
	};

	let { status, label, color, items, slug, onCardClick }: Props = $props();

	const { ref, isDropTarget } = useDroppable({
		id: () => status,
		type: 'column',
		accept: ['item'],
		collisionPriority: CollisionPriority.Low
	});
</script>

<div
	class="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/40 transition-colors
	{isDropTarget.current ? 'ring-2 ring-ring' : ''}"
>
	<div
		class="flex items-center justify-between rounded-t-lg border-b border-border bg-muted/60 px-3 py-2"
	>
		<div class="flex items-center gap-2">
			<span class="size-2 shrink-0 rounded-full" style:background-color={color}></span>
			<h2 class="text-xs font-medium tracking-wide text-muted-foreground">{label}</h2>
		</div>
		<Badge variant="secondary" class="bg-muted-foreground/15 text-[10px]">{items.length}</Badge>
	</div>

	<ScrollArea class="flex-1">
		<div {@attach ref} class="flex flex-col gap-1.5 p-2" data-group={status}>
			{#each items as item, index (item.id)}
				<KanbanCard {item} {index} group={status} onclick={onCardClick} />
			{/each}

			{#if items.length === 0}
				<div class="py-8 text-center text-xs text-muted-foreground">No items</div>
			{/if}
		</div>
	</ScrollArea>
</div>
