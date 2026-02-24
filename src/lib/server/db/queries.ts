import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { db } from './index';
import {
	bookMeta,
	excludedSeed,
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

/** Update a media item's shared fields.
 *
 * Date auto-management on status transitions (only when dates aren't explicitly provided):
 * - → in_progress: set startedAt = now (preserves existing)
 * - → completed: set completedAt = now (preserves existing)
 * - → other status: clear both dates
 * - no status change: leave dates untouched
 *
 * Explicit startedAt/completedAt values always win (for manual edits).
 */
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
		startedAt: Date | null;
		completedAt: Date | null;
	}>
) {
	const { startedAt: explicitStarted, completedAt: explicitCompleted, ...rest } = fields;

	// Build the set payload starting from non-date fields
	const setFields: Record<string, unknown> = { ...rest };

	// Explicit date values always win
	if (explicitStarted !== undefined) setFields.startedAt = explicitStarted;
	if (explicitCompleted !== undefined) setFields.completedAt = explicitCompleted;

	// Auto-manage dates on status transitions (only for fields not explicitly provided)
	if (
		fields.status !== undefined &&
		explicitStarted === undefined &&
		explicitCompleted === undefined
	) {
		if (fields.status === 'in_progress') {
			// Preserve existing startedAt — only set if null
			const existing = await db.query.mediaItem.findFirst({
				columns: { startedAt: true },
				where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId))
			});
			if (!existing?.startedAt) setFields.startedAt = new Date();
		} else if (fields.status === 'completed') {
			const existing = await db.query.mediaItem.findFirst({
				columns: { startedAt: true, completedAt: true },
				where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId))
			});
			if (!existing?.startedAt) setFields.startedAt = new Date();
			if (!existing?.completedAt) setFields.completedAt = new Date();
		} else {
			setFields.startedAt = null;
			setFields.completedAt = null;
		}
	}

	const [updated] = await db
		.update(mediaItem)
		.set(setFields)
		.where(and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId)))
		.returning();

	return updated;
}

/** Update type-specific metadata (upsert). Verifies item ownership first. */
export async function updateMediaItemMeta<T extends MediaType>(
	itemId: string,
	userId: string,
	type: T,
	meta: Partial<MetaFieldsFor<T>>
) {
	if (Object.keys(meta).length === 0) return;

	// Verify ownership before touching metadata
	const item = await db.query.mediaItem.findFirst({
		where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, userId)),
		columns: { id: true }
	});
	if (!item) return;

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

// ---------------------------------------------------------------------------
// Discover: seed items + external ID lookups
// ---------------------------------------------------------------------------

/** Seed item shape for "because you liked X" recommendations */
export type SeedItem = {
	mediaItemId: string;
	title: string;
	externalId: string;
	genre: string | null;
};

/**
 * Get recent items for a user+type that have a non-null external ID.
 * Used to seed "similar to" recommendations. Returns up to `limit` items
 * ordered by most recently created. Excludes items the user has muted via
 * the `excluded_seed` table.
 *
 * For books, `externalId` is the title (lowercased) since books lack a
 * reliable single external ID. For all others it's the type-specific ID.
 */
