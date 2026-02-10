import { and, asc, count, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './index';
import {
	bookMeta,
	gameMeta,
	mediaItem,
	mediaNote,
	movieMeta,
	podcastMeta,
	seriesMeta,
	user
} from './schema';
import {
	MEDIA_TYPES,
	MEDIA_STATUSES,
	type MediaStatus,
	type MediaType,
	type BookMetaFields,
	type MovieMetaFields,
	type SeriesMetaFields,
	type GameMetaFields,
	type PodcastMetaFields,
	type MetaFieldsFor
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
		pinned: boolean;
	}>
) {
	// Auto-manage completedAt on status transitions
	const completedAt =
		fields.status === 'completed' ? new Date() : fields.status !== undefined ? null : undefined;
	const setFields = completedAt !== undefined ? { ...fields, completedAt } : fields;

	const [updated] = await db
		.update(mediaItem)
		.set(setFields)
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
			const completedAt = status === 'completed' ? new Date() : null;
			await tx
				.update(mediaItem)
				.set({ status, sortOrder, completedAt })
				.where(and(eq(mediaItem.id, id), eq(mediaItem.userId, userId)));
		}
	});
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export type MediaNoteRow = typeof mediaNote.$inferSelect;

/** Get all notes for a media item, newest first */
export async function getNotesByItem(mediaItemId: string): Promise<MediaNoteRow[]> {
	return db.query.mediaNote.findMany({
		where: eq(mediaNote.mediaItemId, mediaItemId),
		orderBy: [desc(mediaNote.createdAt)]
	});
}

/** Add a note to a media item */
export async function createNote(mediaItemId: string, content: string): Promise<MediaNoteRow> {
	const [note] = await db.insert(mediaNote).values({ mediaItemId, content }).returning();
	return note;
}

/** Delete a note by id */
export async function deleteNoteById(noteId: string): Promise<boolean> {
	const [deleted] = await db.delete(mediaNote).where(eq(mediaNote.id, noteId)).returning();
	return !!deleted;
}

// ---------------------------------------------------------------------------
// User profile queries
// ---------------------------------------------------------------------------

/** Public user profile fields — no email, no sensitive data */
export type PublicUser = {
	id: string;
	name: string;
	username: string;
	image: string | null;
};

/** Look up a public user by username. Returns null if not found or profile is private. */
export async function getPublicUserByUsername(username: string): Promise<PublicUser | null> {
	const row = await db.query.user.findFirst({
		where: and(eq(user.username, username), eq(user.profilePublic, true)),
		columns: { id: true, name: true, username: true, image: true }
	});
	if (!row?.username) return null;
	return { id: row.id, name: row.name, username: row.username, image: row.image };
}

/** Get a user's own profile fields for the settings page */
export async function getUserProfile(userId: string) {
	return db.query.user.findFirst({
		where: eq(user.id, userId),
		columns: {
			id: true,
			name: true,
			email: true,
			username: true,
			profilePublic: true,
			subscribed: true,
			freeAccess: true
		}
	});
}

