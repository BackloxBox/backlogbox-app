import { describe, it, expect, vi, afterEach } from 'vitest';
import { hasAccess, trialDaysRemaining, type AccessProfile } from './access';

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
// hasAccess
// ---------------------------------------------------------------------------

describe('hasAccess', () => {
	it('denies access with no subscription, no trial, no freeAccess', () => {
		expect(hasAccess(profile())).toBe(false);
	});

	it('grants access when subscribed', () => {
		expect(hasAccess(profile({ subscribed: true }))).toBe(true);
	});

	it('grants access when freeAccess flag set', () => {
		expect(hasAccess(profile({ freeAccess: true }))).toBe(true);
	});

	it('grants access during active trial', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(7) }))).toBe(true);
	});

	it('denies access after trial expiry', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(-1) }))).toBe(false);
	});

	it('denies access when soft-deleted even if subscribed', () => {
		expect(hasAccess(profile({ subscribed: true, deletedAt: new Date() }))).toBe(false);
	});

	it('denies access when soft-deleted even with active trial', () => {
		expect(hasAccess(profile({ trialEndsAt: daysFromNow(7), deletedAt: new Date() }))).toBe(false);
	});

	it('denies access when soft-deleted even with freeAccess', () => {
		expect(hasAccess(profile({ freeAccess: true, deletedAt: new Date() }))).toBe(false);
	});

	it('grants access when subscribed and trial expired (subscription wins)', () => {
		expect(hasAccess(profile({ subscribed: true, trialEndsAt: daysFromNow(-30) }))).toBe(true);
	});

	it('denies access when trial is exactly now (edge: trialEndsAt = now)', () => {
		// trialEndsAt === new Date() means the trial has ended (> comparison fails)
		expect(hasAccess(profile({ trialEndsAt: new Date() }))).toBe(false);
	});

	it('grants access with trial ending in 1ms', () => {
		const almostExpired = new Date(Date.now() + 1);
		expect(hasAccess(profile({ trialEndsAt: almostExpired }))).toBe(true);
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
