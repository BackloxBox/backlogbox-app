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

/**
 * Requires both authentication and an active subscription.
 * Throws 401 if not authenticated, 403 if not subscribed.
 */
export function requireSubscription(): string {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		error(401, 'Not authenticated');
	}
	if (!locals.subscribed) {
		error(403, 'Subscription required');
	}
	return locals.user.id;
}
