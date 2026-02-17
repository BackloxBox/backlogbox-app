import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpError } from '@sveltejs/kit';

// ---------------------------------------------------------------------------
// Mock $app/server — getRequestEvent returns a controllable event
// ---------------------------------------------------------------------------

const mockLocals: { user: { id: string } | null; subscribed: boolean } = {
	user: null,
	subscribed: false
};

vi.mock('$app/server', () => ({
	getRequestEvent: () => ({ locals: mockLocals })
}));

import { requireUserId, requireSubscription } from './auth-guard';

function isHttpError(e: unknown): e is HttpError {
	return typeof e === 'object' && e !== null && 'status' in e && 'body' in e;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('requireUserId', () => {
	beforeEach(() => {
		mockLocals.user = null;
		mockLocals.subscribed = false;
	});

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
		mockLocals.user = { id: 'user-123' };

		const id = requireUserId();

		expect(id).toBe('user-123');
	});
});

describe('requireSubscription', () => {
	beforeEach(() => {
		mockLocals.user = null;
		mockLocals.subscribed = false;
	});

	it('throws 401 when no user in session', () => {
		expect.assertions(2);
		try {
			requireSubscription();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(401);
		}
	});

	it('throws 403 when authenticated but not subscribed', () => {
		mockLocals.user = { id: 'user-123' };
		mockLocals.subscribed = false;

		expect.assertions(2);
		try {
			requireSubscription();
		} catch (e) {
			expect(isHttpError(e)).toBe(true);
			if (isHttpError(e)) expect(e.status).toBe(403);
		}
	});

	it('returns user id when authenticated and subscribed', () => {
		mockLocals.user = { id: 'user-456' };
		mockLocals.subscribed = true;

		const id = requireSubscription();

		expect(id).toBe('user-456');
	});
});
