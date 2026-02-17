import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, query } from '$app/server';
import { requireSubscription } from '$lib/server/auth-guard';
import { log } from '$lib/server/logger';
import {
	getCustomListBySlug,
	getItemsByList,
	getFieldsByList,
	createCustomListItem,
	updateCustomListItem,
	deleteCustomListItem,
	reorderCustomListItems,
	createCustomListField,
	updateCustomListField,
	deleteCustomListField,
	upsertFieldValues,
	deleteFieldValue
} from '$lib/server/db/custom-list-queries';
import {
	CUSTOM_LIST_STATUSES,
	CUSTOM_FIELD_TYPES,
	MAX_CUSTOM_FIELDS,
	type CustomListStatus
} from '$lib/types';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const customListStatusSchema = v.picklist([...CUSTOM_LIST_STATUSES]);
const customFieldTypeSchema = v.picklist([...CUSTOM_FIELD_TYPES]);

const optStr = v.optional(v.nullable(v.string()));
const optNum = v.optional(v.nullable(v.number()));

// -- Items --

const addItemSchema = v.object({
	slug: v.string(),
	title: v.pipe(v.string(), v.nonEmpty()),
	subtitle: optStr,
	imageUrl: optStr,
	status: v.optional(customListStatusSchema, 'planned' as const),
	rating: optNum,
	notes: optStr
});

const updateItemSchema = v.object({
	slug: v.string(),
	itemId: v.pipe(v.string(), v.nonEmpty()),
	title: v.optional(v.string()),
	subtitle: v.optional(v.nullable(v.string())),
	imageUrl: v.optional(v.nullable(v.string())),
	status: v.optional(customListStatusSchema),
	sortOrder: v.optional(v.number()),
	rating: v.optional(v.nullable(v.number())),
	notes: v.optional(v.nullable(v.string()))
});

const deleteItemSchema = v.object({
	slug: v.string(),
	itemId: v.pipe(v.string(), v.nonEmpty())
});

const reorderSchema = v.object({
	slug: v.string(),
	updates: v.array(
		v.object({
			id: v.pipe(v.string(), v.nonEmpty()),
			status: customListStatusSchema,
			sortOrder: v.number()
		})
	)
});

// -- Fields --

const addFieldSchema = v.object({
	slug: v.string(),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(50)),
	fieldType: v.optional(customFieldTypeSchema, 'text' as const)
});

const updateFieldSchema = v.object({
	slug: v.string(),
	fieldId: v.pipe(v.string(), v.nonEmpty()),
	name: v.optional(v.pipe(v.string(), v.nonEmpty(), v.maxLength(50))),
	fieldType: v.optional(customFieldTypeSchema),
	sortOrder: v.optional(v.number())
});

const deleteFieldSchema = v.object({
	slug: v.string(),
	fieldId: v.pipe(v.string(), v.nonEmpty())
});

// -- Field values --

const upsertFieldValuesSchema = v.object({
	slug: v.string(),
	itemId: v.pipe(v.string(), v.nonEmpty()),
	values: v.array(
		v.object({
			fieldId: v.pipe(v.string(), v.nonEmpty()),
			value: v.string()
		})
	)
});

const deleteFieldValueSchema = v.object({
	slug: v.string(),
	itemId: v.pipe(v.string(), v.nonEmpty()),
	fieldId: v.pipe(v.string(), v.nonEmpty())
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve slug to list, verifying ownership. Returns list id. */
async function resolveList(userId: string, slug: string): Promise<string> {
	const list = await getCustomListBySlug(userId, slug);
	if (!list) error(404, 'List not found');
	return list.id;
}

// ---------------------------------------------------------------------------
// Remote functions — Items
// ---------------------------------------------------------------------------

/** Fetch all items for a list (with field values) */
export const getBoardItems = query(v.string(), async (slug) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, slug);
	return getItemsByList(listId);
});

/** Fetch all custom fields for a list */
export const getListFields = query(v.string(), async (slug) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, slug);
	return getFieldsByList(listId);
});

/** Add an item to the list */
export const addItem = command(addItemSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	return createCustomListItem(listId, {
		title: data.title,
		subtitle: data.subtitle ?? null,
		imageUrl: data.imageUrl ?? null,
		status: data.status ?? 'planned',
		rating: data.rating ?? null,
		notes: data.notes ?? null
	});
});

/** Update an item */
export const updateItem = command(updateItemSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	const fields: Partial<{
		title: string;
		subtitle: string | null;
		imageUrl: string | null;
		status: CustomListStatus;
		sortOrder: number;
		rating: number | null;
		notes: string | null;
	}> = {};
	if (data.title !== undefined) fields.title = data.title;
	if (data.subtitle !== undefined) fields.subtitle = data.subtitle;
	if (data.imageUrl !== undefined) fields.imageUrl = data.imageUrl;
	if (data.status !== undefined) fields.status = data.status;
	if (data.sortOrder !== undefined) fields.sortOrder = data.sortOrder;
	if (data.rating !== undefined) fields.rating = data.rating;
	if (data.notes !== undefined) fields.notes = data.notes;

	const updated = await updateCustomListItem(data.itemId, listId, fields);
	if (!updated) error(404, 'Item not found');
	return updated;
});

/** Delete an item */
export const deleteItem = command(deleteItemSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	const deleted = await deleteCustomListItem(data.itemId, listId);
	if (!deleted) error(404, 'Item not found');

	log.info({ userId, itemId: data.itemId, listId }, 'custom list item deleted');
});

/** Batch reorder items after drag-and-drop */
export const reorderItems = command(reorderSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);
	await reorderCustomListItems(listId, data.updates);
});

// ---------------------------------------------------------------------------
// Remote functions — Fields
// ---------------------------------------------------------------------------

/** Add a custom field to the list */
export const addField = command(addFieldSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	try {
		return await createCustomListField(listId, {
			name: data.name,
			fieldType: data.fieldType ?? 'text'
		});
	} catch (e) {
		if (e instanceof Error && e.message.includes(`${MAX_CUSTOM_FIELDS}`)) {
			log.warn({ userId, listId, name: data.name }, 'max fields limit');
			error(400, e.message);
		}
		throw e;
	}
});

/** Update a custom field */
export const editField = command(updateFieldSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	const fields: Partial<{
		name: string;
		fieldType: 'text' | 'number' | 'url' | 'date';
		sortOrder: number;
	}> = {};
	if (data.name !== undefined) fields.name = data.name;
	if (data.fieldType !== undefined) fields.fieldType = data.fieldType;
	if (data.sortOrder !== undefined) fields.sortOrder = data.sortOrder;

	const updated = await updateCustomListField(data.fieldId, listId, fields);
	if (!updated) error(404, 'Field not found');
	return updated;
});

/** Delete a custom field */
export const removeField = command(deleteFieldSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);

	const deleted = await deleteCustomListField(data.fieldId, listId);
	if (!deleted) error(404, 'Field not found');

	log.info({ userId, fieldId: data.fieldId, listId }, 'custom field deleted');
});

// ---------------------------------------------------------------------------
// Remote functions — Field values
// ---------------------------------------------------------------------------

/** Upsert field values for an item (bulk) */
export const setFieldValues = command(upsertFieldValuesSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);
	await upsertFieldValues(data.itemId, listId, data.values);
});

/** Remove a field value from an item */
export const removeFieldValue = command(deleteFieldValueSchema, async (data) => {
	const userId = requireSubscription();
	const listId = await resolveList(userId, data.slug);
	await deleteFieldValue(data.itemId, listId, data.fieldId);
});
