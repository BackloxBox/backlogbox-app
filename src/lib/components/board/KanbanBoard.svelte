<script lang="ts">
	import { DragDropProvider, DragOverlay } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import { PointerSensor, KeyboardSensor } from '@dnd-kit-svelte/svelte';
	import { browser } from '$app/environment';
	import KanbanColumn from './KanbanColumn.svelte';
	import KanbanCard from './KanbanCard.svelte';
	import MobileCard from './MobileCard.svelte';
	import { MEDIA_STATUSES, type MediaStatus } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		groupedItems: Record<MediaStatus, MediaItemWithMeta[]>;
		statusLabels: Record<MediaStatus, string>;
		slug: string;
		onReorder: (
			updates: Array<{ id: string; status: MediaStatus; sortOrder: number }>
		) => Promise<void>;
		onCardClick?: (item: MediaItemWithMeta) => void;
	};

	let { groupedItems, statusLabels, slug, onReorder, onCardClick }: Props = $props();

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
			await onReorder(updates);
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
	{#if browser}
		<DragDropProvider
			sensors={[PointerSensor, KeyboardSensor]}
			onDragOver={(event) => {
				columns = move(columns, event);
			}}
			onDragEnd={handleDragEnd}
		>
			<div class="flex h-full gap-4 overflow-x-auto p-4 lg:p-6">
				{#each MEDIA_STATUSES as status}
					<KanbanColumn
						{status}
						label={statusLabels[status]}
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
		<div class="flex h-full gap-4 overflow-x-auto p-4 lg:p-6">
			{#each MEDIA_STATUSES as status}
				{@const items = columns[status] ?? []}
				<div class="flex w-72 min-w-72 flex-col rounded-lg border border-gray-800 bg-gray-900">
					<div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
						<h2 class="text-sm font-semibold text-gray-300">{statusLabels[status]}</h2>
						<span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
							>{items.length}</span
						>
					</div>
					<div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
						{#each items as item (item.id)}
							<MobileCard {item} onclick={onCardClick} />
						{/each}
						{#if items.length === 0}
							<div class="flex flex-1 items-center justify-center py-8 text-xs text-gray-600">
								No items
							</div>
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
		<div class="mb-2">
			<button
				class="flex w-full items-center justify-between rounded-md bg-gray-900 px-4 py-3 text-left"
				onclick={() => toggleSection(status)}
			>
				<span class="text-sm font-semibold text-gray-300">{statusLabels[status]}</span>
				<span class="flex items-center gap-2">
					<span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
						>{items.length}</span
					>
					<svg
						class="h-4 w-4 text-gray-500 transition {expanded ? 'rotate-180' : ''}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</span>
			</button>
			{#if expanded}
				<div class="mt-1 space-y-2 px-1">
					{#each items as item (item.id)}
						<MobileCard {item} onclick={onCardClick} />
					{/each}
					{#if items.length === 0}
						<p class="py-4 text-center text-xs text-gray-600">No items</p>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
