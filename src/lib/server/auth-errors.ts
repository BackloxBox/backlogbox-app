import { APIError } from 'better-auth';
import { log } from '$lib/server/logger';

/**
 * Map of known better-auth error codes/messages to user-friendly strings.
 * Keys are checked against both `error.code` (if present) and `error.message`.
 */
const ERROR_MAP: ReadonlyArray<{ match: (err: APIError) => boolean; message: string }> = [
	{
		match: (e) => codeOrMessageIncludes(e, 'USER_ALREADY_EXISTS'),
		message: 'An account with this email already exists. Try signing in instead.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'PASSWORD_TOO_SHORT'),
		message: 'Password must be at least 8 characters.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'PASSWORD_TOO_LONG'),
		message: 'Password is too long.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_EMAIL_OR_PASSWORD'),
		message: 'Invalid email or password.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_PASSWORD'),
		message: 'Invalid email or password.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'EMAIL_NOT_VERIFIED'),
		message: 'Please verify your email before signing in. Check your inbox.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_TOKEN'),
		message: 'This link has expired or is invalid. Please try again.'
	},
	{
		match: (e) => e.message?.includes('Polar customer creation failed') ?? false,
		message: 'Registration failed. Please try again or contact support.'
	}
];

function codeOrMessageIncludes(err: APIError, needle: string): boolean {
	const code = (err as APIError & { code?: string }).code ?? '';
	return code.includes(needle) || (err.message?.includes(needle) ?? false);
}

/**
 * Convert an APIError into a user-friendly message string.
 * Logs the raw error before returning the friendly message.
 */
export function friendlyAuthError(error: APIError, context: Record<string, unknown> = {}): string {
	log.warn(
		{
			...context,
			code: (error as APIError & { code?: string }).code,
			status: error.status,
			raw: error.message
		},
		'auth error'
	);

	for (const entry of ERROR_MAP) {
		if (entry.match(error)) return entry.message;
	}

	return 'Something went wrong. Please try again.';
}
