<script lang="ts">
	import { page } from '$app/state';
	import KanbanBoard from '$lib/components/board/KanbanBoard.svelte';
	import AddItemModal from '$lib/components/board/AddItemModal.svelte';
	import ItemDetailPanel from '$lib/components/board/ItemDetailPanel.svelte';
	import BoardSearch from '$lib/components/board/BoardSearch.svelte';
	import { getSearchableText } from '$lib/components/board/card-utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import {
		slugToMediaType,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_SLUGS,
		MEDIA_STATUSES,
		STATUS_LABELS,
		type MediaStatus,
		type MediaType,
		type MediaTypeSlug
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
	import { toast } from 'svelte-sonner';
	import { handleSubscriptionError } from '$lib/subscription-guard';

	/** Param matcher guarantees this is a valid slug — narrow the type */
	function asSlug(s: string): MediaTypeSlug {
		if (MEDIA_TYPE_SLUGS.includes(s as MediaTypeSlug)) return s as MediaTypeSlug;
		// Fallback shouldn't happen due to param matcher, but satisfies TS
		return 'books';
	}

	const slug = $derived(asSlug(page.params.type ?? ''));
	const mediaType = $derived(slugToMediaType(slug));
	const typeLabel = $derived(mediaType ? MEDIA_TYPE_LABELS[mediaType].plural : '');
	const statusLabels = $derived(mediaType ? STATUS_LABELS[mediaType] : null);

	let addModalOpen = $state(false);
	let selectedItem = $state<MediaItemWithMeta | null>(null);
	let searchQuery = $state('');

	// Reset search when switching media types
	$effect(() => {
		slug;
		searchQuery = '';
	});

	/** Group items by status */
	function groupByStatus(allItems: MediaItemWithMeta[]): Record<MediaStatus, MediaItemWithMeta[]> {
		const grouped: Record<MediaStatus, MediaItemWithMeta[]> = {
			wishlist: [],
			backlog: [],
			in_progress: [],
			on_hold: [],
			completed: [],
			abandoned: []
		};

		for (const item of allItems) {
			grouped[item.status].push(item);
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
		try {
			const details = await getSeriesDetails(tmdbId);
			cachedSeriesDetails[tmdbId] = details;
			return details?.totalSeasons ?? null;
		} catch (err) {
			if (handleSubscriptionError(err)) return null;
			console.error('fetch seasons failed', { slug, tmdbId, err });
			toast.error('Could not load season info');
			return null;
		}
	}

	async function handleAddFromSearch(result: SearchResult) {
		const meta = { ...result.meta };

		// Fetch book description from OpenLibrary works endpoint
		if (mediaType === 'book' && result.externalId) {
			try {
				const description = await getBookDescription(result.externalId);
				if (description) meta.description = description;
			} catch {
				// Non-critical enrichment — continue without description
			}
		}

		// Fetch movie details (director, description, runtime, cast) from TMDB
		const movieTmdbId = typeof meta.tmdbId === 'number' ? meta.tmdbId : null;
		if (mediaType === 'movie' && movieTmdbId) {
			try {
				const details = await getMovieDetails(movieTmdbId);
				if (details) {
					if (details.director) meta.director = details.director;
					if (details.description) meta.description = details.description;
					if (details.runtime) meta.runtime = details.runtime;
					if (details.cast) meta.cast = details.cast;
				}
			} catch {
				// Non-critical enrichment — continue without movie details
			}
		}

		// Enrich series with details (use cache from season picker if available)
		const seriesTmdbId = typeof meta.tmdbId === 'number' ? meta.tmdbId : null;
		if (mediaType === 'series' && seriesTmdbId) {
			try {
				const details = cachedSeriesDetails[seriesTmdbId] ?? (await getSeriesDetails(seriesTmdbId));
				if (details) {
					if (details.description) meta.description = details.description;
					if (details.creator) meta.creator = details.creator;
					if (details.cast) meta.cast = details.cast;
					if (details.network) meta.network = details.network;
					if (details.seriesStatus) meta.seriesStatus = details.seriesStatus;
					if (details.totalSeasons) meta.totalSeasons = details.totalSeasons;
				}
			} catch {
				// Non-critical enrichment — continue without series details
			} finally {
				delete cachedSeriesDetails[seriesTmdbId];
			}
		}

		try {
			await addItem({
				slug,
				title: result.title,
				coverUrl: result.coverUrl,
				releaseYear: result.releaseYear,
				status: 'backlog',
				...meta
			});
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('add item failed', { slug, title: result.title, err });
			toast.error('Failed to add item');
			throw err; // re-throw so modal can react (reset adding state)
		}
	}

	async function handleManualAdd(data: Record<string, unknown>) {
		try {
			await addItem({ slug, status: 'backlog', ...data } as Parameters<typeof addItem>[0]);
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('manual add failed', { slug, title: data.title, err });
			toast.error('Failed to add item');
			throw err;
		}
	}

	async function handleUpdateItem(fields: Record<string, unknown>, meta?: Record<string, unknown>) {
		if (!selectedItem || !mediaType) return;

		const previous = selectedItem;

		// Optimistically update top-level fields
		let updated: MediaItemWithMeta = { ...selectedItem, ...fields };

		// Optimistically update nested meta for the current media type
		if (meta) {
			const metaKey = `${mediaType}Meta` as const;
			const existing = updated[metaKey];
			if (existing && typeof existing === 'object') {
				updated = { ...updated, [metaKey]: { ...existing, ...meta } };
			}
		}

		selectedItem = updated;

		try {
			await updateItem({ id: selectedItem.id, slug, fields, meta } as Parameters<
				typeof updateItem
			>[0]);
			getBoardItems(slug).refresh();
		} catch (err) {
			if (handleSubscriptionError(err)) return;
			console.error('update item failed', {
				slug,
				itemId: selectedItem.id,
				fields: Object.keys(fields),
				err
			});
			toast.error('Failed to save changes');
			// Rollback optimistic update
			selectedItem = previous;
		}
	}

	async function handleDeleteItem() {
		if (!selectedItem) return;
		try {
			await deleteItem({ id: selectedItem.id, slug });
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
		<h1 class="text-lg font-semibold tracking-tight text-foreground">{typeLabel}</h1>
		<div class="flex items-center gap-2">
			<BoardSearch bind:value={searchQuery} />
			<Button size="sm" onclick={() => (addModalOpen = true)}>
				<Plus class="size-4" />
				Add
			</Button>
		</div>
	</header>

	<Separator />

	{#if statusLabels && slug}
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
				? allItems.filter((item) => getSearchableText(item).includes(needle))
				: allItems}
			{@const groupedItems = groupByStatus(filtered)}
			<KanbanBoard
				{groupedItems}
				{statusLabels}
				{slug}
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

			{#snippet failed(error, reset)}
				<div class="flex flex-1 flex-col items-center justify-center gap-3">
					<p class="text-sm text-muted-foreground">Failed to load board</p>
					<Button variant="outline" size="sm" onclick={reset}>Retry</Button>
				</div>
			{/snippet}
		</svelte:boundary>
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