/** Set user subscription status (called from Polar webhooks) */
export async function setUserSubscribed(userId: string, subscribed: boolean) {
	await db.update(user).set({ subscribed }).where(eq(user.id, userId));
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export type DashboardStats = {
	typeCounts: Record<MediaType, { total: number; completed: number }>;
	statusCounts: Array<{ status: MediaStatus; count: number }>;
	topGenres: Array<{ genre: string; type: MediaType; count: number }>;
	addedActivity: Array<{ date: string; count: number }>;
	completedActivity: Array<{ date: string; count: number }>;
	monthlyCompletions: Array<{ month: string } & Record<MediaType, number>>;
	recentItems: Array<{
		title: string;
		type: MediaType;
		status: MediaStatus;
		createdAt: Date;
		coverUrl: string | null;
	}>;
	totalItems: number;
	totalCompleted: number;
};

/** Aggregate dashboard statistics for a user */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
	const oneYearAgo = new Date();
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const [typeStatusRows, addedRows, completedRows, monthlyRows, recentRows, genreRows] =
		await Promise.all([
			// 1. Type + status group counts
			db
				.select({
					type: mediaItem.type,
					status: mediaItem.status,
					count: count()
				})
				.from(mediaItem)
				.where(eq(mediaItem.userId, userId))
				.groupBy(mediaItem.type, mediaItem.status),

			// 2. Added activity (365 days)
			db
				.select({
					date: sql<string>`date(${mediaItem.createdAt})`,
					count: count()
				})
				.from(mediaItem)
				.where(and(eq(mediaItem.userId, userId), gte(mediaItem.createdAt, oneYearAgo)))
				.groupBy(sql`date(${mediaItem.createdAt})`),

			// 3. Completed activity (365 days)
			db
				.select({
					date: sql<string>`date(${mediaItem.completedAt})`,
					count: count()
				})
				.from(mediaItem)
				.where(and(eq(mediaItem.userId, userId), gte(mediaItem.completedAt, oneYearAgo)))
				.groupBy(sql`date(${mediaItem.completedAt})`),

			// 4. Monthly completions by type (6 months)
			db
				.select({
					month: sql<string>`to_char(date_trunc('month', ${mediaItem.completedAt}), 'YYYY-MM')`,
					type: mediaItem.type,
					count: count()
				})
				.from(mediaItem)
				.where(and(eq(mediaItem.userId, userId), gte(mediaItem.completedAt, sixMonthsAgo)))
				.groupBy(sql`date_trunc('month', ${mediaItem.completedAt})`, mediaItem.type),

			// 5. Recent items (last 5)
			db
				.select({
					title: mediaItem.title,
					type: mediaItem.type,
					status: mediaItem.status,
					createdAt: mediaItem.createdAt,
					coverUrl: mediaItem.coverUrl
				})
				.from(mediaItem)
				.where(eq(mediaItem.userId, userId))
				.orderBy(desc(mediaItem.createdAt))
				.limit(5),

			// 6. Top genres with media type (union across all meta tables with genre column)
			db.execute<{ genre: string; type: MediaType; count: string }>(sql`
				SELECT genre, type, COUNT(*) as count FROM (
					SELECT ${bookMeta.genre} as genre, ${mediaItem.type} as type FROM ${bookMeta}
						JOIN ${mediaItem} ON ${mediaItem.id} = ${bookMeta.mediaItemId}
						WHERE ${mediaItem.userId} = ${userId} AND ${bookMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${movieMeta.genre}, ${mediaItem.type} FROM ${movieMeta}
						JOIN ${mediaItem} ON ${mediaItem.id} = ${movieMeta.mediaItemId}
						WHERE ${mediaItem.userId} = ${userId} AND ${movieMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${seriesMeta.genre}, ${mediaItem.type} FROM ${seriesMeta}
						JOIN ${mediaItem} ON ${mediaItem.id} = ${seriesMeta.mediaItemId}
						WHERE ${mediaItem.userId} = ${userId} AND ${seriesMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${gameMeta.genre}, ${mediaItem.type} FROM ${gameMeta}
						JOIN ${mediaItem} ON ${mediaItem.id} = ${gameMeta.mediaItemId}
						WHERE ${mediaItem.userId} = ${userId} AND ${gameMeta.genre} IS NOT NULL
				) AS genres
				GROUP BY genre, type ORDER BY count DESC LIMIT 8
			`)
		]);

	// Build typeCounts
	const typeCounts = Object.fromEntries(
		MEDIA_TYPES.map((t) => [t, { total: 0, completed: 0 }])
	) as Record<MediaType, { total: number; completed: number }>;

	let totalItems = 0;
	let totalCompleted = 0;

	for (const row of typeStatusRows) {
		const c = Number(row.count);
		typeCounts[row.type].total += c;
		totalItems += c;
		if (row.status === 'completed') {
			typeCounts[row.type].completed += c;
			totalCompleted += c;
		}
	}

	// Build monthly completions — pivot type rows into { month, book, movie, ... }
	const monthlyMap = new Map<string, Record<MediaType, number>>();
	for (const row of monthlyRows) {
		const month = row.month;
		if (!monthlyMap.has(month)) {
			monthlyMap.set(
				month,
				Object.fromEntries(MEDIA_TYPES.map((t) => [t, 0])) as Record<MediaType, number>
			);
		}
		const entry = monthlyMap.get(month);
		if (entry) entry[row.type] = Number(row.count);
	}

	const monthlyCompletions = [...monthlyMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([month, counts]) => ({ month, ...counts }));

	// Build status distribution from typeStatusRows (already have the data)
	const statusMap = new Map<MediaStatus, number>();
	for (const row of typeStatusRows) {
		const prev = statusMap.get(row.status) ?? 0;
		statusMap.set(row.status, prev + Number(row.count));
	}
	const statusCounts = MEDIA_STATUSES.filter((s) => statusMap.has(s)).map((s) => ({
		status: s,
		count: statusMap.get(s) ?? 0
	}));

	// Build top genres from raw SQL result
	const topGenres = [...genreRows].map((r) => ({
		genre: r.genre,
		type: r.type,
		count: Number(r.count)
	}));

	return {
		typeCounts,
		statusCounts,
		topGenres,
		addedActivity: addedRows.map((r) => ({ date: r.date, count: Number(r.count) })),
		completedActivity: completedRows.map((r) => ({ date: r.date, count: Number(r.count) })),
		monthlyCompletions,
		recentItems: recentRows,
		totalItems,
		totalCompleted
	};
}

/** Update user profile fields (name, username, profilePublic) */
export async function updateUserProfile(
	userId: string,
	fields: Partial<{ name: string; username: string | null; profilePublic: boolean }>
) {
	const [updated] = await db.update(user).set(fields).where(eq(user.id, userId)).returning({
		id: user.id,
		name: user.name,
		username: user.username,
		profilePublic: user.profilePublic
	});
	return updated;
}
