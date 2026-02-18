/** User profile fields relevant to access control */
export interface AccessProfile {
	subscribed: boolean;
	freeAccess: boolean;
	trialEndsAt: Date | null;
	deletedAt: Date | null;
}

/**
 * Determines if a user has access to the app.
 *
 * Access is granted if ANY of the following are true:
 * - User has an active paid subscription
 * - User has the freeAccess flag (manual grant)
 * - User is within a non-expired trial period
 *
 * Soft-deleted users are always denied.
 */
export function hasAccess(profile: AccessProfile): boolean {
	if (profile.deletedAt !== null) return false;
	if (profile.subscribed) return true;
	if (profile.freeAccess) return true;
	if (profile.trialEndsAt !== null && profile.trialEndsAt > new Date()) return true;
	return false;
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
