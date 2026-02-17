<script lang="ts">
	import { page } from '$app/state';
	import CustomKanbanBoard from '$lib/components/custom-list/CustomKanbanBoard.svelte';
	import BoardSearch from '$lib/components/board/BoardSearch.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import {
		CUSTOM_LIST_STATUSES,
		CUSTOM_LIST_STATUS_LABELS,
		type CustomListStatus
	} from '$lib/types';
	import { getBoardItems, addItem, updateItem, deleteItem, reorderItems } from './data.remote';
	import type { CustomListItemWithFields } from '$lib/server/db/custom-list-queries';
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import { getIconComponent } from '$lib/components/custom-list/icon-map';

	const slug = $derived(page.params.slug ?? '');

	/** Find the list data from the layout's customLists */
	const parentData = $derived(page.data);
	const listMeta = $derived(
		(parentData.customLists ?? []).find((l: { slug: string }) => l.slug === slug)
	);
	const listName = $derived(listMeta?.name ?? 'List');

	let _addModalOpen = $state(false);
	let selectedItem = $state<CustomListItemWithFields | null>(null);
	let _settingsOpen = $state(false);
	let searchQuery = $state('');

	// Reset search when switching lists
	$effect(() => {
		void slug;
		searchQuery = '';
	});

	/** Group items by status */
	function groupByStatus(
		allItems: CustomListItemWithFields[]
	): Record<CustomListStatus, CustomListItemWithFields[]> {
		const grouped: Record<CustomListStatus, CustomListItemWithFields[]> = {
			wishlist: [],
			planned: [],
			doing: [],
			completed: [],
			abandoned: []
		};

		for (const item of allItems) {
			grouped[item.status].push(item);
		}

		for (const status of CUSTOM_LIST_STATUSES) {
			grouped[status].sort((a, b) => a.sortOrder - b.sortOrder);
		}

		return grouped;
	}

	async function handleAddItem() {
		// Simple inline add for now — will be replaced with modal in Phase 6
		const title = prompt('Item title:');
		if (!title?.trim()) return;

		try {
			await addItem({ slug, title: title.trim(), status: 'planned' });
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('add item failed', { slug, title, err });
			toast.error('Failed to add item');
		}
	}

	async function _handleUpdateItem(
		fields: Partial<{
			title: string;
			subtitle: string | null;
			imageUrl: string | null;
			status: CustomListStatus;
			sortOrder: number;
			rating: number | null;
			notes: string | null;
		}>
	) {
		if (!selectedItem) return;
		const previous = selectedItem;

		// Optimistic update
		selectedItem = { ...selectedItem, ...fields };

		try {
			await updateItem({ slug, itemId: selectedItem.id, ...fields });
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('update item failed', { slug, itemId: selectedItem?.id, err });
			toast.error('Failed to save changes');
			selectedItem = previous;
		}
	}

	async function _handleDeleteItem() {
		if (!selectedItem) return;
		try {
			await deleteItem({ slug, itemId: selectedItem.id });
			selectedItem = null;
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('delete item failed', { slug, itemId: selectedItem?.id, err });
			toast.error('Failed to delete item');
		}
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex items-center justify-between px-6 py-3 pl-14 lg:pl-6">
		<div class="flex items-center gap-2">
			{#if listMeta?.icon}
				{@const Icon = getIconComponent(listMeta.icon)}
				<Icon class="size-5 text-muted-foreground" />
			{/if}
			<h1 class="text-lg font-semibold tracking-tight text-foreground">{listName}</h1>
		</div>
		<div class="flex items-center gap-2">
			<BoardSearch bind:value={searchQuery} />
			<Button size="sm" onclick={handleAddItem}>
				<Plus class="size-4" />
				Add
			</Button>
			<Button variant="ghost" size="icon" class="size-8" onclick={() => (settingsOpen = true)}>
				<SettingsIcon class="size-4" />
			</Button>
		</div>
	</header>

	<Separator />

	<svelte:boundary
		onerror={(err) => {
			if (handleSubscriptionError(err)) return;
			console.error('board render error', { slug, err });
			toast.error('Something went wrong loading the board');
		}}
	>
		{@const allItems = await getBoardItems(slug)}
		{@const needle = searchQuery.trim().toLowerCase()}
		{@const filtered = needle
			? allItems.filter(
					(item) =>
						item.title.toLowerCase().includes(needle) ||
						(item.subtitle?.toLowerCase().includes(needle) ?? false)
				)
			: allItems}
		{@const groupedItems = groupByStatus(filtered)}
		<CustomKanbanBoard
			{groupedItems}
			statusLabels={CUSTOM_LIST_STATUS_LABELS}
			onReorder={async (updates) => {
				try {
					await reorderItems({ slug, updates });
				} catch (err) {
					if (handleSubscriptionError(err)) return;
					console.error('reorder failed', { slug, count: updates.length, err });
					toast.error('Failed to save new order');
					getBoardItems(slug).refresh();
				}
			}}
			onCardClick={(item) => (selectedItem = item)}
		/>

		{#snippet pending()}
			<div class="flex flex-1 items-center justify-center">
				<LoaderCircle class="size-6 animate-spin text-muted-foreground" />
			</div>
		{/snippet}

		{#snippet failed(_error, reset)}
			<div class="flex flex-1 flex-col items-center justify-center gap-3">
				<p class="text-sm text-muted-foreground">Failed to load board</p>
				<Button variant="outline" size="sm" onclick={reset}>Retry</Button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>