export async function getSeedItems(
	userId: string,
	type: MediaType,
	limit = 3
): Promise<SeedItem[]> {
	switch (type) {
		case 'movie': {
			const rows = await db
				.select({
					mediaItemId: mediaItem.id,
					title: mediaItem.title,
					externalId: sql<string>`CAST(${movieMeta.tmdbId} AS text)`,
					genre: movieMeta.genre
				})
				.from(mediaItem)
				.innerJoin(movieMeta, eq(movieMeta.mediaItemId, mediaItem.id))
				.leftJoin(
					excludedSeed,
					and(eq(excludedSeed.mediaItemId, mediaItem.id), eq(excludedSeed.userId, userId))
				)
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'movie'),
						isNotNull(movieMeta.tmdbId),
						isNull(excludedSeed.id)
					)
				)
				.orderBy(desc(mediaItem.createdAt))
				.limit(limit);
			return rows;
		}
		case 'series': {
			const rows = await db
				.select({
					mediaItemId: mediaItem.id,
					title: mediaItem.title,
					externalId: sql<string>`CAST(${seriesMeta.tmdbId} AS text)`,
					genre: seriesMeta.genre
				})
				.from(mediaItem)
				.innerJoin(seriesMeta, eq(seriesMeta.mediaItemId, mediaItem.id))
				.leftJoin(
					excludedSeed,
					and(eq(excludedSeed.mediaItemId, mediaItem.id), eq(excludedSeed.userId, userId))
				)
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'series'),
						isNotNull(seriesMeta.tmdbId),
						isNull(excludedSeed.id)
					)
				)
				.orderBy(desc(mediaItem.createdAt))
				.limit(limit);
			return rows;
		}
		case 'game': {
			const rows = await db
				.select({
					mediaItemId: mediaItem.id,
					title: mediaItem.title,
					externalId: sql<string>`CAST(${gameMeta.igdbId} AS text)`,
					genre: gameMeta.genre
				})
				.from(mediaItem)
				.innerJoin(gameMeta, eq(gameMeta.mediaItemId, mediaItem.id))
				.leftJoin(
					excludedSeed,
					and(eq(excludedSeed.mediaItemId, mediaItem.id), eq(excludedSeed.userId, userId))
				)
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'game'),
						isNotNull(gameMeta.igdbId),
						isNull(excludedSeed.id)
					)
				)
				.orderBy(desc(mediaItem.createdAt))
				.limit(limit);
			return rows;
		}
		case 'book': {
			// Books use genre for subject-based similar lookups.
			// Genre may be null for books added from trending — caller handles fallback.
			const rows = await db
				.select({
					mediaItemId: mediaItem.id,
					title: mediaItem.title,
					externalId: mediaItem.title,
					genre: bookMeta.genre
				})
				.from(mediaItem)
				.innerJoin(bookMeta, eq(bookMeta.mediaItemId, mediaItem.id))
				.leftJoin(
					excludedSeed,
					and(eq(excludedSeed.mediaItemId, mediaItem.id), eq(excludedSeed.userId, userId))
				)
				.where(
					and(eq(mediaItem.userId, userId), eq(mediaItem.type, 'book'), isNull(excludedSeed.id))
				)
				.orderBy(desc(mediaItem.createdAt))
				.limit(limit);
			return rows;
		}
		case 'podcast':
			// No similar API for podcasts
			return [];
	}
}

// ---------------------------------------------------------------------------
// Excluded seeds
// ---------------------------------------------------------------------------

/** Exclude a seed item from driving recommendations */
export async function addExcludedSeed(userId: string, mediaItemId: string): Promise<void> {
	await db.insert(excludedSeed).values({ userId, mediaItemId }).onConflictDoNothing();
}

/** Restore an excluded seed so it can drive recommendations again */
export async function removeExcludedSeed(userId: string, mediaItemId: string): Promise<void> {
	await db
		.delete(excludedSeed)
		.where(and(eq(excludedSeed.userId, userId), eq(excludedSeed.mediaItemId, mediaItemId)));
}

/** Get all excluded seeds for a user (for the manage UI) */
export async function getExcludedSeeds(userId: string) {
	return db
		.select({
			mediaItemId: excludedSeed.mediaItemId,
			title: mediaItem.title,
			type: mediaItem.type,
			coverUrl: mediaItem.coverUrl,
			excludedAt: excludedSeed.createdAt
		})
		.from(excludedSeed)
		.innerJoin(mediaItem, eq(mediaItem.id, excludedSeed.mediaItemId))
		.where(eq(excludedSeed.userId, userId))
		.orderBy(desc(excludedSeed.createdAt));
}

/**
 * Get the set of external IDs already tracked by a user for a given type.
 * Used to filter out already-tracked items from discover results.
 * For books, returns lowercased titles instead.
 */
