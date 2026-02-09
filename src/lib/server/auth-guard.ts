import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

/**
 * Extracts the authenticated user ID from the current request event.
 * Throws 401 if not authenticated.
 */
export function requireUserId(): string {
	const { locals } = getRequestEvent();
	const user = locals.user;
	if (!user) {
		error(401, 'Not authenticated');
	}
	return user.id;
}
