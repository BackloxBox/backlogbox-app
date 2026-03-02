import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpError } from '@sveltejs/kit';
import type { AccessLevel } from './access';
import type { MediaType } from '$lib/types';

// ---------------------------------------------------------------------------
// Mock $app/server — getRequestEvent returns a controllable event
// ---------------------------------------------------------------------------

const mockLocals: {
	user: { id: string } | null;
	subscribed: boolean;
	accessLevel: AccessLevel;
	freeBoards: MediaType[] | null;
} = {
	user: null,
	subscribed: false,
	accessLevel: 'none',
	freeBoards: null
};

vi.mock('$app/server', () => ({
	getRequestEvent: () => ({ locals: mockLocals })
}));

import {
	requireUserId,
	requirePaid,
	requireSubscription,
	requireActiveBoard,
	requireItemLimit,
	getRequestAccessLevel
} from './auth-guard';

function isHttpError(e: unknown): e is HttpError {
	return typeof e === 'object' && e !== null && 'status' in e && 'body' in e;
}

function setLocals(overrides: Partial<typeof mockLocals>) {
	Object.assign(mockLocals, {
		user: null,
		subscribed: false,
		accessLevel: 'none' as AccessLevel,
		freeBoards: null,
		...overrides
	});
}

// ---------------------------------------------------------------------------
// requireUserId
// ---------------------------------------------------------------------------

describe('requireUserId', () => {
	beforeEach(() => setLocals({}));

	it('throws 401 when no user in session', () => {
		expect.assertions(2);
		try {
			requireUserId();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('returns user id when authenticated', () => {
		setLocals({ user: { id: 'user-123' } });
		expect(requireUserId()).toBe('user-123');
	});
});

// ---------------------------------------------------------------------------
// requirePaid
// ---------------------------------------------------------------------------

describe('requirePaid', () => {
	beforeEach(() => setLocals({}));

	it('throws 401 when no user in session', () => {
		expect.assertions(2);
		try {
			requirePaid();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('throws 403 when authenticated but on free tier', () => {
		setLocals({ user: { id: 'user-1' }, accessLevel: 'free' });
		expect.assertions(2);
		try {
			requirePaid();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});

	it('returns user id when on paid tier', () => {
		setLocals({ user: { id: 'user-2' }, accessLevel: 'paid', subscribed: true });
		expect(requirePaid()).toBe('user-2');
	});

	it('grants access for trial users (accessLevel=paid)', () => {
		setLocals({ user: { id: 'trial-user' }, accessLevel: 'paid', subscribed: true });
		expect(requirePaid()).toBe('trial-user');
	});
});

// ---------------------------------------------------------------------------
// requireSubscription (legacy alias)
// ---------------------------------------------------------------------------

describe('requireSubscription (legacy)', () => {
	it('behaves identically to requirePaid', () => {
		setLocals({ user: { id: 'user-3' }, accessLevel: 'paid', subscribed: true });
		expect(requireSubscription()).toBe('user-3');
	});

	it('throws 403 for free users', () => {
		setLocals({ user: { id: 'user-4' }, accessLevel: 'free' });
		expect.assertions(1);
		try {
			requireSubscription();
		} catch (e) {
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});
});

// ---------------------------------------------------------------------------
// requireActiveBoard
// ---------------------------------------------------------------------------

describe('requireActiveBoard', () => {
	beforeEach(() => setLocals({}));

	it('throws 401 when not authenticated', () => {
		expect.assertions(2);
		try {
			requireActiveBoard('book');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('allows paid user for any board type', () => {
		setLocals({ user: { id: 'paid-1' }, accessLevel: 'paid' });
		expect(requireActiveBoard('game')).toBe('paid-1');
		expect(requireActiveBoard('book')).toBe('paid-1');
		expect(requireActiveBoard('podcast')).toBe('paid-1');
	});

	it('allows free user for a selected board', () => {
		setLocals({
			user: { id: 'free-1' },
			accessLevel: 'free',
			freeBoards: ['book', 'movie', 'series']
		});
		expect(requireActiveBoard('book')).toBe('free-1');
		expect(requireActiveBoard('movie')).toBe('free-1');
		expect(requireActiveBoard('series')).toBe('free-1');
	});

	it('throws 403 for free user on a non-selected board', () => {
		setLocals({
			user: { id: 'free-2' },
			accessLevel: 'free',
			freeBoards: ['book', 'movie', 'series']
		});
		expect.assertions(2);
		try {
			requireActiveBoard('game');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});

	it('throws 403 for free user with null freeBoards', () => {
		setLocals({ user: { id: 'free-3' }, accessLevel: 'free', freeBoards: null });
		expect.assertions(2);
		try {
			requireActiveBoard('book');
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});
});

// ---------------------------------------------------------------------------
// requireItemLimit
// ---------------------------------------------------------------------------

describe('requireItemLimit', () => {
	beforeEach(() => setLocals({}));

	it('throws 401 when not authenticated', () => {
		expect.assertions(2);
		try {
			requireItemLimit('book', 0);
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('allows paid user regardless of count', () => {
		setLocals({ user: { id: 'paid-1' }, accessLevel: 'paid' });
		expect(requireItemLimit('book', 1000)).toBe('paid-1');
	});

	it('allows free user under the limit', () => {
		setLocals({ user: { id: 'free-1' }, accessLevel: 'free' });
		expect(requireItemLimit('book', 19)).toBe('free-1');
	});

	it('throws 403 for free user at the limit (20)', () => {
		setLocals({ user: { id: 'free-2' }, accessLevel: 'free' });
		expect.assertions(2);
		try {
			requireItemLimit('book', 20);
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});

	it('throws 403 for free user over the limit', () => {
		setLocals({ user: { id: 'free-3' }, accessLevel: 'free' });
		expect.assertions(2);
		try {
			requireItemLimit('book', 25);
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});
});

// ---------------------------------------------------------------------------
// getRequestAccessLevel
// ---------------------------------------------------------------------------

describe('getRequestAccessLevel', () => {
	it('throws 401 when not authenticated', () => {
		setLocals({});
		expect.assertions(2);
		try {
			getRequestAccessLevel();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('returns the access level for authenticated user', () => {
		setLocals({ user: { id: 'u1' }, accessLevel: 'free' });
		expect(getRequestAccessLevel()).toBe('free');

		setLocals({ user: { id: 'u2' }, accessLevel: 'paid' });
		expect(getRequestAccessLevel()).toBe('paid');
	});
});