export async function getUserExternalIds(userId: string, type: MediaType): Promise<Set<string>> {
	switch (type) {
		case 'movie': {
			const rows = await db
				.select({ id: sql<string>`CAST(${movieMeta.tmdbId} AS text)` })
				.from(mediaItem)
				.innerJoin(movieMeta, eq(movieMeta.mediaItemId, mediaItem.id))
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'movie'),
						isNotNull(movieMeta.tmdbId)
					)
				);
			return new Set(rows.map((r) => r.id));
		}
		case 'series': {
			const rows = await db
				.select({ id: sql<string>`CAST(${seriesMeta.tmdbId} AS text)` })
				.from(mediaItem)
				.innerJoin(seriesMeta, eq(seriesMeta.mediaItemId, mediaItem.id))
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'series'),
						isNotNull(seriesMeta.tmdbId)
					)
				);
			return new Set(rows.map((r) => r.id));
		}
		case 'game': {
			const rows = await db
				.select({ id: sql<string>`CAST(${gameMeta.igdbId} AS text)` })
				.from(mediaItem)
				.innerJoin(gameMeta, eq(gameMeta.mediaItemId, mediaItem.id))
				.where(
					and(eq(mediaItem.userId, userId), eq(mediaItem.type, 'game'), isNotNull(gameMeta.igdbId))
				);
			return new Set(rows.map((r) => r.id));
		}
		case 'podcast': {
			const rows = await db
				.select({ id: podcastMeta.applePodcastId })
				.from(mediaItem)
				.innerJoin(podcastMeta, eq(podcastMeta.mediaItemId, mediaItem.id))
				.where(
					and(
						eq(mediaItem.userId, userId),
						eq(mediaItem.type, 'podcast'),
						isNotNull(podcastMeta.applePodcastId)
					)
				);
			return new Set(rows.filter((r) => r.id !== null).map((r) => r.id as string));
		}
		case 'book': {
			// Match on lowercased title for books
			const rows = await db
				.select({ title: sql<string>`LOWER(${mediaItem.title})` })
				.from(mediaItem)
				.where(and(eq(mediaItem.userId, userId), eq(mediaItem.type, 'book')));
			return new Set(rows.map((r) => r.title));
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

/** Batch update sortOrder for multiple items (used after drag-and-drop).
 *
 * Only sets date fields when the item's status actually changes — preserves
 * existing startedAt/completedAt when re-sorting within the same column.
 */
export async function reorderMediaItems(
	userId: string,
	updates: Array<{ id: string; status: MediaStatus; sortOrder: number }>
) {
	await db.transaction(async (tx) => {
		// Fetch current statuses/dates in one query
		const ids = updates.map((u) => u.id);
		const existing = await tx.query.mediaItem.findMany({
			columns: { id: true, status: true, startedAt: true, completedAt: true },
			where: and(inArray(mediaItem.id, ids), eq(mediaItem.userId, userId))
		});
		const byId = new Map(existing.map((e) => [e.id, e]));

		for (const { id, status, sortOrder } of updates) {
			const prev = byId.get(id);
			const statusChanged = prev?.status !== status;

			const setFields: Record<string, unknown> = { status, sortOrder };

			if (statusChanged) {
				if (status === 'in_progress') {
					if (!prev?.startedAt) setFields.startedAt = new Date();
				} else if (status === 'completed') {
					if (!prev?.startedAt) setFields.startedAt = new Date();
					if (!prev?.completedAt) setFields.completedAt = new Date();
				} else {
					setFields.startedAt = null;
					setFields.completedAt = null;
				}
			}

			await tx
				.update(mediaItem)
				.set(setFields)
				.where(and(eq(mediaItem.id, id), eq(mediaItem.userId, userId)));
		}
	});
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export type MediaNoteRow = typeof mediaNote.$inferSelect;

/** Verify a media item belongs to a user. Returns the item id or null. */
async function verifyItemOwnership(mediaItemId: string, userId: string): Promise<string | null> {
	const item = await db.query.mediaItem.findFirst({
		where: and(eq(mediaItem.id, mediaItemId), eq(mediaItem.userId, userId)),
		columns: { id: true }
	});
	return item?.id ?? null;
}

/** Get all notes for a media item, newest first. Verifies item ownership. */
export async function getNotesByItem(mediaItemId: string, userId: string): Promise<MediaNoteRow[]> {
	const itemId = await verifyItemOwnership(mediaItemId, userId);
	if (!itemId) return [];

	return db.query.mediaNote.findMany({
		where: eq(mediaNote.mediaItemId, mediaItemId),
		orderBy: [desc(mediaNote.createdAt)]
	});
}

/** Add a note to a media item. Verifies item ownership. Returns null if item not owned. */
export async function createNote(
	mediaItemId: string,
	userId: string,
	content: string
): Promise<MediaNoteRow | null> {
	const itemId = await verifyItemOwnership(mediaItemId, userId);
	if (!itemId) return null;

	const [note] = await db.insert(mediaNote).values({ mediaItemId, content }).returning();
	return note;
}

/** Delete a note by id. Verifies item ownership via the note's mediaItem. */
export async function deleteNoteById(noteId: string, userId: string): Promise<boolean> {
	// Look up the note to get its mediaItemId, then verify ownership
	const note = await db.query.mediaNote.findFirst({
		where: eq(mediaNote.id, noteId),
		columns: { id: true, mediaItemId: true }
	});
	if (!note) return false;

	const itemId = await verifyItemOwnership(note.mediaItemId, userId);
	if (!itemId) return false;

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

/** All usernames with public profiles, for sitemap generation. */
export async function getAllPublicUsernames(): Promise<string[]> {
	const rows = await db.query.user.findMany({
		where: and(isNotNull(user.username), eq(user.profilePublic, true)),
		columns: { username: true }
	});
	return rows.flatMap((r) => (r.username ? [r.username] : []));
}

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
			freeAccess: true,
			trialEndsAt: true,
			deletedAt: true
		}
	});
}

