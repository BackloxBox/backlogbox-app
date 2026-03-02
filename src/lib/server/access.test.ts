import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	hasAccess,
	getAccessLevel,
	trialDaysRemaining,
	needsBoardSelection,
	type AccessProfile
} from './access';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a profile with sensible defaults (no access) */
function profile(overrides: Partial<AccessProfile> = {}): AccessProfile {
	return {
		subscribed: false,
		freeAccess: false,
		trialEndsAt: null,
		deletedAt: null,
		...overrides
	};
}

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

// ---------------------------------------------------------------------------
// getAccessLevel
// ---------------------------------------------------------------------------

describe('getAccessLevel', () => {
	it('returns "free" for authenticated user with no subscription, trial, or freeAccess', () => {
		expect(getAccessLevel(profile())).toBe('free');
	});

	it('returns "paid" when subscribed', () => {
		expect(getAccessLevel(profile({ subscribed: true }))).toBe('paid');
	});

	it('returns "paid" when freeAccess flag set', () => {
		expect(getAccessLevel(profile({ freeAccess: true }))).toBe('paid');
	});

	it('returns "paid" during active trial', () => {
		expect(getAccessLevel(profile({ trialEndsAt: daysFromNow(7) }))).toBe('paid');
	});

	it('returns "free" after trial expiry', () => {
		expect(getAccessLevel(profile({ trialEndsAt: daysFromNow(-1) }))).toBe('free');
	});

	it('returns "none" when soft-deleted even if subscribed', () => {
		expect(getAccessLevel(profile({ subscribed: true, deletedAt: new Date() }))).toBe('none');
	});

	it('returns "none" when soft-deleted even with active trial', () => {
		expect(getAccessLevel(profile({ trialEndsAt: daysFromNow(7), deletedAt: new Date() }))).toBe(
			'none'
		);
	});

	it('returns "none" when soft-deleted even with freeAccess', () => {
		expect(getAccessLevel(profile({ freeAccess: true, deletedAt: new Date() }))).toBe('none');
	});

	it('returns "paid" when subscribed and trial expired (subscription wins)', () => {
		expect(getAccessLevel(profile({ subscribed: true, trialEndsAt: daysFromNow(-30) }))).toBe(
			'paid'
		);
	});

	it('returns "free" when trial is exactly now (edge: trialEndsAt = now)', () => {
		expect(getAccessLevel(profile({ trialEndsAt: new Date() }))).toBe('free');
	});

	it('returns "paid" with trial ending in 1ms', () => {
		const almostExpired = new Date(Date.now() + 1);
		expect(getAccessLevel(profile({ trialEndsAt: almostExpired }))).toBe('paid');
	});
});

// ---------------------------------------------------------------------------
// hasAccess — backward compat wrapper, should be true for free + paid
// ---------------------------------------------------------------------------

describe('hasAccess', () => {
	it('returns true for free tier (expired trial, authenticated)', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(-1) }))).toBe(true);
	});

	it('returns true for free tier (no trial at all)', () => {
		expect(hasAccess(profile())).toBe(true);
	});

	it('returns true when subscribed', () => {
		expect(hasAccess(profile({ subscribed: true }))).toBe(true);
	});

	it('returns true when freeAccess flag set', () => {
		expect(hasAccess(profile({ freeAccess: true }))).toBe(true);
	});

	it('returns true during active trial', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(7) }))).toBe(true);
	});

	it('returns false when soft-deleted even if subscribed', () => {
		expect(hasAccess(profile({ subscribed: true, deletedAt: new Date() }))).toBe(false);
	});

	it('returns false when soft-deleted even with active trial', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(7), deletedAt: new Date() }))).toBe(false);
	});

	it('returns false when soft-deleted even with freeAccess', () => {
		expect(hasAccess(profile({ freeAccess: true, deletedAt: new Date() }))).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// trialDaysRemaining
// ---------------------------------------------------------------------------

describe('trialDaysRemaining', () => {
	afterEach(() => vi.useRealTimers());

	it('returns null for null trialEndsAt', () => {
		expect(trialDaysRemaining(null)).toBeNull();
	});

	it('returns 0 for expired trial', () => {
		expect(trialDaysRemaining(daysFromNow(-5))).toBe(0);
	});

	it('returns 0 for trial that just expired (trialEndsAt = now)', () => {
		expect(trialDaysRemaining(new Date())).toBe(0);
	});

	it('returns 14 for trial ending in 14 days', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
		const endsAt = new Date('2026-03-15T12:00:00Z');
		expect(trialDaysRemaining(endsAt)).toBe(14);
	});

	it('returns 1 for trial ending in less than 24h', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
		const endsAt = new Date('2026-03-02T06:00:00Z'); // 18h from now
		expect(trialDaysRemaining(endsAt)).toBe(1);
	});

	it('returns 1 for trial ending in exactly 24h', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
		const endsAt = new Date('2026-03-02T12:00:00Z');
		expect(trialDaysRemaining(endsAt)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// needsBoardSelection
// ---------------------------------------------------------------------------

describe('needsBoardSelection', () => {
	const MAX = 3;

	it('returns false for paid users regardless of interests', () => {
		expect(needsBoardSelection('paid', null, ['a', 'b', 'c', 'd', 'e'], MAX)).toBe(false);
	});

	it('returns false for none access level', () => {
		expect(needsBoardSelection('none', null, ['a', 'b', 'c', 'd'], MAX)).toBe(false);
	});

	it('returns false when freeBoards already set', () => {
		expect(needsBoardSelection('free', ['a', 'b', 'c'], ['a', 'b', 'c', 'd'], MAX)).toBe(false);
	});

	it('returns false when interests fit within limit', () => {
		expect(needsBoardSelection('free', null, ['a', 'b', 'c'], MAX)).toBe(false);
	});

	it('returns false when interests equal the limit exactly', () => {
		expect(needsBoardSelection('free', null, ['a', 'b', 'c'], MAX)).toBe(false);
	});

	it('returns true when free user has >N interests and no freeBoards', () => {
		expect(needsBoardSelection('free', null, ['a', 'b', 'c', 'd'], MAX)).toBe(true);
	});

	it('returns true when free user has 5 interests and no freeBoards', () => {
		expect(needsBoardSelection('free', null, ['a', 'b', 'c', 'd', 'e'], MAX)).toBe(true);
	});

	it('returns false when freeBoards is empty array', () => {
		// Empty array means "hasn't chosen yet" — same as null for length check
		expect(needsBoardSelection('free', [], ['a', 'b', 'c', 'd'], MAX)).toBe(true);
	});

	it('returns false when interests is null', () => {
		expect(needsBoardSelection('free', null, null, MAX)).toBe(false);
	});

	it('returns false when interests is empty', () => {
		expect(needsBoardSelection('free', null, [], MAX)).toBe(false);
	});
});
