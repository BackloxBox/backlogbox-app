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
	it('maps USER_ALREADY_EXISTS', () => {
		expect(friendlyAuthError(makeError('USER_ALREADY_EXISTS'))).toBe(
			'An account with this email already exists. Try signing in instead.'
		);
	});

	it('maps PASSWORD_TOO_SHORT', () => {
		expect(friendlyAuthError(makeError('PASSWORD_TOO_SHORT'))).toBe(
			'Password must be at least 8 characters.'
		);
	});

	it('maps PASSWORD_TOO_LONG', () => {
		expect(friendlyAuthError(makeError('PASSWORD_TOO_LONG'))).toBe('Password is too long.');
	});

	it('maps INVALID_EMAIL_OR_PASSWORD', () => {
		expect(friendlyAuthError(makeError('INVALID_EMAIL_OR_PASSWORD'))).toBe(
			'Invalid email or password.'
		);
	});

	it('maps INVALID_PASSWORD', () => {
		expect(friendlyAuthError(makeError('INVALID_PASSWORD'))).toBe('Invalid email or password.');
	});

	it('maps EMAIL_NOT_VERIFIED', () => {
		expect(friendlyAuthError(makeError('EMAIL_NOT_VERIFIED'))).toContain('verify your email');
	});

	it('maps INVALID_TOKEN', () => {
		expect(friendlyAuthError(makeError('INVALID_TOKEN'))).toContain('expired or is invalid');
	});

	it('maps Polar customer creation failed via message', () => {
		const err = new APIError(500, { message: 'Polar customer creation failed' });
		expect(friendlyAuthError(err)).toBe(
			'Registration failed. Please try again or contact support.'
		);
	});

	it('returns generic fallback for unknown errors', () => {
		expect(friendlyAuthError(makeError('UNKNOWN_CODE', 'something weird'))).toBe(
			'Something went wrong. Please try again.'
		);
	});
});
