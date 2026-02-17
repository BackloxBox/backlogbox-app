import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import { db } from './index';
import { customList, customListField, customListItem, customListItemFieldValue } from './schema';
import { MAX_CUSTOM_FIELDS, MAX_CUSTOM_LISTS, type CustomListStatus } from '$lib/types';

// ---------------------------------------------------------------------------
// Types — derived from Drizzle schema
// ---------------------------------------------------------------------------

export type CustomListRow = typeof customList.$inferSelect;
export type CustomListItemWithFields = Awaited<ReturnType<typeof getItemsByList>>[number];
export type CustomListFieldRow = typeof customListField.$inferSelect;
export type CustomListItemRow = typeof customListItem.$inferSelect;
export type CustomListFieldValueRow = typeof customListItemFieldValue.$inferSelect;

/** Sidebar-friendly list summary (no items loaded) */
export type CustomListSummary = Pick<
	CustomListRow,
	'id' | 'name' | 'slug' | 'icon' | 'isPublic' | 'createdAt'
>;

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

/** Convert name to URL-safe slug: lowercase, replace non-alphanum with hyphens, collapse */
function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 64) || 'list'
	);
}

/**
 * Generate unique slug for a user. Appends -2, -3, etc. on collision.
 * Uses LIKE query to find existing slugs with the same base.
 */
