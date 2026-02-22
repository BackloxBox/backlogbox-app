import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/logger', () => ({
	log: { debug: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

import { APIError } from 'better-auth';
import { friendlyAuthError } from './auth-errors';

/** Helper to create an APIError with a given code/message */
function makeError(code: string, message?: string): APIError {
	const err = new APIError(400, { message: message ?? code, code });
	return err;
}

describe('friendlyAuthError', () => {
	// ── Credentials ──────────────────────────────────────────────────
	it('maps USER_ALREADY_EXISTS', () => {
		expect(friendlyAuthError(makeError('USER_ALREADY_EXISTS'))).toBe(
			'An account with this email already exists. Try signing in instead.'
		);
	});

	it('maps INVALID_EMAIL_OR_PASSWORD', () => {
		expect(friendlyAuthError(makeError('INVALID_EMAIL_OR_PASSWORD'))).toBe(
			'Invalid email or password.'
		);
	});

	it('maps INVALID_USERNAME_OR_PASSWORD', () => {
		expect(friendlyAuthError(makeError('INVALID_USERNAME_OR_PASSWORD'))).toBe(
			'Invalid email or password.'
		);
	});

	it('maps INVALID_USERNAME_OR_PASSWORD from human-readable message', () => {
		const err = new APIError('UNAUTHORIZED', { message: 'Invalid username or password' });
		expect(friendlyAuthError(err)).toBe('Invalid email or password.');
	});

	it('maps INVALID_PASSWORD', () => {
		expect(friendlyAuthError(makeError('INVALID_PASSWORD'))).toBe('Invalid email or password.');
	});

	it('maps INVALID_EMAIL', () => {
		expect(friendlyAuthError(makeError('INVALID_EMAIL'))).toBe(
			'Please enter a valid email address.'
		);
	});

	it('maps EMAIL_NOT_VERIFIED by code', () => {
		expect(friendlyAuthError(makeError('EMAIL_NOT_VERIFIED'))).toContain('verify your email');
	});

	it('maps EMAIL_NOT_VERIFIED by human-readable message (better-auth username plugin)', () => {
		const err = new APIError('FORBIDDEN', { message: 'Email not verified' });
		expect(friendlyAuthError(err)).toContain('verify your email');
	});

	it('maps EMAIL_ALREADY_VERIFIED', () => {
		expect(friendlyAuthError(makeError('EMAIL_ALREADY_VERIFIED'))).toContain('already verified');
	});

	// ── Password ─────────────────────────────────────────────────────
	it('maps PASSWORD_TOO_SHORT', () => {
		expect(friendlyAuthError(makeError('PASSWORD_TOO_SHORT'))).toBe(
			'Password must be at least 8 characters.'
		);
	});

	it('maps PASSWORD_TOO_SHORT from human-readable message', () => {
		const err = new APIError('BAD_REQUEST', { message: 'Password too short' });
		expect(friendlyAuthError(err)).toBe('Password must be at least 8 characters.');
	});

	it('maps PASSWORD_TOO_LONG', () => {
		expect(friendlyAuthError(makeError('PASSWORD_TOO_LONG'))).toBe('Password is too long.');
	});

	it('maps CREDENTIAL_ACCOUNT_NOT_FOUND', () => {
		expect(friendlyAuthError(makeError('CREDENTIAL_ACCOUNT_NOT_FOUND'))).toContain(
			'No password set'
		);
	});

	// ── Username plugin ──────────────────────────────────────────────
	it('maps USERNAME_IS_ALREADY_TAKEN', () => {
		expect(friendlyAuthError(makeError('USERNAME_IS_ALREADY_TAKEN'))).toContain('taken');
	});

	it('maps USERNAME_IS_ALREADY_TAKEN from human-readable message', () => {
		const err = new APIError('BAD_REQUEST', {
			message: 'Username is already taken. Please try another.'
		});
		expect(friendlyAuthError(err)).toContain('taken');
	});

	it('maps USERNAME_TOO_SHORT', () => {
		expect(friendlyAuthError(makeError('USERNAME_TOO_SHORT'))).toContain('at least 1');
	});

	it('maps USERNAME_TOO_LONG', () => {
		expect(friendlyAuthError(makeError('USERNAME_TOO_LONG'))).toContain('39 characters');
	});

	it('maps INVALID_USERNAME', () => {
		expect(friendlyAuthError(makeError('INVALID_USERNAME'))).toContain('lowercase letters');
	});

	// ── Session / token ──────────────────────────────────────────────
	it('maps INVALID_TOKEN', () => {
		expect(friendlyAuthError(makeError('INVALID_TOKEN'))).toContain('expired or is invalid');
	});

	it('maps SESSION_EXPIRED', () => {
		expect(friendlyAuthError(makeError('SESSION_EXPIRED'))).toContain('session has expired');
	});

	it('maps SESSION_NOT_FRESH', () => {
		const err = new APIError('FORBIDDEN', { message: 'Session is not fresh' });
		expect(friendlyAuthError(err)).toContain('session has expired');
	});

	// ── Account creation / server errors ─────────────────────────────
	it('maps FAILED_TO_CREATE_USER', () => {
		expect(friendlyAuthError(makeError('FAILED_TO_CREATE_USER'))).toContain('creation failed');
	});

	it('maps FAILED_TO_CREATE_SESSION', () => {
		expect(friendlyAuthError(makeError('FAILED_TO_CREATE_SESSION'))).toContain('Sign-in failed');
	});

	it('maps FAILED_TO_UPDATE_USER', () => {
		expect(friendlyAuthError(makeError('FAILED_TO_UPDATE_USER'))).toContain('update failed');
	});

	// ── Social / OAuth ───────────────────────────────────────────────
	it('maps PROVIDER_NOT_FOUND', () => {
		expect(friendlyAuthError(makeError('PROVIDER_NOT_FOUND'))).toContain('not available');
	});

	it('maps FAILED_TO_GET_USER_INFO', () => {
		expect(friendlyAuthError(makeError('FAILED_TO_GET_USER_INFO'))).toContain(
			'retrieve your account info'
		);
	});

	it('maps USER_EMAIL_NOT_FOUND', () => {
		expect(friendlyAuthError(makeError('USER_EMAIL_NOT_FOUND'))).toContain('No email address');
	});

	it('maps SOCIAL_ACCOUNT_ALREADY_LINKED', () => {
		expect(friendlyAuthError(makeError('SOCIAL_ACCOUNT_ALREADY_LINKED'))).toContain(
			'already linked'
		);
	});

	// ── CSRF / origin ────────────────────────────────────────────────
	it('maps CROSS_SITE_NAVIGATION_LOGIN_BLOCKED', () => {
		expect(friendlyAuthError(makeError('CROSS_SITE_NAVIGATION_LOGIN_BLOCKED'))).toContain(
			'security reasons'
		);
	});

	it('maps INVALID_ORIGIN', () => {
		const err = new APIError('FORBIDDEN', { message: 'Invalid origin' });
		expect(friendlyAuthError(err)).toContain('security reasons');
	});

	it('maps MISSING_OR_NULL_ORIGIN', () => {
		const err = new APIError('FORBIDDEN', { message: 'Missing or null Origin' });
		expect(friendlyAuthError(err)).toContain('security reasons');
	});

	// ── Polar ────────────────────────────────────────────────────────
	it('maps Polar customer creation failed via message', () => {
		const err = new APIError(500, { message: 'Polar customer creation failed' });
		expect(friendlyAuthError(err)).toBe(
			'Registration failed. Please try again or contact yorick@backlogbox.com'
		);
	});

	it('maps Polar customer creation failed with details', () => {
		const err = new APIError(500, {
			message: 'Polar customer creation failed. Error: timeout'
		});
		expect(friendlyAuthError(err)).toBe(
			'Registration failed. Please try again or contact yorick@backlogbox.com'
		);
	});

	it('maps Checkout creation failed', () => {
		const err = new APIError(500, { message: 'Checkout creation failed' });
		expect(friendlyAuthError(err)).toContain('Payment setup failed');
	});

	it('maps Product not found', () => {
		const err = new APIError(400, { message: 'Product not found' });
		expect(friendlyAuthError(err)).toContain('plan was not found');
	});

	// ── Misc ─────────────────────────────────────────────────────────
	it('maps invalid email address format via message', () => {
		const err = new APIError(400, { message: 'foo@bar is not a valid email address' });
		expect(friendlyAuthError(err)).toContain('valid email address');
	});

	it('returns generic fallback for unknown errors', () => {
		expect(friendlyAuthError(makeError('UNKNOWN_CODE', 'something weird'))).toBe(
			'Something went wrong. Please try again.'
		);
	});
});
