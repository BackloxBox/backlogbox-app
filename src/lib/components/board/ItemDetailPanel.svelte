<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import X from '@lucide/svelte/icons/x';
	import Send from '@lucide/svelte/icons/send';
	import Pin from '@lucide/svelte/icons/pin';
	import PinOff from '@lucide/svelte/icons/pin-off';
	import MediaCover from './MediaCover.svelte';
	import StarRating from './StarRating.svelte';
	import DatePicker from './DatePicker.svelte';
	import { getSeasonBadge, formatRuntime } from './card-utils';
	import {
		MEDIA_STATUSES,
		STATUS_LABELS,
		STREAMING_PLATFORMS,
		PODCAST_PLATFORMS,
		type MediaType
	} from '$lib/types';
	import type { MediaItemWithMeta, MediaNoteRow } from '$lib/server/db/queries';
	import {
		getItemNotes,
		addNote,
		removeNote
	} from '../../../routes/(app)/[type=mediaType]/data.remote';
	import { toast } from 'svelte-sonner';

	/** Human-friendly descriptions for TMDB series status values */
	const SERIES_STATUS_DESCRIPTIONS: Record<string, string> = {
		'Returning Series': 'New seasons in production',
		Ended: 'Concluded, no more seasons',
		Canceled: 'Cancelled before intended ending',
		'In Production': 'Not yet aired, in production',
		Planned: 'Announced but not yet in production'
	};

	type Props = {
		item: MediaItemWithMeta | null;
		mediaType: MediaType;
		onClose: () => void;
		onUpdate: (fields: Record<string, unknown>, meta?: Record<string, unknown>) => Promise<void>;
		onDelete: () => Promise<void>;
	};

	let { item, mediaType, onClose, onUpdate, onDelete }: Props = $props();

	let saving = $state(false);
	let deleting = $state(false);
	let scrollRef = $state<HTMLDivElement | null>(null);
	let pendingDeleteNoteId = $state<string | null>(null);

	// --- Notes timeline ---
	let timelineNotes = $state<MediaNoteRow[]>([]);
	let notesLoading = $state(false);
	let newNoteText = $state('');
	let addingNote = $state(false);

	// Load notes when item changes
	$effect(() => {
		const currentItem = item;
		timelineNotes = [];
		newNoteText = '';
		scrollRef?.scrollTo(0, 0);

		if (!currentItem) return;

		notesLoading = true;
		getItemNotes(currentItem.id)
			.then((notes) => {
				// Guard: only apply if still viewing the same item
				if (item?.id === currentItem.id) timelineNotes = notes;
			})
			.catch(() => {
				// Silently fail — notes are non-critical
			})
			.finally(() => {
				if (item?.id === currentItem.id) notesLoading = false;
			});
	});

	const seasonLabel = $derived(item ? getSeasonBadge(item) : null);
	const description = $derived(
		item?.bookMeta?.description ??
			item?.movieMeta?.description ??
			item?.seriesMeta?.description ??
			item?.gameMeta?.description ??
			item?.podcastMeta?.description
	);

	const labels = $derived(STATUS_LABELS[mediaType]);

	async function handleStatusChange(value: string | undefined) {
		if (!value) return;
		saving = true;
		try {
			await onUpdate({ status: value });
		} catch (err) {
			console.error('update status failed', { itemId: item?.id, mediaType, status: value, err });
			toast.error('Failed to update status');
		} finally {
			saving = false;
		}
	}

	async function handleSeasonSelect(season: number | null) {
		saving = true;
		try {
			await onUpdate({}, { currentSeason: season });
		} catch (err) {
			console.error('update season failed', { itemId: item?.id, season, err });
			toast.error('Failed to update season');
		} finally {
			saving = false;
		}
	}

	async function handleWatchingOnChange(value: string | undefined) {
		saving = true;
		try {
			await onUpdate({}, { watchingOn: value || null });
		} catch (err) {
			console.error('update watchingOn failed', { itemId: item?.id, value, err });
			toast.error('Failed to update platform');
		} finally {
			saving = false;
		}
	}

	async function handlePlayingOnChange(value: string | undefined) {
		saving = true;
		try {
			await onUpdate({}, { playingOn: value || null });
		} catch (err) {
			console.error('update playingOn failed', { itemId: item?.id, value, err });
			toast.error('Failed to update platform');
		} finally {
			saving = false;
		}
	}

	async function handleListeningOnChange(value: string | undefined) {
		saving = true;
		try {
			await onUpdate({}, { listeningOn: value || null });
		} catch (err) {
			console.error('update listeningOn failed', { itemId: item?.id, value, err });
			toast.error('Failed to update platform');
		} finally {
			saving = false;
		}
	}

	/** Available platforms from a game's meta.platform (comma-separated from IGDB) */
	const gamePlatforms = $derived(
		item?.gameMeta?.platform ? item.gameMeta.platform.split(', ').filter(Boolean) : []
	);

	async function handleRate(rating: number | null) {
		saving = true;
		try {
			await onUpdate({ rating });
		} catch (err) {
			console.error('update rating failed', { itemId: item?.id, rating, err });
			toast.error('Failed to save rating');
		} finally {
			saving = false;
		}
	}

	async function handleTogglePin() {
		if (!item) return;
		saving = true;
		try {
			await onUpdate({ pinned: !item.pinned });
		} catch (err) {
			console.error('toggle pin failed', { itemId: item?.id, err });
			toast.error('Failed to update pin');
		} finally {
			saving = false;
		}
	}

	function formatRelativeTime(date: Date): string {
		const now = Date.now();
		const diff = now - date.getTime();
		const seconds = Math.floor(diff / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		const months = Math.floor(days / 30);
		if (months < 12) return `${months}mo ago`;
		return `${Math.floor(months / 12)}y ago`;
	}

	async function handleAddNote() {
		const content = newNoteText.trim();
		if (!content || !item) return;
		addingNote = true;
		try {
			const note = await addNote({ mediaItemId: item.id, content });
			timelineNotes = [note, ...timelineNotes];
			newNoteText = '';
		} catch (err) {
			console.error('add note failed', { itemId: item?.id, err });
			toast.error('Failed to add note');
		} finally {
			addingNote = false;
		}
	}

	async function handleDeleteNote(noteId: string) {
		const prev = timelineNotes;
		timelineNotes = timelineNotes.filter((n) => n.id !== noteId);
		try {
			await removeNote({ noteId });
		} catch (err) {
			console.error('delete note failed', { noteId, err });
			toast.error('Failed to delete note');
			timelineNotes = prev;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			await onDelete();
			onClose();
		} catch (err) {
			console.error('delete item failed', { itemId: item?.id, title: item?.title, err });
			toast.error('Failed to delete item');
		} finally {
			deleting = false;
		}
	}

	/** Get type-specific metadata fields for display */
	function metaEntries(i: MediaItemWithMeta): Array<{ label: string; value: string }> {
		const entries: Array<{ label: string; value: string }> = [];

		if (i.bookMeta) {
			if (i.bookMeta.author) entries.push({ label: 'Author', value: i.bookMeta.author });
			if (i.bookMeta.genre) entries.push({ label: 'Genre', value: i.bookMeta.genre });
			if (i.bookMeta.pageCount)
				entries.push({ label: 'Pages', value: String(i.bookMeta.pageCount) });
			if (i.bookMeta.publisher) entries.push({ label: 'Publisher', value: i.bookMeta.publisher });
			if (i.bookMeta.language) entries.push({ label: 'Language', value: i.bookMeta.language });
			if (i.bookMeta.isbn) entries.push({ label: 'ISBN', value: i.bookMeta.isbn });
		}
		if (i.movieMeta) {
			if (i.movieMeta.director) entries.push({ label: 'Director', value: i.movieMeta.director });
			if (i.movieMeta.genre) entries.push({ label: 'Genre', value: i.movieMeta.genre });
			if (i.movieMeta.cast) entries.push({ label: 'Cast', value: i.movieMeta.cast });
			if (i.movieMeta.runtime)
				entries.push({ label: 'Runtime', value: formatRuntime(i.movieMeta.runtime) });
		}
		if (i.seriesMeta) {
			if (i.seriesMeta.creator) entries.push({ label: 'Creator', value: i.seriesMeta.creator });
			if (i.seriesMeta.genre) entries.push({ label: 'Genre', value: i.seriesMeta.genre });
			if (i.seriesMeta.cast) entries.push({ label: 'Cast', value: i.seriesMeta.cast });
			if (i.seriesMeta.network) entries.push({ label: 'Network', value: i.seriesMeta.network });
		}
		if (i.gameMeta) {
			if (i.gameMeta.developer) entries.push({ label: 'Developer', value: i.gameMeta.developer });
			if (i.gameMeta.publisher) entries.push({ label: 'Publisher', value: i.gameMeta.publisher });
			if (i.gameMeta.platform) entries.push({ label: 'Platforms', value: i.gameMeta.platform });
			if (i.gameMeta.genre) entries.push({ label: 'Genre', value: i.gameMeta.genre });
			if (i.gameMeta.criticScore != null)
				entries.push({ label: 'Critic score', value: `${i.gameMeta.criticScore} / 100` });
			if (i.gameMeta.userScore != null)
				entries.push({ label: 'User score', value: `${i.gameMeta.userScore} / 100` });
			if (i.gameMeta.playtimeMinutes)
				entries.push({
					label: 'Playtime',
					value: `${Math.round(i.gameMeta.playtimeMinutes / 60)}h`
				});
		}
		if (i.podcastMeta) {
			if (i.podcastMeta.host) entries.push({ label: 'Host', value: i.podcastMeta.host });
			if (i.podcastMeta.genre) entries.push({ label: 'Genre', value: i.podcastMeta.genre });
			if (i.podcastMeta.publisher)
				entries.push({ label: 'Publisher', value: i.podcastMeta.publisher });
			if (i.podcastMeta.frequency)
				entries.push({ label: 'Frequency', value: i.podcastMeta.frequency });
			if (i.podcastMeta.episodeLength)
				entries.push({ label: 'Avg. episode', value: `${i.podcastMeta.episodeLength}m` });
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
				<div class="flex items-center gap-2">
					<Sheet.Title class="flex min-w-0 items-center gap-2 truncate">
						{item.title}
						{#if seasonLabel}
							<span
								class="shrink-0 rounded bg-primary px-1.5 py-0.5 text-xs leading-none font-bold text-primary-foreground"
							>
								{seasonLabel}
							</span>
						{/if}
					</Sheet.Title>
					<button
						class="shrink-0 rounded p-1 transition-colors hover:bg-muted"
						onclick={handleTogglePin}
						aria-label={item.pinned ? 'Unpin item' : 'Pin item'}
					>
						{#if item.pinned}
							<PinOff class="size-4 fill-foreground text-foreground" />
						{:else}
							<Pin class="size-4 text-muted-foreground" />
						{/if}
					</button>
				</div>
				<Sheet.Description class="sr-only">Item details</Sheet.Description>
			</Sheet.Header>

			<!-- Scrollable content -->
			<div bind:this={scrollRef} class="flex-1 overflow-y-auto px-5 py-4">
				<!-- Cover + basic info -->
				<div class="flex gap-4">
					<MediaCover title={item.title} coverUrl={item.coverUrl} size="lg" />
					<div class="min-w-0 flex-1 space-y-2">
						{#if item.releaseYear}
							<p class="text-sm text-muted-foreground">{item.releaseYear}</p>
						{/if}

						{#each metaEntries(item) as entry (entry.label)}
							<div>
								<span class="text-xs text-muted-foreground">{entry.label}</span>
								<p class="text-sm text-foreground">{entry.value}</p>
							</div>
						{/each}
						{#if item.seriesMeta?.seriesStatus}
							<div>
								<span class="text-xs text-muted-foreground">Status</span>
								<Tooltip.Provider>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<p
												class="text-sm text-foreground underline decoration-dotted underline-offset-2"
											>
												{item.seriesMeta.seriesStatus}
											</p>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>
												{SERIES_STATUS_DESCRIPTIONS[item.seriesMeta.seriesStatus] ??
													item.seriesMeta.seriesStatus}
											</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</div>
						{/if}
					</div>
				</div>

				<!-- Description -->
				{#if description}
					<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				{/if}

				<Separator class="my-5" />

				<!-- Status -->
				<div class="space-y-1.5">
					<Label>Status</Label>
					<Select.Root
						type="single"
						value={item.status}
						onValueChange={handleStatusChange}
						disabled={saving}
					>
						<Select.Trigger class="w-full">
							{labels[item.status]}
						</Select.Trigger>
						<Select.Content>
							{#each MEDIA_STATUSES as status (status)}
								<Select.Item value={status}>{labels[status]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Dates -->
				<div class="mt-5 grid grid-cols-2 gap-3">
					<DatePicker
						label="Started"
						value={item.startedAt}
						disabled={saving}
						onchange={(d) => onUpdate({ startedAt: d?.toISOString() ?? null })}
					/>
					<DatePicker
						label="Completed"
						value={item.completedAt}
						disabled={saving}
						onchange={(d) => onUpdate({ completedAt: d?.toISOString() ?? null })}
					/>
				</div>

				<!-- Season selector (series only) -->
				{#if item.seriesMeta}
					{@const currentSeason = item.seriesMeta.currentSeason ?? 0}
					<div class="mt-5 space-y-1.5">
						<Label>Season</Label>
						<div class="flex flex-wrap gap-1.5" role="group" aria-label="Season">
							<button
								aria-pressed={currentSeason === 0}
								class="rounded border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50
						{currentSeason === 0
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border bg-muted text-muted-foreground hover:border-foreground/30'}"
								disabled={saving}
								onclick={() => handleSeasonSelect(null)}
							>
								All
							</button>
							{#if item.seriesMeta.totalSeasons}
								{#each Array.from({ length: item.seriesMeta.totalSeasons }, (_, i) => i + 1) as season (season)}
									<button
										aria-pressed={currentSeason === season}
										class="rounded border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50
								{currentSeason === season
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-muted text-muted-foreground hover:border-foreground/30'}"
										disabled={saving}
										onclick={() => handleSeasonSelect(season)}
									>
										S{season}
									</button>
								{/each}
							{/if}
						</div>
					</div>

					<!-- Watching on -->
					<div class="mt-5 space-y-1.5">
						<Label>Watching on</Label>
						<Select.Root
							type="single"
							value={item.seriesMeta.watchingOn ?? undefined}
							onValueChange={handleWatchingOnChange}
							disabled={saving}
						>
							<Select.Trigger class="w-full">
								{item.seriesMeta.watchingOn ?? 'Select platform...'}
							</Select.Trigger>
							<Select.Content>
								{#each STREAMING_PLATFORMS as platform (platform)}
									<Select.Item value={platform}>{platform}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<!-- Playing on (games only) -->
				{#if item.gameMeta}
					<div class="mt-5 space-y-1.5">
						<Label>Playing on</Label>
						{#if gamePlatforms.length > 0}
							<Select.Root
								type="single"
								value={item.gameMeta.playingOn ?? undefined}
								onValueChange={handlePlayingOnChange}
								disabled={saving}
							>
								<Select.Trigger class="w-full">
									{item.gameMeta.playingOn ?? 'Select platform...'}
								</Select.Trigger>
								<Select.Content>
									{#each gamePlatforms as platform (platform)}
										<Select.Item value={platform}>{platform}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{:else}
							<p class="text-sm text-muted-foreground">No platforms available</p>
						{/if}
					</div>
				{/if}

				<!-- Listening on (podcasts only) -->
				{#if item.podcastMeta}
					<div class="mt-5 space-y-1.5">
						<Label>Listening on</Label>
						<Select.Root
							type="single"
							value={item.podcastMeta.listeningOn ?? undefined}
							onValueChange={handleListeningOnChange}
							disabled={saving}
						>
							<Select.Trigger class="w-full">
								{item.podcastMeta.listeningOn ?? 'Select platform...'}
							</Select.Trigger>
							<Select.Content>
								{#each PODCAST_PLATFORMS as platform (platform)}
									<Select.Item value={platform}>{platform}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<!-- Rating -->
				<div class="mt-5 space-y-1.5">
					<Label>Rating</Label>
					<StarRating value={item.rating} onRate={handleRate} />
				</div>

				<!-- Notes timeline -->
				<div class="mt-5 space-y-3">
					<Label>Notes</Label>

					<!-- Add note form -->
					<div class="space-y-2">
						<Textarea
							rows={2}
							placeholder="Add a note..."
							bind:value={newNoteText}
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote();
							}}
						/>
						<div class="flex justify-end">
							<Button
								size="sm"
								class="gap-1.5"
								onclick={handleAddNote}
								disabled={addingNote || !newNoteText.trim()}
							>
								<Send class="size-3.5" />
								{addingNote ? 'Adding...' : 'Add note'}
							</Button>
						</div>
					</div>

					<!-- Timeline -->
					{#if notesLoading}
						<p class="text-xs text-muted-foreground">Loading notes...</p>
					{:else if timelineNotes.length === 0 && !item.notes}
						<p class="text-xs text-muted-foreground">No notes yet.</p>
					{:else}
						<div class="space-y-2">
							{#each timelineNotes as note (note.id)}
								<div class="group flex items-start gap-2 rounded-md border border-border p-2.5">
									<div class="min-w-0 flex-1">
										<p class="text-sm whitespace-pre-wrap text-foreground">{note.content}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											{formatRelativeTime(new Date(note.createdAt))}
										</p>
									</div>
									<button
										class="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
										onclick={() => (pendingDeleteNoteId = note.id)}
										aria-label="Delete note"
									>
										<X class="size-3.5 text-muted-foreground hover:text-destructive" />
									</button>
								</div>
							{/each}
						</div>

						<!-- Legacy notes (old single-field) -->
						{#if item.notes}
							<div class="rounded-md border border-dashed border-border p-2.5">
								<p class="mb-1 text-xs font-medium text-muted-foreground">Previous notes</p>
								<p class="text-sm whitespace-pre-wrap text-foreground">{item.notes}</p>
							</div>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Note delete confirmation (shared single dialog) -->
			<AlertDialog.Root
				open={pendingDeleteNoteId !== null}
				onOpenChange={(v) => {
					if (!v) pendingDeleteNoteId = null;
				}}
			>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete note?</AlertDialog.Title>
						<AlertDialog.Description>This note will be permanently deleted.</AlertDialog.Description
						>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action
							class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
							onclick={() => {
								if (pendingDeleteNoteId) handleDeleteNote(pendingDeleteNoteId);
								pendingDeleteNoteId = null;
							}}
						>
							Delete
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			<!-- Footer actions -->
			<Sheet.Footer class="border-t border-border px-5 py-4">
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="destructive" class="w-full" disabled={deleting}>
								{deleting ? 'Deleting...' : 'Delete item'}
							</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Delete item?</AlertDialog.Title>
							<AlertDialog.Description>
								This will permanently delete this item and all its notes. This cannot be undone.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action
								class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
								onclick={handleDelete}
							>
								Delete
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