async function generateUniqueSlug(userId: string, name: string): Promise<string> {
	const base = slugify(name);

	const existing = await db
		.select({ slug: customList.slug })
		.from(customList)
		.where(and(eq(customList.userId, userId), like(customList.slug, `${base}%`)));

	const taken = new Set(existing.map((r) => r.slug));
	if (!taken.has(base)) return base;

	for (let i = 2; i <= 100; i++) {
		const candidate = `${base}-${i}`;
		if (!taken.has(candidate)) return candidate;
	}

	// Extremely unlikely fallback
	return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// List CRUD
// ---------------------------------------------------------------------------

/** Get all custom lists for a user, ordered by creation date */
export async function getCustomListsByUser(userId: string): Promise<CustomListSummary[]> {
	return db.query.customList.findMany({
		where: eq(customList.userId, userId),
		orderBy: [asc(customList.createdAt)],
		columns: { id: true, name: true, slug: true, icon: true, isPublic: true, createdAt: true }
	});
}

/** Get a single list by user + slug, including fields */
export async function getCustomListBySlug(userId: string, slug: string) {
	return db.query.customList.findFirst({
		where: and(eq(customList.userId, userId), eq(customList.slug, slug)),
		with: { fields: { orderBy: [asc(customListField.sortOrder)] } }
	});
}

/** Get a single list by id (for ownership checks) */
export async function getCustomListById(listId: string) {
	return db.query.customList.findFirst({
		where: eq(customList.id, listId),
		columns: { id: true, userId: true, name: true, slug: true, icon: true, isPublic: true }
	});
}

/** Get public list by owner id + slug (for public profiles) */
export async function getPublicCustomListBySlug(ownerUserId: string, slug: string) {
	return db.query.customList.findFirst({
		where: and(
			eq(customList.userId, ownerUserId),
			eq(customList.slug, slug),
			eq(customList.isPublic, true)
		),
		with: { fields: { orderBy: [asc(customListField.sortOrder)] } }
	});
}

/** Get all public lists for a user (for public profile sidebar) */
export async function getPublicCustomListsByUser(userId: string): Promise<CustomListSummary[]> {
	return db.query.customList.findMany({
		where: and(eq(customList.userId, userId), eq(customList.isPublic, true)),
		orderBy: [asc(customList.createdAt)],
		columns: { id: true, name: true, slug: true, icon: true, isPublic: true, createdAt: true }
	});
}

/** Count how many custom lists a user has */
async function countUserLists(userId: string): Promise<number> {
	const [row] = await db
		.select({ c: count() })
		.from(customList)
		.where(eq(customList.userId, userId));
	return row?.c ?? 0;
}

/** Create a new custom list. Throws if user has reached MAX_CUSTOM_LISTS. */
export async function createCustomList(
	userId: string,
	data: { name: string; icon?: string | null }
): Promise<CustomListRow> {
	const existing = await countUserLists(userId);
	if (existing >= MAX_CUSTOM_LISTS) {
		throw new Error(`Maximum of ${MAX_CUSTOM_LISTS} custom lists reached`);
	}

	const slug = await generateUniqueSlug(userId, data.name);

	const [list] = await db
		.insert(customList)
		.values({
			userId,
			name: data.name,
			slug,
			icon: data.icon ?? null
		})
		.returning();

	if (!list) throw new Error('Insert failed: no row returned');
	return list;
}

/** Update a custom list's name, icon, or visibility. Regenerates slug on rename. */
export async function updateCustomList(
	listId: string,
	userId: string,
	fields: Partial<{ name: string; icon: string | null; isPublic: boolean }>
): Promise<CustomListRow | undefined> {
	const setFields: Record<string, unknown> = {};

	if (fields.name !== undefined) {
		setFields.name = fields.name;
		setFields.slug = await generateUniqueSlug(userId, fields.name);
	}
	if (fields.icon !== undefined) setFields.icon = fields.icon;
	if (fields.isPublic !== undefined) setFields.isPublic = fields.isPublic;

	if (Object.keys(setFields).length === 0) return undefined;

	const [updated] = await db
		.update(customList)
		.set(setFields)
		.where(and(eq(customList.id, listId), eq(customList.userId, userId)))
		.returning();

	return updated;
}

/** Delete a custom list (cascades to fields, items, field values) */
export async function deleteCustomList(
	listId: string,
	userId: string
): Promise<CustomListRow | undefined> {
	const [deleted] = await db
		.delete(customList)
		.where(and(eq(customList.id, listId), eq(customList.userId, userId)))
		.returning();

	return deleted;
}

// ---------------------------------------------------------------------------
// Item CRUD
// ---------------------------------------------------------------------------

/** Fetch all items for a list, with field values, ordered by sortOrder */
export async function getItemsByList(listId: string) {
	return db.query.customListItem.findMany({
		where: eq(customListItem.listId, listId),
		orderBy: [asc(customListItem.sortOrder)],
		with: {
			fieldValues: true
		}
	});
}

/** Create a custom list item */
export async function createCustomListItem(
	listId: string,
	data: {
		title: string;
		subtitle?: string | null;
		imageUrl?: string | null;
		status?: CustomListStatus;
		rating?: number | null;
		notes?: string | null;
	}
): Promise<CustomListItemRow> {
	const [item] = await db
		.insert(customListItem)
		.values({
			listId,
			title: data.title,
			subtitle: data.subtitle ?? null,
			imageUrl: data.imageUrl ?? null,
			status: data.status ?? 'planned',
			rating: data.rating ?? null,
			notes: data.notes ?? null,
			sortOrder: 0
		})
		.returning();

	if (!item) throw new Error('Insert failed: no row returned');
	return item;
}

/** Update a custom list item's fields. Auto-manages completedAt. */
export async function updateCustomListItem(
	itemId: string,
	listId: string,
	fields: Partial<{
		title: string;
		subtitle: string | null;
		imageUrl: string | null;
		status: CustomListStatus;
		sortOrder: number;
		rating: number | null;
		notes: string | null;
	}>
): Promise<CustomListItemRow | undefined> {
	// Auto-manage completedAt on status transitions
	const completedAt =
		fields.status === 'completed' ? new Date() : fields.status !== undefined ? null : undefined;
	const setFields = completedAt !== undefined ? { ...fields, completedAt } : fields;

	const [updated] = await db
		.update(customListItem)
		.set(setFields)
		.where(and(eq(customListItem.id, itemId), eq(customListItem.listId, listId)))
		.returning();

	return updated;
}

/** Delete a custom list item */
export async function deleteCustomListItem(
	itemId: string,
	listId: string
): Promise<CustomListItemRow | undefined> {
	const [deleted] = await db
		.delete(customListItem)
		.where(and(eq(customListItem.id, itemId), eq(customListItem.listId, listId)))
		.returning();

	return deleted;
}

/** Batch reorder items (after drag-and-drop) */
export async function reorderCustomListItems(
	listId: string,
	updates: Array<{ id: string; status: CustomListStatus; sortOrder: number }>
) {
	await db.transaction(async (tx) => {
		for (const { id, status, sortOrder } of updates) {
			const completedAt = status === 'completed' ? new Date() : null;
			await tx
				.update(customListItem)
				.set({ status, sortOrder, completedAt })
				.where(and(eq(customListItem.id, id), eq(customListItem.listId, listId)));
		}
	});
}

// ---------------------------------------------------------------------------
// Field CRUD
// ---------------------------------------------------------------------------

/** Get all fields for a list, ordered by sortOrder */
export async function getFieldsByList(listId: string): Promise<CustomListFieldRow[]> {
	return db.query.customListField.findMany({
		where: eq(customListField.listId, listId),
		orderBy: [asc(customListField.sortOrder)]
	});
}

/** Create a custom field. Throws if list has reached MAX_CUSTOM_FIELDS. */
export async function createCustomListField(
	listId: string,
	data: { name: string; fieldType?: 'text' | 'number' | 'url' | 'date' }
): Promise<CustomListFieldRow> {
	const [fieldCount] = await db
		.select({ c: count() })
		.from(customListField)
		.where(eq(customListField.listId, listId));

	if ((fieldCount?.c ?? 0) >= MAX_CUSTOM_FIELDS) {
		throw new Error(`Maximum of ${MAX_CUSTOM_FIELDS} custom fields per list`);
	}

	const [field] = await db
		.insert(customListField)
		.values({
			listId,
			name: data.name,
			fieldType: data.fieldType ?? 'text',
			sortOrder: fieldCount?.c ?? 0
		})
		.returning();

	if (!field) throw new Error('Insert failed: no row returned');
	return field;
}

/** Update a custom field */
export async function updateCustomListField(
	fieldId: string,
	listId: string,
	fields: Partial<{
		name: string;
		fieldType: 'text' | 'number' | 'url' | 'date';
		sortOrder: number;
	}>
): Promise<CustomListFieldRow | undefined> {
	if (Object.keys(fields).length === 0) return undefined;

	const [updated] = await db
		.update(customListField)
		.set(fields)
		.where(and(eq(customListField.id, fieldId), eq(customListField.listId, listId)))
		.returning();

	return updated;
}

/** Delete a custom field (cascades to field values) */
export async function deleteCustomListField(
	fieldId: string,
	listId: string
): Promise<CustomListFieldRow | undefined> {
	const [deleted] = await db
		.delete(customListField)
		.where(and(eq(customListField.id, fieldId), eq(customListField.listId, listId)))
		.returning();

	return deleted;
}

// ---------------------------------------------------------------------------
// Field values
// ---------------------------------------------------------------------------

/** Upsert field values for an item (bulk) */
export async function upsertFieldValues(
	itemId: string,
	values: Array<{ fieldId: string; value: string }>
) {
	if (values.length === 0) return;

	await db.transaction(async (tx) => {
		for (const { fieldId, value } of values) {
			await tx
				.insert(customListItemFieldValue)
				.values({ itemId, fieldId, value })
				.onConflictDoUpdate({
					target: [customListItemFieldValue.itemId, customListItemFieldValue.fieldId],
					set: { value }
				});
		}
	});
}

/** Delete a specific field value */
export async function deleteFieldValue(itemId: string, fieldId: string) {
	await db
		.delete(customListItemFieldValue)
		.where(
			and(
				eq(customListItemFieldValue.itemId, itemId),
				eq(customListItemFieldValue.fieldId, fieldId)
			)
		);
}

// ---------------------------------------------------------------------------
// Dashboard stats for custom lists
// ---------------------------------------------------------------------------

export type CustomListDashboardStats = {
	totalLists: number;
	totalItems: number;
	statusCounts: Array<{ status: CustomListStatus; count: number }>;
	recentItems: Array<{
		title: string;
		listName: string;
		listSlug: string;
		status: CustomListStatus;
		createdAt: Date;
		imageUrl: string | null;
	}>;
};

/** Aggregate custom list statistics for dashboard */
export async function getCustomListDashboardStats(
	userId: string
): Promise<CustomListDashboardStats> {
	const [listCountRows, statusRows, recentRows] = await Promise.all([
		// Total lists
		db.select({ c: count() }).from(customList).where(eq(customList.userId, userId)),

		// Status distribution across all custom list items
		db
			.select({
				status: customListItem.status,
				count: count()
			})
			.from(customListItem)
			.innerJoin(customList, eq(customList.id, customListItem.listId))
			.where(eq(customList.userId, userId))
			.groupBy(customListItem.status),

		// Recent items (last 5)
		db
			.select({
				title: customListItem.title,
				listName: customList.name,
				listSlug: customList.slug,
				status: customListItem.status,
				createdAt: customListItem.createdAt,
				imageUrl: customListItem.imageUrl
			})
			.from(customListItem)
			.innerJoin(customList, eq(customList.id, customListItem.listId))
			.where(eq(customList.userId, userId))
			.orderBy(desc(customListItem.createdAt))
			.limit(5)
	]);

	const totalLists = listCountRows[0]?.c ?? 0;
	let totalItems = 0;
	const statusCounts = statusRows.map((r) => {
		const c = Number(r.count);
		totalItems += c;
		return { status: r.status, count: c };
	});

	return {
		totalLists,
		totalItems,
		statusCounts,
		recentItems: recentRows
	};
}
