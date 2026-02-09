<script lang="ts">
	import StarRating from './StarRating.svelte';
	import { MEDIA_STATUSES, STATUS_LABELS, type MediaStatus, type MediaType } from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta | null;
		mediaType: MediaType;
		onClose: () => void;
		onUpdate: (fields: Record<string, unknown>, meta?: Record<string, unknown>) => Promise<void>;
		onDelete: () => Promise<void>;
	};

	let { item, mediaType, onClose, onUpdate, onDelete }: Props = $props();

	let notes = $state('');
	let saving = $state(false);
	let deleting = $state(false);

	// Sync notes from item
	$effect(() => {
		notes = item?.notes ?? '';
	});

	const labels = $derived(STATUS_LABELS[mediaType]);

	async function handleStatusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		saving = true;
		try {
			await onUpdate({ status: target.value });
		} finally {
			saving = false;
		}
	}

	async function handleRate(rating: number | null) {
		saving = true;
		try {
			await onUpdate({ rating });
		} finally {
			saving = false;
		}
	}

	let notesTimer: ReturnType<typeof setTimeout> | undefined;
	function handleNotesInput() {
		clearTimeout(notesTimer);
		notesTimer = setTimeout(async () => {
			saving = true;
			try {
				await onUpdate({ notes: notes || null });
			} finally {
				saving = false;
			}
		}, 800);
	}

	async function handleDelete() {
		deleting = true;
		try {
			await onDelete();
			onClose();
		} finally {
			deleting = false;
		}
	}

	/** Get type-specific metadata fields for display */
	function metaEntries(i: MediaItemWithMeta): Array<{ label: string; value: string }> {
		const entries: Array<{ label: string; value: string }> = [];

		if (i.bookMeta) {
			if (i.bookMeta.author) entries.push({ label: 'Author', value: i.bookMeta.author });
			if (i.bookMeta.pageCount)
				entries.push({ label: 'Pages', value: String(i.bookMeta.pageCount) });
			if (i.bookMeta.isbn) entries.push({ label: 'ISBN', value: i.bookMeta.isbn });
		}
		if (i.movieMeta) {
			if (i.movieMeta.director) entries.push({ label: 'Director', value: i.movieMeta.director });
			if (i.movieMeta.runtime)
				entries.push({ label: 'Runtime', value: `${i.movieMeta.runtime} min` });
		}
		if (i.seriesMeta) {
			if (i.seriesMeta.totalSeasons)
				entries.push({ label: 'Seasons', value: String(i.seriesMeta.totalSeasons) });
			if (i.seriesMeta.currentSeason)
				entries.push({ label: 'Current', value: `S${i.seriesMeta.currentSeason}` });
		}
		if (i.gameMeta) {
			if (i.gameMeta.platform) entries.push({ label: 'Platform', value: i.gameMeta.platform });
			if (i.gameMeta.genre) entries.push({ label: 'Genre', value: i.gameMeta.genre });
			if (i.gameMeta.playtimeMinutes)
				entries.push({
					label: 'Playtime',
					value: `${Math.round(i.gameMeta.playtimeMinutes / 60)}h`
				});
		}
		if (i.podcastMeta) {
			if (i.podcastMeta.host) entries.push({ label: 'Host', value: i.podcastMeta.host });
			if (i.podcastMeta.totalEpisodes)
				entries.push({ label: 'Episodes', value: String(i.podcastMeta.totalEpisodes) });
			if (i.podcastMeta.currentEpisode)
				entries.push({ label: 'Current', value: `Ep. ${i.podcastMeta.currentEpisode}` });
		}

		return entries;
	}
</script>

{#if item}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
		onclick={onClose}
		aria-label="Close panel"
		tabindex="-1"
	></button>

	<!-- Slide-over panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-700 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="truncate text-lg font-semibold text-white">{item.title}</h2>
			<button class="shrink-0 text-gray-400 hover:text-white" onclick={onClose} aria-label="Close">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto p-5">
			<!-- Cover + basic info -->
			<div class="flex gap-4">
				{#if item.coverUrl}
					<img src={item.coverUrl} alt="" class="h-40 w-28 shrink-0 rounded-md object-cover" />
				{/if}
				<div class="min-w-0 flex-1 space-y-2">
					{#if item.releaseYear}
						<p class="text-sm text-gray-400">{item.releaseYear}</p>
					{/if}

					<!-- Type-specific metadata -->
					{#each metaEntries(item) as entry}
						<div>
							<span class="text-xs text-gray-500">{entry.label}</span>
							<p class="text-sm text-gray-300">{entry.value}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Status -->
			<div class="mt-6">
				<label for="status-select" class="block text-xs font-medium text-gray-500">Status</label>
				<select
					id="status-select"
					class="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					value={item.status}
					onchange={handleStatusChange}
					disabled={saving}
				>
					{#each MEDIA_STATUSES as status}
						<option value={status}>{labels[status]}</option>
					{/each}
				</select>
			</div>

			<!-- Rating -->
			<div class="mt-5">
				<span class="block text-xs font-medium text-gray-500">Rating</span>
				<div class="mt-1">
					<StarRating value={item.rating} onRate={handleRate} />
				</div>
			</div>

			<!-- Notes -->
			<div class="mt-5">
				<label for="notes-textarea" class="block text-xs font-medium text-gray-500">Notes</label>
				<textarea
					id="notes-textarea"
					class="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					rows="4"
					placeholder="Your thoughts..."
					bind:value={notes}
					oninput={handleNotesInput}
				></textarea>
				{#if saving}
					<p class="mt-1 text-xs text-gray-500">Saving...</p>
				{/if}
			</div>
		</div>

		<!-- Footer actions -->
		<div class="border-t border-gray-800 px-5 py-4">
			<button
				class="w-full rounded-md border border-red-800 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900/30 disabled:opacity-50"
				onclick={handleDelete}
				disabled={deleting}
			>
				{deleting ? 'Deleting...' : 'Delete item'}
			</button>
		</div>
	</div>
{/if}
