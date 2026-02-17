import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { command, query } from '$app/server';
import { requireSubscription } from '$lib/server/auth-guard';
import {
	createCustomList,
	deleteCustomList,
	getCustomListById,
	getCustomListsByUser,
	updateCustomList
} from '$lib/server/db/custom-list-queries';
import { LIST_ICON_OPTIONS, MAX_CUSTOM_LISTS } from '$lib/types';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createListSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(100)),
	icon: v.optional(v.nullable(v.picklist([...LIST_ICON_OPTIONS])))
});

const updateListSchema = v.object({
	listId: v.pipe(v.string(), v.nonEmpty()),
	name: v.optional(v.pipe(v.string(), v.nonEmpty(), v.maxLength(100))),
	icon: v.optional(v.nullable(v.picklist([...LIST_ICON_OPTIONS]))),
	isPublic: v.optional(v.boolean())
});

const deleteListSchema = v.object({
	listId: v.pipe(v.string(), v.nonEmpty())
});

// ---------------------------------------------------------------------------
// Remote functions
// ---------------------------------------------------------------------------

/** Fetch all custom lists for the current user (sidebar + list page) */
export const getLists = query(v.undefined(), async () => {
	const userId = requireSubscription();
	return getCustomListsByUser(userId);
});

/** Create a new custom list */
export const addList = command(createListSchema, async (data) => {
	const userId = requireSubscription();

	try {
		return await createCustomList(userId, {
			name: data.name,
			icon: data.icon ?? null
		});
	} catch (e) {
		if (e instanceof Error && e.message.includes(`${MAX_CUSTOM_LISTS}`)) {
			error(400, e.message);
		}
		throw e;
	}
});

/** Update a custom list (name, icon, visibility) */
export const editList = command(updateListSchema, async (data) => {
	const userId = requireSubscription();

	// Ownership check
	const list = await getCustomListById(data.listId);
	if (!list || list.userId !== userId) error(404, 'List not found');

	const updated = await updateCustomList(data.listId, userId, {
		name: data.name,
		icon: data.icon,
		isPublic: data.isPublic
	});

	if (!updated) error(404, 'List not found');
	return updated;
});

/** Delete a custom list */
export const removeList = command(deleteListSchema, async (data) => {
	const userId = requireSubscription();

	const deleted = await deleteCustomList(data.listId, userId);
	if (!deleted) error(404, 'List not found');
});
