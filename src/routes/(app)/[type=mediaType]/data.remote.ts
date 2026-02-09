import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, query } from '$app/server';
import { requireUserId } from '$lib/server/auth-guard';
import {
	createMediaItem,
	deleteMediaItem,
	getItemsByTypeAndUser,
	reorderMediaItems,
	updateMediaItemFields,
	updateMediaItemMeta
} from '$lib/server/db/queries';
import { slugToMediaType, type MediaStatus, type MediaType } from '$lib/types';

// --- Validation schemas ---

const mediaStatusSchema = v.picklist([
	'wishlist',
	'backlog',
	'in_progress',
	'on_hold',
	'completed',
	'abandoned'
]);

const addItemSchema = v.object({
	slug: v.string(),
	title: v.pipe(v.string(), v.nonEmpty()),
	coverUrl: v.optional(v.nullable(v.string())),
	releaseYear: v.optional(v.nullable(v.number())),
	status: v.optional(mediaStatusSchema, 'backlog'),
	// Type-specific metadata (all optional)
	author: v.optional(v.nullable(v.string())),
	description: v.optional(v.nullable(v.string())),
	pageCount: v.optional(v.nullable(v.number())),
	isbn: v.optional(v.nullable(v.string())),
	director: v.optional(v.nullable(v.string())),
	cast: v.optional(v.nullable(v.string())),
	genre: v.optional(v.nullable(v.string())),
	runtime: v.optional(v.nullable(v.number())),
	tmdbId: v.optional(v.nullable(v.number())),
	totalSeasons: v.optional(v.nullable(v.number())),
	currentSeason: v.optional(v.nullable(v.number())),
	platform: v.optional(v.nullable(v.string())),
	playtimeMinutes: v.optional(v.nullable(v.number())),
	igdbId: v.optional(v.nullable(v.number())),
	host: v.optional(v.nullable(v.string())),
	totalEpisodes: v.optional(v.nullable(v.number())),
	currentEpisode: v.optional(v.nullable(v.number())),
	applePodcastId: v.optional(v.nullable(v.string()))
});

const updateItemSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty()),
	slug: v.string(),
	fields: v.optional(
		v.object({
			title: v.optional(v.string()),
			status: v.optional(mediaStatusSchema),
			sortOrder: v.optional(v.number()),
			rating: v.optional(v.nullable(v.number())),
			notes: v.optional(v.nullable(v.string())),
			coverUrl: v.optional(v.nullable(v.string())),
			releaseYear: v.optional(v.nullable(v.number()))
		})
	),
	meta: v.optional(v.record(v.string(), v.unknown()))
});

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

/** Extract metadata fields for a given type from flat input */
function extractMeta(type: MediaType, data: Record<string, unknown>): Record<string, unknown> {
	const metaFields: Record<MediaType, string[]> = {
		book: ['author', 'genre', 'description', 'pageCount', 'isbn'],
		movie: ['director', 'genre', 'description', 'cast', 'runtime', 'tmdbId'],
		series: ['genre', 'totalSeasons', 'currentSeason', 'tmdbId'],
		game: ['platform', 'genre', 'playtimeMinutes', 'igdbId'],
		podcast: ['host', 'totalEpisodes', 'currentEpisode', 'applePodcastId']
	};

	const fields = metaFields[type];
	const meta: Record<string, unknown> = {};
	for (const field of fields) {
		if (data[field] !== undefined) {
			meta[field] = data[field];
		}
	}
	return meta;
}

// --- Remote functions ---

export const getBoardItems = query(v.string(), async (slug) => {
	const userId = requireUserId();
	const type = resolveType(slug);
	return getItemsByTypeAndUser(userId, type);
});

export const addItem = command(addItemSchema, async (data) => {
	const userId = requireUserId();
	const type = resolveType(data.slug);

	const meta = extractMeta(type, data);

	const item = await createMediaItem(
		{
			userId,
			type,
			title: data.title,
			coverUrl: data.coverUrl ?? null,
			releaseYear: data.releaseYear ?? null,
			status: (data.status ?? 'backlog') as MediaStatus,
			sortOrder: 0
		},
		meta,
		type
	);

	return item;
});

export const updateItem = command(updateItemSchema, async (data) => {
	const userId = requireUserId();
	const type = resolveType(data.slug);

	if (data.fields && Object.keys(data.fields).length > 0) {
		await updateMediaItemFields(data.id, userId, data.fields);
	}

	if (data.meta && Object.keys(data.meta).length > 0) {
		await updateMediaItemMeta(data.id, type, data.meta);
	}
});

export const deleteItem = command(deleteItemSchema, async (data) => {
	const userId = requireUserId();
	resolveType(data.slug);
	const deleted = await deleteMediaItem(data.id, userId);
	if (!deleted) error(404, 'Item not found');
});

export const reorderItems = command(reorderSchema, async (data) => {
	const userId = requireUserId();
	resolveType(data.slug);
	await reorderMediaItems(userId, data.updates);
});