/** Set user subscription status (called from Polar webhooks) */
export async function setUserSubscribed(userId: string, subscribed: boolean) {
	await db.update(user).set({ subscribed }).where(eq(user.id, userId));
}

/** TRIAL_DURATION_DAYS — number of days for the free trial */
const TRIAL_DURATION_DAYS = 14;

/** Start the free trial for a user (idempotent — skips if trial already set) */
export async function setTrialStarted(userId: string) {
	const trialEndsAt = new Date();
	trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);
	await db
		.update(user)
		.set({ trialEndsAt })
		.where(and(eq(user.id, userId), isNull(user.trialEndsAt)));
}

/** Soft-delete a user (sets deletedAt, preserves data) */
export async function softDeleteUser(userId: string) {
	await db.update(user).set({ deletedAt: new Date() }).where(eq(user.id, userId));
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
		currentSeason: number | null;
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
					coverUrl: mediaItem.coverUrl,
					currentSeason: seriesMeta.currentSeason
				})
				.from(mediaItem)
				.leftJoin(seriesMeta, eq(seriesMeta.mediaItemId, mediaItem.id))
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
				UNION ALL
				SELECT ${podcastMeta.genre}, ${mediaItem.type} FROM ${podcastMeta}
					JOIN ${mediaItem} ON ${mediaItem.id} = ${podcastMeta.mediaItemId}
					WHERE ${mediaItem.userId} = ${userId} AND ${podcastMeta.genre} IS NOT NULL
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

// ---------------------------------------------------------------------------
// Currently consuming (in_progress items for dashboard widget)
// ---------------------------------------------------------------------------

export type InProgressItem = {
	id: string;
	title: string;
	type: MediaType;
	coverUrl: string | null;
	subtitle: string | null;
	updatedAt: Date;
};

/** Get items with status "in_progress" across all types, with a subtitle */
export async function getInProgressItems(userId: string, limit = 10): Promise<InProgressItem[]> {
	const rows = await db
		.select({
			id: mediaItem.id,
			title: mediaItem.title,
			type: mediaItem.type,
			coverUrl: mediaItem.coverUrl,
			updatedAt: mediaItem.updatedAt,
			author: bookMeta.author,
			director: movieMeta.director,
			currentSeason: seriesMeta.currentSeason,
			totalSeasons: seriesMeta.totalSeasons,
			developer: gameMeta.developer,
			host: podcastMeta.host
		})
		.from(mediaItem)
		.leftJoin(bookMeta, eq(bookMeta.mediaItemId, mediaItem.id))
		.leftJoin(movieMeta, eq(movieMeta.mediaItemId, mediaItem.id))
		.leftJoin(seriesMeta, eq(seriesMeta.mediaItemId, mediaItem.id))
		.leftJoin(gameMeta, eq(gameMeta.mediaItemId, mediaItem.id))
		.leftJoin(podcastMeta, eq(podcastMeta.mediaItemId, mediaItem.id))
		.where(and(eq(mediaItem.userId, userId), eq(mediaItem.status, 'in_progress')))
		.orderBy(desc(mediaItem.updatedAt))
		.limit(limit);

	return rows.map((r) => {
		let subtitle: string | null = null;
		switch (r.type) {
			case 'book':
				subtitle = r.author;
				break;
			case 'movie':
				subtitle = r.director;
				break;
			case 'series':
				subtitle =
					r.currentSeason != null && r.totalSeasons != null
						? `S${r.currentSeason}/${r.totalSeasons}`
						: r.currentSeason != null
							? `Season ${r.currentSeason}`
							: null;
				break;
			case 'game':
				subtitle = r.developer;
				break;
			case 'podcast':
				subtitle = r.host;
				break;
		}
		return {
			id: r.id,
			title: r.title,
			type: r.type,
			coverUrl: r.coverUrl,
			subtitle,
			updatedAt: r.updatedAt
		};
	});
}

