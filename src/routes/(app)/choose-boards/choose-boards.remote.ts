import * as v from 'valibot';
import { command } from '$app/server';
import { requireUserId, getRequestAccessLevel } from '$lib/server/auth-guard';
import { setFreeBoards } from '$lib/server/db/queries';
import { log } from '$lib/server/logger';
import { MEDIA_TYPES } from '$lib/types';
import { FREE_LIMITS } from '$lib/server/limits';
import { error } from '@sveltejs/kit';

const chooseBoardsSchema = v.object({
	boards: v.pipe(
		v.array(v.picklist([...MEDIA_TYPES])),
		v.minLength(1),
		v.maxLength(FREE_LIMITS.maxActiveBoards)
	)
});

/** Save the user's free-tier board selection. Only callable by free-tier users. */
export const saveChosenBoards = command(chooseBoardsSchema, async (data) => {
	const userId = requireUserId();
	const level = getRequestAccessLevel();

	if (level !== 'free') {
		error(403, 'Board selection only applies to free-tier users');
	}

	await setFreeBoards(userId, data.boards);
	log.info({ userId, boards: data.boards }, 'free boards chosen');
});
