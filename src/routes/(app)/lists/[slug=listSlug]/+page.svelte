<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import CustomKanbanBoard from '$lib/components/custom-list/CustomKanbanBoard.svelte';
	import AddCustomItemModal from '$lib/components/custom-list/AddCustomItemModal.svelte';
	import CustomItemDetailPanel from '$lib/components/custom-list/CustomItemDetailPanel.svelte';
	import ListSettingsSheet from '$lib/components/custom-list/ListSettingsSheet.svelte';
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
	import {
		getBoardItems,
		getListFields,
		addItem,
		updateItem,
		deleteItem,
		reorderItems,
		setFieldValues,
		addField,
		removeField
	} from './data.remote';
	import { editList, removeList } from '../lists.remote';
	import type {
		CustomListItemWithFields,
		CustomListFieldRow
	} from '$lib/server/db/custom-list-queries';
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';
	import { getIconComponent } from '$lib/components/custom-list/icon-map';
	import type { ListIconName } from '$lib/types';

	const slug = $derived(page.params.slug ?? '');

	/** Find the list data from the layout's customLists */
	const parentData = $derived(page.data);
	const listMeta = $derived(
		(parentData.customLists ?? []).find((l: { slug: string }) => l.slug === slug)
	);
	const listName = $derived(listMeta?.name ?? 'List');

	let addModalOpen = $state(false);
	let selectedItem = $state<CustomListItemWithFields | null>(null);
	let settingsOpen = $state(false);
	let searchQuery = $state('');
	let listFields = $state<CustomListFieldRow[]>([]);

	// Reset search + load fields when switching lists
	$effect(() => {
		const s = slug;
		searchQuery = '';
		listFields = [];
		if (s) {
			getListFields(s).then((fields) => {
				listFields = fields;
			});
		}
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

	async function handleAdd(data: {
		title: string;
		subtitle: string | null;
		imageUrl: string | null;
		status: CustomListStatus;
	}) {
		try {
			await addItem({ slug, ...data });
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('add item failed', { slug, title: data.title, err });
			toast.error('Failed to add item');
			throw err;
		}
	}

	async function handleUpdateItem(
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

	async function handleDeleteItem() {
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

	async function handleFieldValueChange(fieldId: string, value: string) {
		if (!selectedItem) return;
		try {
			await setFieldValues({ slug, itemId: selectedItem.id, values: [{ fieldId, value }] });
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('field value update failed', { slug, fieldId, err });
			toast.error('Failed to save field');
		}
	}

	// --- Settings handlers ---

	async function handleUpdateList(fields: {
		name?: string;
		icon?: string | null;
		isPublic?: boolean;
	}) {
		if (!listMeta) return;
		try {
			const updated = await editList({
				listId: listMeta.id,
				name: fields.name,
				icon: fields.icon as ListIconName | null | undefined,
				isPublic: fields.isPublic
			});
			// If name changed, slug changed — navigate to new URL
			if (updated && fields.name && updated.slug !== slug) {
				await invalidateAll();
				goto(`/lists/${updated.slug}`, { replaceState: true });
			} else {
				await invalidateAll();
			}
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('update list failed', { slug, err });
			toast.error('Failed to update list');
		}
	}

	async function handleDeleteList() {
		if (!listMeta) return;
		try {
			await removeList({ listId: listMeta.id });
			await invalidateAll();
			goto('/dashboard');
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('delete list failed', { slug, err });
			toast.error('Failed to delete list');
		}
	}

	async function handleAddField(data: { name: string; fieldType: string }) {
		try {
			await addField({
				slug,
				name: data.name,
				fieldType: data.fieldType as 'text' | 'number' | 'url' | 'date'
			});
			const fields = await getListFields(slug);
			listFields = fields;
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('add field failed', { slug, err });
			toast.error('Failed to add field');
		}
	}

	async function handleDeleteField(fieldId: string) {
		try {
			await removeField({ slug, fieldId });
			const fields = await getListFields(slug);
			listFields = fields;
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('delete field failed', { slug, fieldId, err });
			toast.error('Failed to delete field');
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
			<Button size="sm" onclick={() => (addModalOpen = true)}>
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

<AddCustomItemModal open={addModalOpen} onClose={() => (addModalOpen = false)} onAdd={handleAdd} />

<CustomItemDetailPanel
	item={selectedItem}
	fields={listFields}
	onClose={() => (selectedItem = null)}
	onUpdate={handleUpdateItem}
	onDelete={handleDeleteItem}
	onFieldValueChange={handleFieldValueChange}
/>

<ListSettingsSheet
	open={settingsOpen}
	list={listMeta
		? {
				id: listMeta.id,
				name: listMeta.name,
				slug: listMeta.slug,
				icon: listMeta.icon,
				isPublic: listMeta.isPublic
			}
		: null}
	fields={listFields}
	onClose={() => (settingsOpen = false)}
	onUpdateList={handleUpdateList}
	onDeleteList={handleDeleteList}
	onAddField={handleAddField}
	onDeleteField={handleDeleteField}
/>
