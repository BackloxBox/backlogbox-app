import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { MediaType } from '$lib/types';
import type { AccessLevel } from './access';
import { getLimits } from './limits';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocals() {
	return getRequestEvent().locals;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Extracts the authenticated user ID from the current request event.
 * Throws 401 if not authenticated.
 */
export function requireUserId(): string {
	const { user } = getLocals();
	if (!user) {
		error(401, 'Not authenticated');
	}
	return user.id;
}

/**
 * Requires both authentication and paid-level access (subscription, freeAccess, or active trial).
 * Throws 401 if not authenticated, 403 if not on a paid plan.
 */
export function requirePaid(): string {
	const locals = getLocals();
	if (!locals.user) {
		error(401, 'Not authenticated');
	}
	if (locals.accessLevel !== 'paid') {
		error(403, 'Subscription required');
	}
	return locals.user.id;
}

/**
 * Legacy alias — same as requirePaid().
 * Kept for backward compatibility during migration.
 * @deprecated Use requirePaid() or requireUserId() instead.
 */
export function requireSubscription(): string {
	return requirePaid();
}

/**
 * Requires the user to have write access to a specific media board.
 *
 * - Paid users: always allowed (all boards active).
 * - Free users: allowed only if the media type is in their freeBoards selection.
 *
 * Throws 401 if not authenticated, 403 if the board is not active for this user.
 */
export function requireActiveBoard(mediaType: MediaType): string {
	const locals = getLocals();
	if (!locals.user) {
		error(401, 'Not authenticated');
	}
	if (locals.accessLevel === 'paid') {
		return locals.user.id;
	}
	const boards = locals.freeBoards;
	if (boards && boards.includes(mediaType)) {
		return locals.user.id;
	}
	error(403, 'Upgrade to manage this board');
}

/**
 * Returns the access level for the current request.
 * Throws 401 if not authenticated.
 */
export function getRequestAccessLevel(): AccessLevel {
	const locals = getLocals();
	if (!locals.user) {
		error(401, 'Not authenticated');
	}
	return locals.accessLevel;
}

/**
 * Checks whether adding an item would exceed the per-board limit for the user's tier.
 * Call this *after* requireActiveBoard() to verify the board is writable.
 *
 * Returns the userId on success, throws 403 if the limit is reached.
 */
export function requireItemLimit(mediaType: MediaType, currentCount: number): string {
	const locals = getLocals();
	if (!locals.user) {
		error(401, 'Not authenticated');
	}
	const limits = getLimits(locals.accessLevel);
	if (currentCount >= limits.maxItemsPerBoard) {
		error(
			403,
			`Free plan allows up to ${limits.maxItemsPerBoard} items per board. Upgrade for unlimited.`
		);
	}
	return locals.user.id;
}