// ---------------------------------------------------------------------------
// Sidebar counts
// ---------------------------------------------------------------------------

/** Item counts per media type for sidebar badges */
export async function getItemCountsByType(
	userId: string
): Promise<Partial<Record<MediaType, number>>> {
	const rows = await db
		.select({ type: mediaItem.type, count: count() })
		.from(mediaItem)
		.where(eq(mediaItem.userId, userId))
		.groupBy(mediaItem.type);
	const result: Partial<Record<MediaType, number>> = {};
	for (const row of rows) {
		result[row.type] = Number(row.count);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Yearly Wrapped
// ---------------------------------------------------------------------------

export type WrappedStats = {
	year: number;
	totalCompleted: number;
	completedByType: Record<MediaType, number>;
	topGenre: { genre: string; count: number } | null;
	highestRated: { title: string; type: MediaType; rating: number; coverUrl: string | null } | null;
	fastestCompletion: {
		title: string;
		type: MediaType;
		days: number;
		coverUrl: string | null;
	} | null;
	mostActiveMonth: { month: string; count: number } | null;
	firstCompleted: { title: string; type: MediaType; date: Date; coverUrl: string | null } | null;
	lastCompleted: { title: string; type: MediaType; date: Date; coverUrl: string | null } | null;
	totalEstimatedHours: number;
	averageRating: number | null;
};

/** Compute yearly wrapped stats for items completed in the given year */
export async function getWrappedStats(userId: string, year: number): Promise<WrappedStats> {
	const yearStart = new Date(year, 0, 1);
	const yearEnd = new Date(year + 1, 0, 1);

	// All items completed this year
	const completedItems = await db
		.select({
			id: mediaItem.id,
			title: mediaItem.title,
			type: mediaItem.type,
			rating: mediaItem.rating,
			coverUrl: mediaItem.coverUrl,
			completedAt: mediaItem.completedAt,
			startedAt: mediaItem.startedAt,
			createdAt: mediaItem.createdAt
		})
		.from(mediaItem)
		.where(
			and(
				eq(mediaItem.userId, userId),
				eq(mediaItem.status, 'completed'),
				isNotNull(mediaItem.completedAt),
				gte(mediaItem.completedAt, yearStart),
				lt(mediaItem.completedAt, yearEnd)
			)
		)
		.orderBy(asc(mediaItem.completedAt));

	const totalCompleted = completedItems.length;

	// Completed by type
	const completedByType: Record<MediaType, number> = {
		book: 0,
		movie: 0,
		series: 0,
		game: 0,
		podcast: 0
	};
	for (const item of completedItems) {
		completedByType[item.type]++;
	}

	// Top genre — union across meta tables for completed items
	const completedIds = completedItems.map((i) => i.id);
	let topGenre: WrappedStats['topGenre'] = null;
	if (completedIds.length > 0) {
		const genreRows = await db
			.select({
				genre: sql<string>`genre`,
				count: count()
			})
			.from(
				sql`(
					SELECT ${bookMeta.genre} AS genre FROM ${bookMeta} WHERE ${bookMeta.mediaItemId} IN (${sql.join(
						completedIds.map((id) => sql`${id}`),
						sql`, `
					)}) AND ${bookMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${movieMeta.genre} AS genre FROM ${movieMeta} WHERE ${movieMeta.mediaItemId} IN (${sql.join(
						completedIds.map((id) => sql`${id}`),
						sql`, `
					)}) AND ${movieMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${seriesMeta.genre} AS genre FROM ${seriesMeta} WHERE ${seriesMeta.mediaItemId} IN (${sql.join(
						completedIds.map((id) => sql`${id}`),
						sql`, `
					)}) AND ${seriesMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${gameMeta.genre} AS genre FROM ${gameMeta} WHERE ${gameMeta.mediaItemId} IN (${sql.join(
						completedIds.map((id) => sql`${id}`),
						sql`, `
					)}) AND ${gameMeta.genre} IS NOT NULL
					UNION ALL
					SELECT ${podcastMeta.genre} AS genre FROM ${podcastMeta} WHERE ${podcastMeta.mediaItemId} IN (${sql.join(
						completedIds.map((id) => sql`${id}`),
						sql`, `
					)}) AND ${podcastMeta.genre} IS NOT NULL
				) AS genres`
			)
			.groupBy(sql`genre`)
			.orderBy(desc(count()))
			.limit(1);
		if (genreRows.length > 0) {
			topGenre = { genre: genreRows[0].genre, count: Number(genreRows[0].count) };
		}
	}

	// Highest rated
	const rated = completedItems
		.filter((i) => i.rating != null && i.rating > 0)
		.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
	const highestRated: WrappedStats['highestRated'] =
		rated.length > 0
			? {
					title: rated[0].title,
					type: rated[0].type,
					rating: rated[0].rating ?? 0,
					coverUrl: rated[0].coverUrl
				}
			: null;

	// Average rating
	const ratedItems = completedItems.filter((i) => i.rating != null && i.rating > 0);
	const averageRating =
		ratedItems.length > 0
			? Math.round(
					(ratedItems.reduce((sum, i) => sum + (i.rating ?? 0), 0) / ratedItems.length) * 10
				) / 10
			: null;

	// Fastest completion (smallest completedAt - startedAt gap)
	let fastestCompletion: WrappedStats['fastestCompletion'] = null;
	for (const item of completedItems) {
		if (!item.startedAt || !item.completedAt) continue;
		const days = Math.max(
			0,
			Math.round((item.completedAt.getTime() - item.startedAt.getTime()) / (1000 * 60 * 60 * 24))
		);
		if (!fastestCompletion || days < fastestCompletion.days) {
			fastestCompletion = {
				title: item.title,
				type: item.type,
				days,
				coverUrl: item.coverUrl
			};
		}
	}

	// Most active month
	const monthCounts = new Map<string, number>();
	for (const item of completedItems) {
		if (!item.completedAt) continue;
		const key = `${item.completedAt.getFullYear()}-${String(item.completedAt.getMonth() + 1).padStart(2, '0')}`;
		monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
	}
	let mostActiveMonth: WrappedStats['mostActiveMonth'] = null;
	for (const [month, count] of monthCounts) {
		if (!mostActiveMonth || count > mostActiveMonth.count) {
			mostActiveMonth = { month, count };
		}
	}

	// First and last completed
	const firstCompleted: WrappedStats['firstCompleted'] =
		completedItems.length > 0
			? {
					title: completedItems[0].title,
					type: completedItems[0].type,
					date: completedItems[0].completedAt!,
					coverUrl: completedItems[0].coverUrl
				}
			: null;
	const lastItem = completedItems[completedItems.length - 1];
	const lastCompleted: WrappedStats['lastCompleted'] = lastItem
		? {
				title: lastItem.title,
				type: lastItem.type,
				date: lastItem.completedAt!,
				coverUrl: lastItem.coverUrl
			}
		: null;

	// Estimated hours: movie runtime + game playtime + book pages/40
	let totalEstimatedHours = 0;
	if (completedIds.length > 0) {
		const [movieHours] = await db
			.select({ total: sql<number>`COALESCE(SUM(${movieMeta.runtime}), 0)` })
			.from(movieMeta)
			.where(inArray(movieMeta.mediaItemId, completedIds));
		totalEstimatedHours += Math.round(Number(movieHours?.total ?? 0) / 60);

		const [gameHours] = await db
			.select({ total: sql<number>`COALESCE(SUM(${gameMeta.playtimeMinutes}), 0)` })
			.from(gameMeta)
			.where(inArray(gameMeta.mediaItemId, completedIds));
		totalEstimatedHours += Math.round(Number(gameHours?.total ?? 0) / 60);

		const [bookPages] = await db
			.select({ total: sql<number>`COALESCE(SUM(${bookMeta.pageCount}), 0)` })
			.from(bookMeta)
			.where(inArray(bookMeta.mediaItemId, completedIds));
		// ~40 pages per hour reading speed
		totalEstimatedHours += Math.round(Number(bookPages?.total ?? 0) / 40);
	}

	return {
		year,
		totalCompleted,
		completedByType,
		topGenre,
		highestRated,
		fastestCompletion,
		mostActiveMonth,
		firstCompleted,
		lastCompleted,
		totalEstimatedHours,
		averageRating
	};
}
