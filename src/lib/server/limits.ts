import type { AccessLevel } from './access';

// ---------------------------------------------------------------------------
// Hard caps (not tier-differentiated — applies to free/trial users only)
// ---------------------------------------------------------------------------

/** Maximum total items across all boards for non-paid users */
export const MAX_TOTAL_ITEMS = 200;

// ---------------------------------------------------------------------------
// Per-tier feature limits
// ---------------------------------------------------------------------------

export interface TierLimits {
	/** Max media types a user can actively manage (add/edit/delete items) */
	readonly maxActiveBoards: number;
	/** Max items per media board */
	readonly maxItemsPerBoard: number;
	/** Max custom lists */
	readonly maxCustomLists: number;
	/** Can add/edit notes on media items */
	readonly hasNotes: boolean;
	/** Can view Year in Review / Wrapped */
	readonly hasWrapped: boolean;
	/** Can access personalized recommendations in Discover */
	readonly hasRecommendations: boolean;
}

export const FREE_LIMITS: TierLimits = {
	maxActiveBoards: 3,
	maxItemsPerBoard: 20,
	maxCustomLists: 0,
	hasNotes: false,
	hasWrapped: false,
	hasRecommendations: false
} as const;

export const PAID_LIMITS: TierLimits = {
	maxActiveBoards: 5,
	maxItemsPerBoard: Infinity,
	maxCustomLists: 5,
	hasNotes: true,
	hasWrapped: true,
	hasRecommendations: true
} as const;

/**
 * Returns the feature limits for a given access level.
 * `'none'` gets free limits (irrelevant — blocked before reaching limit checks).
 */
export function getLimits(level: AccessLevel): TierLimits {
	return level === 'paid' ? PAID_LIMITS : FREE_LIMITS;
}
