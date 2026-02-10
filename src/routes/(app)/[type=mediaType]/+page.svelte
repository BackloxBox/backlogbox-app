<script lang="ts">
	import { page } from '$app/state';
	import KanbanBoard from '$lib/components/board/KanbanBoard.svelte';
	import AddItemModal from '$lib/components/board/AddItemModal.svelte';
	import ItemDetailPanel from '$lib/components/board/ItemDetailPanel.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import {
		slugToMediaType,
		MEDIA_TYPE_LABELS,
		MEDIA_STATUSES,
		STATUS_LABELS,
		type MediaStatus,
		type MediaType
	} from '$lib/types';
	import { getBoardItems, addItem, updateItem, deleteItem, reorderItems } from './data.remote';
	import {
		searchMedia,
		getSeriesDetails,
		getBookDescription,
		getMovieDetails
	} from '../search.remote';
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

	/** Cache series details to avoid double-fetching (season picker + add enrichment) */
	let cachedSeriesDetails: Record<number, Awaited<ReturnType<typeof getSeriesDetails>>> = {};

	async function handleFetchSeasons(tmdbId: number) {
		const details = await getSeriesDetails(tmdbId);
		cachedSeriesDetails[tmdbId] = details;
		return details?.totalSeasons ?? null;
	}

	async function handleAddFromSearch(result: SearchResult) {
		const meta = { ...result.meta };

		// Fetch book description from OpenLibrary works endpoint
		if (mediaType === 'book' && result.externalId) {
			const description = await getBookDescription(result.externalId);
			if (description) meta.description = description;
		}

		// Fetch movie details (director, description, runtime, cast) from TMDB
		if (mediaType === 'movie' && meta.tmdbId) {
			const details = await getMovieDetails(meta.tmdbId as number);
			if (details) {
				if (details.director) meta.director = details.director;
				if (details.description) meta.description = details.description;
				if (details.runtime) meta.runtime = details.runtime;
				if (details.cast) meta.cast = details.cast;
			}
		}

		// Enrich series with details (use cache from season picker if available)
		if (mediaType === 'series' && meta.tmdbId) {
			const tmdbId = meta.tmdbId as number;
			const details = cachedSeriesDetails[tmdbId] ?? (await getSeriesDetails(tmdbId));
			if (details) {
				if (details.description) meta.description = details.description;
				if (details.creator) meta.creator = details.creator;
				if (details.cast) meta.cast = details.cast;
				if (details.network) meta.network = details.network;
				if (details.seriesStatus) meta.seriesStatus = details.seriesStatus;
				if (details.totalSeasons) meta.totalSeasons = details.totalSeasons;
			}
			delete cachedSeriesDetails[tmdbId];
		}

		await addItem({
			slug,
			title: result.title,
			coverUrl: result.coverUrl,
			releaseYear: result.releaseYear,
			status: 'backlog',
			...meta
		});
		getBoardItems(slug).refresh();
	}

	async function handleManualAdd(data: Record<string, unknown>) {
		await addItem({ slug, status: 'backlog', ...data } as Parameters<typeof addItem>[0]);
		getBoardItems(slug).refresh();
	}

	async function handleUpdateItem(fields: Record<string, unknown>, meta?: Record<string, unknown>) {
		if (!selectedItem) return;

		// Optimistically update top-level fields
		let updated = { ...selectedItem, ...fields };

		// Optimistically update nested meta for the current media type
		if (meta && mediaType) {
			const metaKey = `${mediaType}Meta` as keyof MediaItemWithMeta;
			const existing = updated[metaKey];
			if (existing && typeof existing === 'object') {
				updated = { ...updated, [metaKey]: { ...existing, ...meta } };
			}
		}

		selectedItem = updated as MediaItemWithMeta;
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
	<header class="flex items-center justify-between px-6 py-3 pl-14 lg:pl-6">
		<h1 class="text-lg font-semibold tracking-tight text-foreground">{typeLabel}</h1>
		<Button size="sm" onclick={() => (addModalOpen = true)}>
			<Plus class="size-4" />
			Add
		</Button>
	</header>

	<Separator />

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
	onFetchSeasons={handleFetchSeasons}
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
