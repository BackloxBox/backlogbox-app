<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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

<Sheet.Root
	open={item !== null}
	onOpenChange={(v) => {
		if (!v) onClose();
	}}
>
	<Sheet.Content side="right" class="flex w-full max-w-md flex-col p-0">
		{#if item}
			<Sheet.Header class="px-5 pt-5 pb-0">
				<Sheet.Title class="truncate">{item.title}</Sheet.Title>
				<Sheet.Description class="sr-only">Item details</Sheet.Description>
			</Sheet.Header>

			<!-- Scrollable content -->
			<div class="flex-1 overflow-y-auto px-5 py-4">
				<!-- Cover + basic info -->
				<div class="flex gap-4">
					{#if item.coverUrl}
						<img src={item.coverUrl} alt="" class="h-36 w-24 shrink-0 rounded-md object-cover" />
					{/if}
					<div class="min-w-0 flex-1 space-y-2">
						{#if item.releaseYear}
							<p class="text-sm text-muted-foreground">{item.releaseYear}</p>
						{/if}

						{#each metaEntries(item) as entry}
							<div>
								<span class="text-xs text-muted-foreground">{entry.label}</span>
								<p class="text-sm text-foreground">{entry.value}</p>
							</div>
						{/each}
					</div>
				</div>

				<Separator class="my-5" />

				<!-- Status -->
				<div class="space-y-1.5">
					<Label for="status-select">Status</Label>
					<NativeSelect
						id="status-select"
						class="w-full"
						value={item.status}
						onchange={handleStatusChange}
						disabled={saving}
					>
						{#each MEDIA_STATUSES as status}
							<NativeSelectOption value={status}>{labels[status]}</NativeSelectOption>
						{/each}
					</NativeSelect>
				</div>

				<!-- Rating -->
				<div class="mt-5 space-y-1.5">
					<Label>Rating</Label>
					<StarRating value={item.rating} onRate={handleRate} />
				</div>

				<!-- Notes -->
				<div class="mt-5 space-y-1.5">
					<Label for="notes-textarea">Notes</Label>
					<Textarea
						id="notes-textarea"
						rows={4}
						placeholder="Your thoughts..."
						bind:value={notes}
						oninput={handleNotesInput}
					/>
					{#if saving}
						<p class="text-xs text-muted-foreground">Saving...</p>
					{/if}
				</div>
			</div>

			<!-- Footer actions -->
			<Sheet.Footer class="border-t border-border px-5 py-4">
				<Button variant="destructive" class="w-full" onclick={handleDelete} disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete item'}
				</Button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
