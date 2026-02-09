<script lang="ts">
	import { page } from '$app/state';
	import KanbanBoard from '$lib/components/board/KanbanBoard.svelte';
	import AddItemModal from '$lib/components/board/AddItemModal.svelte';
	import ItemDetailPanel from '$lib/components/board/ItemDetailPanel.svelte';
	import {
		slugToMediaType,
		MEDIA_TYPE_LABELS,
		MEDIA_STATUSES,
		STATUS_LABELS,
		type MediaStatus,
		type MediaType
	} from '$lib/types';
	import { getBoardItems, addItem, updateItem, deleteItem, reorderItems } from './data.remote';
	import { searchMedia } from '../search.remote';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';
	import type { SearchResult } from '$lib/server/search';

	/** Param matcher guarantees this exists and is a valid media type slug */
	const slug = $derived(page.params.type ?? '');
	const mediaType = $derived(slugToMediaType(slug) as MediaType);
	const typeLabel = $derived(mediaType ? MEDIA_TYPE_LABELS[mediaType].plural : '');
	const statusLabels = $derived(mediaType ? STATUS_LABELS[mediaType] : null);

	let addModalOpen = $state(false);
	let selectedItem = $state<MediaItemWithMeta | null>(null);

	/** Group items by status */
	function groupByStatus(allItems: MediaItemWithMeta[]): Record<MediaStatus, MediaItemWithMeta[]> {
		const grouped = Object.fromEntries(
			MEDIA_STATUSES.map((s) => [s, [] as MediaItemWithMeta[]])
		) as Record<MediaStatus, MediaItemWithMeta[]>;

		for (const item of allItems) {
			const status = item.status as MediaStatus;
			grouped[status].push(item);
		}

		for (const status of MEDIA_STATUSES) {
			grouped[status].sort((a, b) => a.sortOrder - b.sortOrder);
		}

		return grouped;
	}

	async function handleSearch(query: string) {
		return searchMedia({ slug, query });
	}

	async function handleAddFromSearch(result: SearchResult) {
		await addItem({
			slug,
			title: result.title,
			coverUrl: result.coverUrl,
			releaseYear: result.releaseYear,
			status: 'backlog',
			...result.meta
		});
		getBoardItems(slug).refresh();
	}

	async function handleManualAdd(title: string) {
		await addItem({ slug, title, status: 'backlog' });
		getBoardItems(slug).refresh();
	}

	async function handleUpdateItem(fields: Record<string, unknown>, meta?: Record<string, unknown>) {
		if (!selectedItem) return;
		await updateItem({ id: selectedItem.id, slug, fields, meta });
		getBoardItems(slug).refresh();
	}

	async function handleDeleteItem() {
		if (!selectedItem) return;
		await deleteItem({ id: selectedItem.id, slug });
		selectedItem = null;
		getBoardItems(slug).refresh();
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex items-center justify-between border-b border-gray-800 px-6 py-4">
		<h1 class="text-xl font-bold text-white">{typeLabel}</h1>
		<button
			class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
			onclick={() => (addModalOpen = true)}
		>
			+ Add
		</button>
	</header>

	{#if statusLabels && slug}
		{@const allItems = await getBoardItems(slug)}
		{@const groupedItems = groupByStatus(allItems)}
		<KanbanBoard
			{groupedItems}
			{statusLabels}
			{slug}
			onReorder={async (updates) => {
				await reorderItems({ slug, updates });
			}}
			onCardClick={(item) => (selectedItem = item)}
		/>
	{/if}
</div>

<AddItemModal
	{slug}
	open={addModalOpen}
	onClose={() => (addModalOpen = false)}
	onSearch={handleSearch}
	onAdd={handleAddFromSearch}
	onManualAdd={handleManualAdd}
/>

{#if mediaType}
	<ItemDetailPanel
		item={selectedItem}
		{mediaType}
		onClose={() => (selectedItem = null)}
		onUpdate={handleUpdateItem}
		onDelete={handleDeleteItem}
	/>
{/if}
