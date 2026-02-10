import { and, asc, eq } from 'drizzle-orm';
import { db } from './index';
import { bookMeta, gameMeta, mediaItem, movieMeta, podcastMeta, seriesMeta } from './schema';
import type {
	MediaStatus,
	MediaType,
	BookMetaFields,
	MovieMetaFields,
	SeriesMetaFields,
	GameMetaFields,
	PodcastMetaFields,
	MetaFieldsFor
} from '$lib/types';

// ---------------------------------------------------------------------------
// Meta table registry — maps MediaType to its Drizzle table
// ---------------------------------------------------------------------------

const META_TABLES = {
	book: bookMeta,
	movie: movieMeta,
	series: seriesMeta,
	game: gameMeta,
	podcast: podcastMeta
} as const;

/** Relation name lookup for Drizzle relational queries */
const META_RELATION = {
	book: 'bookMeta',
	movie: 'movieMeta',
	series: 'seriesMeta',
	game: 'gameMeta',
	podcast: 'podcastMeta'
} as const;

export type MediaItemWithMeta = Awaited<ReturnType<typeof getItemsByTypeAndUser>>[number];

/** Fetch all items for a user + type, ordered by sortOrder within each status */
export async function getItemsByTypeAndUser(userId: string, type: MediaType) {
	const metaRelation = META_RELATION[type];

	return db.query.mediaItem.findMany({
		where: and(eq(mediaItem.userId, userId), eq(mediaItem.type, type)),
		orderBy: [asc(mediaItem.sortOrder)],
		with: {
			[metaRelation]: true
		}
	});
}

// ---------------------------------------------------------------------------
// Type-safe meta insert helpers — one per media type
// These avoid `as never` by calling the concrete table's insert directly.
// ---------------------------------------------------------------------------

// (Type-safe meta helpers are inlined in createMediaItem and updateMediaItemMeta below)

// ---------------------------------------------------------------------------
// Public CRUD functions
// ---------------------------------------------------------------------------

/** Insert a media item + its metadata in a transaction */
export async function createMediaItem<T extends MediaType>(
	data: typeof mediaItem.$inferInsert,
	meta: MetaFieldsFor<T>,
	type: T
) {
	return db.transaction(async (tx) => {
		const [item] = await tx.insert(mediaItem).values(data).returning();
		if (!item) throw new Error('Insert failed: no row returned');

		if (Object.keys(meta).length > 0) {
			// Transaction-scoped insert — use raw table for tx context
			await insertMetaTx(tx, type, item.id, meta);
		}

		return item;
	});
}

/**
 * Transaction-scoped meta insert — mirrors insertMeta but uses the tx handle.
 * The `as` casts here are safe because the overload signatures at the public
 * API boundary (`createMediaItem<T>`) guarantee the meta shape matches T.
 */
function insertMetaTx(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	type: MediaType,
	mediaItemId: string,
	meta: MetaFieldsFor<MediaType>
): Promise<unknown> {
	switch (type) {
		case 'book':
			return tx.insert(bookMeta).values({ mediaItemId, ...(meta as BookMetaFields) });
		case 'movie':
			return tx.insert(movieMeta).values({ mediaItemId, ...(meta as MovieMetaFields) });
		case 'series':
			return tx.insert(seriesMeta).values({ mediaItemId, ...(meta as SeriesMetaFields) });
		case 'game':
			return tx.insert(gameMeta).values({ mediaItemId, ...(meta as GameMetaFields) });
		case 'podcast':
			return tx.insert(podcastMeta).values({ mediaItemId, ...(meta as PodcastMetaFields) });
	}
}

/** Update a media item's shared fields */
export async function updateMediaItemFields(
	itemId: string,
	userId: string,
	fields: Partial<{
		title: string;
		status: MediaStatus;
		sortOrder: number;
		rating: number | null;
		notes: string | null;
		coverUrl: string | null;
		releaseYear: number | null;
	}>
) {
	const [updated] = await db
		.update(mediaItem)
		.set(fields)
		.where(and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId)))
		.returning();

	return updated;
}

/** Update type-specific metadata (upsert) */
export async function updateMediaItemMeta<T extends MediaType>(
	itemId: string,
	type: T,
	meta: Partial<MetaFieldsFor<T>>
) {
	if (Object.keys(meta).length === 0) return;

	// Dispatch to the correct table — the switch narrows `type` so each
	// branch can safely pass `meta` to the concrete table's insert.
	switch (type) {
		case 'book': {
			const m = meta as BookMetaFields;
			await db
				.insert(bookMeta)
				.values({ mediaItemId: itemId, ...m })
				.onConflictDoUpdate({ target: bookMeta.mediaItemId, set: m });
			break;
		}
		case 'movie': {
			const m = meta as MovieMetaFields;
			await db
				.insert(movieMeta)
				.values({ mediaItemId: itemId, ...m })
				.onConflictDoUpdate({ target: movieMeta.mediaItemId, set: m });
			break;
		}
		case 'series': {
			const m = meta as SeriesMetaFields;
			await db
				.insert(seriesMeta)
				.values({ mediaItemId: itemId, ...m })
				.onConflictDoUpdate({ target: seriesMeta.mediaItemId, set: m });
			break;
		}
		case 'game': {
			const m = meta as GameMetaFields;
			await db
				.insert(gameMeta)
				.values({ mediaItemId: itemId, ...m })
				.onConflictDoUpdate({ target: gameMeta.mediaItemId, set: m });
			break;
		}
		case 'podcast': {
			const m = meta as PodcastMetaFields;
			await db
				.insert(podcastMeta)
				.values({ mediaItemId: itemId, ...m })
				.onConflictDoUpdate({ target: podcastMeta.mediaItemId, set: m });
			break;
		}
	}
}

/** Delete a media item (cascades to metadata) */
export async function deleteMediaItem(itemId: string, userId: string) {
	const [deleted] = await db
		.delete(mediaItem)
		.where(and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId)))
		.returning();

	return deleted;
}

/** Batch update sortOrder for multiple items (used after drag-and-drop) */
export async function reorderMediaItems(
	userId: string,
	updates: Array<{ id: string; status: MediaStatus; sortOrder: number }>
) {
	await db.transaction(async (tx) => {
		for (const { id, status, sortOrder } of updates) {
			await tx
				.update(mediaItem)
				.set({ status, sortOrder })
				.where(and(eq(mediaItem.id, id), eq(mediaItem.userId, userId)));
		}
	});
}
