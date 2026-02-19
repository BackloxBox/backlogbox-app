import { count, sql, eq, gte, isNull, desc } from 'drizzle-orm';
import { db } from './index';
import { user } from './auth.schema';
import { mediaItem, customList } from './schema';
import type { MediaType } from '$lib/types';
import { MEDIA_TYPES } from '$lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminStats = {
	/** Scalar metrics */
	totalUsers: number;
	activeUsers7d: number;
	activeUsers30d: number;
	totalItems: number;
	avgItemsPerUser: number;
	usersWithZeroItems: number;
	totalCustomLists: number;

	/** User status breakdown */
	userStatusBreakdown: Array<{ status: string; count: number }>;

	/** Conversion funnel */
	trialCount: number;
	subscribedCount: number;
	freeAccessCount: number;
	expiredCount: number;
	conversionRate: number;

	/** Time series */
	signupsByDay: Array<{ date: string; count: number }>;
	itemsByDay: Array<{ date: string } & Record<MediaType, number>>;

	/** Breakdowns */
	itemsByType: Array<{ type: MediaType; count: number }>;

	/** Top users table */
	topUsers: Array<{
		username: string | null;
		name: string;
		email: string;
		itemCount: number;
		lastActive: string | null;
		status: string;
	}>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	d.setHours(0, 0, 0, 0);
	return d;
}

function userStatus(row: {
	subscribed: boolean;
	freeAccess: boolean;
	trialEndsAt: Date | null;
	deletedAt: Date | null;
}): string {
	if (row.deletedAt) return 'deleted';
	if (row.subscribed) return 'subscribed';
	if (row.freeAccess) return 'free_access';
	if (row.trialEndsAt && row.trialEndsAt > new Date()) return 'trial';
	if (row.trialEndsAt) return 'expired';
	return 'no_trial';
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
	const [
		usersRaw,
		totalItemsRow,
		itemsByTypeRows,
		signupRows,
		itemDayRows,
		activeUsers7dRow,
		activeUsers30dRow,
		usersWithItemsRow,
		totalCustomListsRow,
		topUserRows
	] = await Promise.all([
		// All users (non-deleted) with status fields
		db
			.select({
				id: user.id,
				subscribed: user.subscribed,
				freeAccess: user.freeAccess,
				trialEndsAt: user.trialEndsAt,
				deletedAt: user.deletedAt
			})
			.from(user)
			.where(isNull(user.deletedAt)),

		// Total items
		db.select({ count: count() }).from(mediaItem),

		// Items by type
		db.select({ type: mediaItem.type, count: count() }).from(mediaItem).groupBy(mediaItem.type),

		// Signups by day (all time — filter client-side)
		db
			.select({
				date: sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD')`,
				count: count()
			})
			.from(user)
			.where(isNull(user.deletedAt))
			.groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`)
			.orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`),

		// Items added by day + type (all time — filter client-side)
		db
			.select({
				date: sql<string>`to_char(${mediaItem.createdAt}, 'YYYY-MM-DD')`,
				type: mediaItem.type,
				count: count()
			})
			.from(mediaItem)
			.groupBy(sql`to_char(${mediaItem.createdAt}, 'YYYY-MM-DD')`, mediaItem.type)
			.orderBy(sql`to_char(${mediaItem.createdAt}, 'YYYY-MM-DD')`),

		// Active users 7d (distinct users who created or updated an item)
		db
			.select({ count: sql<number>`count(distinct ${mediaItem.userId})` })
			.from(mediaItem)
			.where(gte(mediaItem.updatedAt, daysAgo(7))),

		// Active users 30d
		db
			.select({ count: sql<number>`count(distinct ${mediaItem.userId})` })
			.from(mediaItem)
			.where(gte(mediaItem.updatedAt, daysAgo(30))),

		// Users with at least one item (for "zero items" calc)
		db.select({ count: sql<number>`count(distinct ${mediaItem.userId})` }).from(mediaItem),

		// Total custom lists
		db.select({ count: count() }).from(customList),

		// Top 10 users by item count
		db
			.select({
				username: user.username,
				name: user.name,
				email: user.email,
				itemCount: count(),
				lastActive: sql<string>`to_char(max(${mediaItem.updatedAt}), 'YYYY-MM-DD')`,
				subscribed: user.subscribed,
				freeAccess: user.freeAccess,
				trialEndsAt: user.trialEndsAt,
				deletedAt: user.deletedAt
			})
			.from(user)
			.leftJoin(mediaItem, eq(mediaItem.userId, user.id))
			.where(isNull(user.deletedAt))
			.groupBy(user.id)
			.orderBy(desc(count()))
			.limit(10)
	]);

	// Compute user status breakdown
	const statusMap = new Map<string, number>();
	for (const u of usersRaw) {
		const s = userStatus(u);
		statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
	}
	const userStatusBreakdown = [...statusMap.entries()].map(([status, count]) => ({
		status,
		count
	}));

	const totalUsers = usersRaw.length;
	const subscribedCount = statusMap.get('subscribed') ?? 0;
	const freeAccessCount = statusMap.get('free_access') ?? 0;
	const trialCount = statusMap.get('trial') ?? 0;
	const expiredCount = statusMap.get('expired') ?? 0;
	const convertible = subscribedCount + expiredCount;
	const conversionRate = convertible > 0 ? subscribedCount / convertible : 0;

	const totalItems = Number(totalItemsRow[0].count);
	const usersWithItems = Number(usersWithItemsRow[0].count);

	// Pivot itemDayRows into { date, book, movie, series, game, podcast }
	const dayMap = new Map<string, Record<MediaType, number>>();
	for (const row of itemDayRows) {
		let entry = dayMap.get(row.date);
		if (!entry) {
			entry = Object.fromEntries(MEDIA_TYPES.map((t) => [t, 0])) as Record<MediaType, number>;
			dayMap.set(row.date, entry);
		}
		entry[row.type] = Number(row.count);
	}
	const itemsByDay = [...dayMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, counts]) => ({ date, ...counts }));

	return {
		totalUsers,
		activeUsers7d: Number(activeUsers7dRow[0].count),
		activeUsers30d: Number(activeUsers30dRow[0].count),
		totalItems,
		avgItemsPerUser: totalUsers > 0 ? Math.round((totalItems / totalUsers) * 10) / 10 : 0,
		usersWithZeroItems: totalUsers - usersWithItems,
		totalCustomLists: Number(totalCustomListsRow[0].count),

		userStatusBreakdown,
		trialCount,
		subscribedCount,
		freeAccessCount,
		expiredCount,
		conversionRate,

		signupsByDay: signupRows.map((r) => ({ date: r.date, count: Number(r.count) })),
		itemsByDay,
		itemsByType: itemsByTypeRows.map((r) => ({ type: r.type, count: Number(r.count) })),

		topUsers: topUserRows.map((r) => ({
			username: r.username,
			name: r.name,
			email: r.email,
			itemCount: Number(r.itemCount),
			lastActive: r.lastActive,
			status: userStatus({
				subscribed: r.subscribed,
				freeAccess: r.freeAccess,
				trialEndsAt: r.trialEndsAt,
				deletedAt: r.deletedAt
			})
		}))
	};
}
