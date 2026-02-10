<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import MediaCover from './MediaCover.svelte';
	import StarRating from './StarRating.svelte';
	import { getSeasonBadge, formatRuntime } from './card-utils';
	import {
		MEDIA_STATUSES,
		STATUS_LABELS,
		STREAMING_PLATFORMS,
		type MediaStatus,
		type MediaType
	} from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';
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

	let notes = $state('');
	let saving = $state(false);
	let deleting = $state(false);
	let scrollRef = $state<HTMLDivElement | null>(null);

	// Sync notes + reset scroll when item changes
	$effect(() => {
		notes = item?.notes ?? '';
		scrollRef?.scrollTo(0, 0);
	});

	const seasonLabel = $derived(item ? getSeasonBadge(item) : null);
	const description = $derived(
		item?.bookMeta?.description ??
			item?.movieMeta?.description ??
			item?.seriesMeta?.description ??
			item?.gameMeta?.description
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

	let notesTimer: ReturnType<typeof setTimeout> | undefined;

	// Clear pending notes timer when panel closes or item changes
	$effect(() => {
		item; // track item reactively
		return () => clearTimeout(notesTimer);
	});

	function handleNotesInput() {
		clearTimeout(notesTimer);
		notesTimer = setTimeout(async () => {
			saving = true;
			try {
				await onUpdate({ notes: notes || null });
			} catch (err) {
				console.error('save notes failed', { itemId: item?.id, err });
				toast.error('Failed to save notes');
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
				<Sheet.Title class="flex items-center gap-2 truncate">
					{item.title}
					{#if seasonLabel}
						<span
							class="shrink-0 rounded bg-primary px-1.5 py-0.5 text-xs leading-none font-bold text-primary-foreground"
						>
							{seasonLabel}
						</span>
					{/if}
				</Sheet.Title>
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

						{#each metaEntries(item) as entry}
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
							{#each MEDIA_STATUSES as status}
								<Select.Item value={status}>{labels[status]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
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
								{#each { length: item.seriesMeta.totalSeasons } as _, i}
									{@const season = i + 1}
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
								{#each STREAMING_PLATFORMS as platform}
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
									{#each gamePlatforms as platform}
										<Select.Item value={platform}>{platform}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{:else}
							<p class="text-sm text-muted-foreground">No platforms available</p>
						{/if}
					</div>
				{/if}

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
