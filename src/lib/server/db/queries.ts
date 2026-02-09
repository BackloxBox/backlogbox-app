import { and, asc, eq } from 'drizzle-orm';
import { db } from './index';
import { bookMeta, gameMeta, mediaItem, movieMeta, podcastMeta, seriesMeta } from './schema';
import type { MediaStatus, MediaType } from '$lib/types';

/** Metadata table lookup by media type */
const META_TABLE = {
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

/** Insert a media item + its metadata in a transaction */
export async function createMediaItem(
	data: typeof mediaItem.$inferInsert,
	meta: Record<string, unknown>,
	type: MediaType
) {
	const metaTable = META_TABLE[type];

	return db.transaction(async (tx) => {
		const [item] = await tx.insert(mediaItem).values(data).returning();

		if (Object.keys(meta).length > 0) {
			await tx.insert(metaTable).values({ mediaItemId: item.id, ...meta } as never);
		}

		return item;
	});
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

/** Update type-specific metadata */
export async function updateMediaItemMeta(
	itemId: string,
	type: MediaType,
	meta: Record<string, unknown>
) {
	const metaTable = META_TABLE[type];

	await db
		.insert(metaTable)
		.values({ mediaItemId: itemId, ...meta } as never)
		.onConflictDoUpdate({
			target: metaTable.mediaItemId,
			set: meta as never
		});
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
