/** User profile fields relevant to access control */
export interface AccessProfile {
	subscribed: boolean;
	freeAccess: boolean;
	trialEndsAt: Date | null;
	deletedAt: Date | null;
}

/**
 * The three levels of access a user can have.
 *
 * - `'none'`  — soft-deleted or not authenticated; no app access at all.
 * - `'free'`  — authenticated but no active subscription/trial; limited features.
 * - `'paid'`  — active subscription, freeAccess flag, or active trial; full access.
 */
export type AccessLevel = 'none' | 'free' | 'paid';

/**
 * Determines the access level for a user.
 *
 * - Soft-deleted users → `'none'`
 * - Active subscription, freeAccess flag, or active trial → `'paid'`
 * - Authenticated but none of the above → `'free'`
 */
export function getAccessLevel(profile: AccessProfile): AccessLevel {
	if (profile.deletedAt !== null) return 'none';
	if (profile.subscribed) return 'paid';
	if (profile.freeAccess) return 'paid';
	if (profile.trialEndsAt !== null && profile.trialEndsAt > new Date()) return 'paid';
	return 'free';
}

/**
 * Determines if a user has access to the app (free or paid).
 *
 * Access is granted if ANY of the following are true:
 * - User has an active paid subscription
 * - User has the freeAccess flag (manual grant)
 * - User is within a non-expired trial period
 * - User is on the free tier (authenticated, not deleted)
 *
 * Soft-deleted users are always denied.
 */
export function hasAccess(profile: AccessProfile): boolean {
	return getAccessLevel(profile) !== 'none';
}

/**
 * Whether a free-tier user needs to choose which boards to keep.
 * True when: free access, no explicit freeBoards set, and interests exceed the board limit.
 */
export function needsBoardSelection(
	accessLevel: AccessLevel,
	freeBoards: readonly string[] | null,
	interests: readonly string[] | null,
	maxActiveBoards: number
): boolean {
	if (accessLevel !== 'free') return false;
	if (freeBoards !== null && freeBoards.length > 0) return false;
	return (interests?.length ?? 0) > maxActiveBoards;
}

/**
 * Computes the number of full days remaining in the trial.
 * Returns null if no trial or trial expired.
 */
export function trialDaysRemaining(trialEndsAt: Date | null): number | null {
	if (trialEndsAt === null) return null;
	const ms = trialEndsAt.getTime() - Date.now();
	if (ms <= 0) return 0;
	return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
