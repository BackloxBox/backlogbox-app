<script lang="ts">
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import { PointerSensor, KeyboardSensor } from '@dnd-kit-svelte/svelte';
	import { browser } from '$app/environment';
	import KanbanColumn from './KanbanColumn.svelte';
	import KanbanCard from './KanbanCard.svelte';
	import MobileCard from './MobileCard.svelte';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { MEDIA_STATUSES, STATUS_COLORS, type MediaStatus } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		groupedItems: Record<MediaStatus, MediaItemWithMeta[]>;
		statusLabels: Record<MediaStatus, string>;
		slug: string;
		readonly?: boolean;
		onReorder?: (
			updates: Array<{ id: string; status: MediaStatus; sortOrder: number }>
		) => Promise<void>;
		onCardClick?: (item: MediaItemWithMeta) => void;
	};

	let {
		groupedItems,
		statusLabels,
		slug,
		readonly = false,
		onReorder,
		onCardClick
	}: Props = $props();

	/** Local mutable copy for optimistic DnD updates */
	let columns = $state<Record<string, MediaItemWithMeta[]>>(structuredClone(groupedItems));

	/** Which sections are expanded in mobile view */
	let expandedSections = $state<Set<MediaStatus>>(new Set(['in_progress', 'backlog']));

	/** Sync from parent when data refreshes */
	$effect(() => {
		columns = structuredClone(groupedItems);
	});

	async function handleDragEnd() {
		const updates: Array<{ id: string; status: MediaStatus; sortOrder: number }> = [];

		for (const status of MEDIA_STATUSES) {
			const items = columns[status];
			if (!items) continue;

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const sortOrder = i * 1000;
				if (item.status !== status || item.sortOrder !== sortOrder) {
					updates.push({ id: item.id, status, sortOrder });
				}
			}
		}

		if (updates.length > 0) {
			await onReorder?.(updates);
		}
	}

	/** Find item across all columns by id */
	function findItemById(id: unknown): MediaItemWithMeta | undefined {
		for (const status of MEDIA_STATUSES) {
			const found = columns[status]?.find((item) => item.id === id);
			if (found) return found;
		}
		return undefined;
	}

	function toggleSection(status: MediaStatus) {
		const next = new Set(expandedSections);
		if (next.has(status)) {
			next.delete(status);
		} else {
			next.add(status);
		}
		expandedSections = next;
	}
</script>

<!-- Desktop: horizontal Kanban columns (client-only due to DnD context) -->
<div class="hidden flex-1 lg:block">
	{#if browser && !readonly}
		<DragDropProvider
			sensors={[PointerSensor, KeyboardSensor]}
			onDragOver={(event) => {
				columns = move(columns, event);
			}}
			onDragEnd={handleDragEnd}
		>
			<div class="flex h-full gap-3 overflow-x-auto p-4">
				{#each MEDIA_STATUSES as status}
					<KanbanColumn
						{status}
						label={statusLabels[status]}
						color={STATUS_COLORS[status]}
						items={columns[status] ?? []}
						{slug}
						{onCardClick}
					/>
				{/each}
			</div>

			<DragOverlay>
				{#snippet children(source)}
					{@const item = findItemById(source.id)}
					{#if item}
						<MobileCard {item} />
					{/if}
				{/snippet}
			</DragOverlay>
		</DragDropProvider>
	{:else}
		<!-- SSR placeholder: render static columns without DnD -->
		<div class="flex h-full gap-3 overflow-x-auto p-4">
			{#each MEDIA_STATUSES as status}
				{@const items = columns[status] ?? []}
				<div class="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/40">
					<div
						class="flex items-center justify-between rounded-t-lg border-b border-border bg-muted/60 px-3 py-2"
					>
						<div class="flex items-center gap-2">
							<span
								class="size-2 shrink-0 rounded-full"
								style:background-color={STATUS_COLORS[status]}
							></span>
							<h2 class="text-xs font-medium tracking-wide text-muted-foreground">
								{statusLabels[status]}
							</h2>
						</div>
						<Badge variant="secondary" class="bg-muted-foreground/15 text-[10px]"
							>{items.length}</Badge
						>
					</div>
					<div class="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
						{#each items as item (item.id)}
							<MobileCard {item} onclick={readonly ? undefined : onCardClick} />
						{/each}
						{#if items.length === 0}
							<div class="py-8 text-center text-xs text-muted-foreground">No items</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Mobile: collapsed accordion list (no DnD) -->
<div class="flex-1 overflow-y-auto p-3 lg:hidden">
	{#each MEDIA_STATUSES as status}
		{@const items = columns[status] ?? []}
		{@const expanded = expandedSections.has(status)}
		<Collapsible open={expanded} class="mb-1.5">
			<CollapsibleTrigger
				class="flex w-full items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-left"
				onclick={() => toggleSection(status)}
			>
				<span class="flex items-center gap-2">
					<span class="size-2 shrink-0 rounded-full" style:background-color={STATUS_COLORS[status]}
					></span>
					<span class="text-sm font-medium text-foreground">{statusLabels[status]}</span>
				</span>
				<span class="flex items-center gap-2">
					<Badge variant="secondary" class="bg-muted-foreground/15 text-[10px]"
						>{items.length}</Badge
					>
					<ChevronDown
						class="size-3.5 text-muted-foreground transition {expanded ? 'rotate-180' : ''}"
					/>
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div class="mt-1.5 space-y-1.5 px-0.5">
					{#each items as item (item.id)}
						<MobileCard {item} onclick={readonly ? undefined : onCardClick} />
					{/each}
					{#if items.length === 0}
						<p class="py-4 text-center text-xs text-muted-foreground">No items</p>
					{/if}
				</div>
			</CollapsibleContent>
		</Collapsible>
	{/each}
</div>
