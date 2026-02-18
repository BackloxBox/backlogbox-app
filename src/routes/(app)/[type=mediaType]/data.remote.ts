import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, query } from '$app/server';
import { requireSubscription } from '$lib/server/auth-guard';
import { log } from '$lib/server/logger';
import {
	createMediaItem,
	deleteMediaItem,
	getItemsByTypeAndUser,
	reorderMediaItems,
	updateMediaItemFields,
	updateMediaItemMeta,
	getNotesByItem,
	createNote,
	deleteNoteById
} from '$lib/server/db/queries';
import {
	slugToMediaType,
	type MediaType,
	type BookMetaFields,
	type MovieMetaFields,
	type SeriesMetaFields,
	type GameMetaFields,
	type PodcastMetaFields,
	type MetaFieldsFor
} from '$lib/types';

// --- Reusable field schemas ---

const optStr = v.optional(v.nullable(v.string()));
const optNum = v.optional(v.nullable(v.number()));

const mediaStatusSchema = v.picklist([
	'wishlist',
	'backlog',
	'in_progress',
	'on_hold',
	'completed',
	'abandoned'
]);

/** Shared base fields present in every add-item variant */
const addItemBase = {
	title: v.pipe(v.string(), v.nonEmpty()),
	coverUrl: optStr,
	releaseYear: optNum,
	status: v.optional(mediaStatusSchema, 'backlog' as const)
};

// --- Per-type meta field schemas ---

const bookMetaSchema = v.object({
	author: optStr,
	genre: optStr,
	description: optStr,
	pageCount: optNum,
	isbn: optStr,
	language: optStr,
	publisher: optStr
});

const movieMetaSchema = v.object({
	director: optStr,
	genre: optStr,
	description: optStr,
	cast: optStr,
	runtime: optNum,
	tmdbId: optNum
});

const seriesMetaSchema = v.object({
	genre: optStr,
	description: optStr,
	creator: optStr,
	cast: optStr,
	network: optStr,
	seriesStatus: optStr,
	watchingOn: optStr,
	totalSeasons: optNum,
	currentSeason: optNum,
	tmdbId: optNum
});

const gameMetaSchema = v.object({
	platform: optStr,
	genre: optStr,
	description: optStr,
	developer: optStr,
	publisher: optStr,
	playingOn: optStr,
	criticScore: optNum,
	userScore: optNum,
	playtimeMinutes: optNum,
	igdbId: optNum
});

const podcastMetaSchema = v.object({
	host: optStr,
	genre: optStr,
	description: optStr,
	publisher: optStr,
	listeningOn: optStr,
	frequency: optStr,
	episodeLength: optNum,
	totalEpisodes: optNum,
	currentEpisode: optNum,
	applePodcastId: optStr
});

// --- Add-item discriminated union (keyed on `slug`) ---

const addItemSchema = v.variant('slug', [
	v.object({ slug: v.literal('books'), ...addItemBase, ...bookMetaSchema.entries }),
	v.object({ slug: v.literal('movies'), ...addItemBase, ...movieMetaSchema.entries }),
	v.object({ slug: v.literal('series'), ...addItemBase, ...seriesMetaSchema.entries }),
	v.object({ slug: v.literal('games'), ...addItemBase, ...gameMetaSchema.entries }),
	v.object({ slug: v.literal('podcasts'), ...addItemBase, ...podcastMetaSchema.entries })
]);

type AddItemInput = v.InferOutput<typeof addItemSchema>;

// --- Update-item discriminated union (keyed on `slug`) ---

/** Nullable ISO date string → Date | null */
const dateField = v.optional(
	v.nullable(
		v.pipe(
			v.string(),
			v.transform((s) => new Date(s))
		)
	)
);

const updateFieldsSchema = v.object({
	title: v.optional(v.string()),
	status: v.optional(mediaStatusSchema),
	sortOrder: v.optional(v.number()),
	rating: v.optional(v.nullable(v.number())),
	notes: v.optional(v.nullable(v.string())),
	coverUrl: v.optional(v.nullable(v.string())),
	releaseYear: v.optional(v.nullable(v.number())),
	pinned: v.optional(v.boolean()),
	startedAt: dateField,
	completedAt: dateField
});

const updateItemSchema = v.variant('slug', [
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		slug: v.literal('books'),
		fields: v.optional(updateFieldsSchema),
		meta: v.optional(bookMetaSchema)
	}),
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		slug: v.literal('movies'),
		fields: v.optional(updateFieldsSchema),
		meta: v.optional(movieMetaSchema)
	}),
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		slug: v.literal('series'),
		fields: v.optional(updateFieldsSchema),
		meta: v.optional(seriesMetaSchema)
	}),
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		slug: v.literal('games'),
		fields: v.optional(updateFieldsSchema),
		meta: v.optional(gameMetaSchema)
	}),
	v.object({
		id: v.pipe(v.string(), v.nonEmpty()),
		slug: v.literal('podcasts'),
		fields: v.optional(updateFieldsSchema),
		meta: v.optional(podcastMetaSchema)
	})
]);

const deleteItemSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty()),
	slug: v.string()
});

const reorderSchema = v.object({
	slug: v.string(),
	updates: v.array(
		v.object({
			id: v.pipe(v.string(), v.nonEmpty()),
			status: mediaStatusSchema,
			sortOrder: v.number()
		})
	)
});

// --- Helpers ---

function resolveType(slug: string): MediaType {
	const type = slugToMediaType(slug);
	if (!type) error(400, `Invalid media type slug: ${slug}`);
	return type;
}

/**
 * Extract typed metadata from a flat add-item input.
 * Each branch picks only the fields belonging to that media type,
 * excluding undefined values so we don't insert empty columns.
 */
function extractMeta(type: MediaType, data: AddItemInput): MetaFieldsFor<MediaType> {
	switch (type) {
		case 'book':
			return pick(data as v.InferOutput<(typeof addItemSchema.options)[0]>, [
				'author',
				'genre',
				'description',
				'pageCount',
				'isbn',
				'language',
				'publisher'
			]) satisfies BookMetaFields;
		case 'movie':
			return pick(data as v.InferOutput<(typeof addItemSchema.options)[1]>, [
				'director',
				'genre',
				'description',
				'cast',
				'runtime',
				'tmdbId'
			]) satisfies MovieMetaFields;
		case 'series':
			return pick(data as v.InferOutput<(typeof addItemSchema.options)[2]>, [
				'genre',
				'description',
				'creator',
				'cast',
				'network',
				'seriesStatus',
				'watchingOn',
				'totalSeasons',
				'currentSeason',
				'tmdbId'
			]) satisfies SeriesMetaFields;
		case 'game':
			return pick(data as v.InferOutput<(typeof addItemSchema.options)[3]>, [
				'platform',
				'genre',
				'description',
				'developer',
				'publisher',
				'playingOn',
				'criticScore',
				'userScore',
				'playtimeMinutes',
				'igdbId'
			]) satisfies GameMetaFields;
		case 'podcast':
			return pick(data as v.InferOutput<(typeof addItemSchema.options)[4]>, [
				'host',
				'genre',
				'description',
				'publisher',
				'listeningOn',
				'frequency',
				'episodeLength',
				'totalEpisodes',
				'currentEpisode',
				'applePodcastId'
			]) satisfies PodcastMetaFields;
	}
}

/** Pick defined keys from an object, omitting undefined values */
function pick<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keys: readonly K[]
): Pick<T, K> {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		if (obj[key] !== undefined) {
			result[key] = obj[key];
		}
	}
	return result;
}

// --- Remote functions ---

export const getBoardItems = query(v.string(), async (slug) => {
	const userId = requireSubscription();
	const type = resolveType(slug);
	return getItemsByTypeAndUser(userId, type);
});

export const addItem = command(addItemSchema, async (data) => {
	const userId = requireSubscription();
	const type = resolveType(data.slug);

	const meta = extractMeta(type, data);

	const item = await createMediaItem(
		{
			userId,
			type,
			title: data.title,
			coverUrl: data.coverUrl ?? null,
			releaseYear: data.releaseYear ?? null,
			status: data.status ?? 'backlog',
			sortOrder: 0
		},
		meta,
		type
	);

	return item;
});

export const updateItem = command(updateItemSchema, async (data) => {
	const userId = requireSubscription();
	const type = resolveType(data.slug);

	if (data.fields && Object.keys(data.fields).length > 0) {
		await updateMediaItemFields(data.id, userId, data.fields);
	}

	if (data.meta && Object.keys(data.meta).length > 0) {
		await updateMediaItemMeta(data.id, userId, type, data.meta);
	}
});

export const deleteItem = command(deleteItemSchema, async (data) => {
	const userId = requireSubscription();
	const type = resolveType(data.slug);
	const deleted = await deleteMediaItem(data.id, userId);
	if (!deleted) error(404, 'Item not found');

	log.info({ userId, itemId: data.id, type }, 'media item deleted');
});

export const reorderItems = command(reorderSchema, async (data) => {
	const userId = requireSubscription();
	resolveType(data.slug);
	await reorderMediaItems(userId, data.updates);
});

// --- Notes ---

export const getItemNotes = query(v.pipe(v.string(), v.nonEmpty()), async (mediaItemId) => {
	const userId = requireSubscription();
	return getNotesByItem(mediaItemId, userId);
});

const addNoteSchema = v.object({
	mediaItemId: v.pipe(v.string(), v.nonEmpty()),
	content: v.pipe(v.string(), v.nonEmpty())
});

export const addNote = command(addNoteSchema, async (data) => {
	const userId = requireSubscription();
	const note = await createNote(data.mediaItemId, userId, data.content);
	if (!note) error(404, 'Item not found');
	return note;
});

const deleteNoteSchema = v.object({
	noteId: v.pipe(v.string(), v.nonEmpty())
});

export const removeNote = command(deleteNoteSchema, async (data) => {
	const userId = requireSubscription();
	const deleted = await deleteNoteById(data.noteId, userId);
	if (!deleted) error(404, 'Note not found');
});
