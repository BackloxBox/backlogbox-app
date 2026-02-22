import { APIError } from 'better-auth';
import { log } from '$lib/server/logger';

/**
 * Map of known better-auth error codes/messages to user-friendly strings.
 * Keys are checked against both `error.code` (if present) and `error.message`.
 */
const ERROR_MAP: ReadonlyArray<{ match: (err: APIError) => boolean; message: string }> = [
	// ── Credentials ──────────────────────────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'USER_ALREADY_EXISTS'),
		message: 'An account with this email already exists. Try signing in instead.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_EMAIL_OR_PASSWORD'),
		message: 'Invalid email or password.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_USERNAME_OR_PASSWORD'),
		message: 'Invalid email or password.'
	},
	{
		// Must come after the more-specific *_OR_PASSWORD entries above.
		match: (e) => codeOrMessageIncludes(e, 'INVALID_PASSWORD'),
		message: 'Invalid email or password.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_EMAIL'),
		message: 'Please enter a valid email address.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'EMAIL_NOT_VERIFIED'),
		message: 'Please verify your email before signing in. Check your inbox.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'EMAIL_ALREADY_VERIFIED'),
		message: 'Your email is already verified. You can sign in.'
	},

	// ── Password ─────────────────────────────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'PASSWORD_TOO_SHORT'),
		message: 'Password must be at least 8 characters.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'PASSWORD_TOO_LONG'),
		message: 'Password is too long.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'CREDENTIAL_ACCOUNT_NOT_FOUND'),
		message: 'No password set on this account. You may have signed up with GitHub.'
	},

	// ── Username (better-auth username plugin) ───────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'USERNAME_IS_ALREADY_TAKEN'),
		message: 'That username is taken. Please choose another.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'USERNAME_TOO_SHORT'),
		message: 'Username must be at least 1 character.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'USERNAME_TOO_LONG'),
		message: 'Username must be 39 characters or fewer.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_USERNAME'),
		message: 'Username can only contain lowercase letters and numbers.'
	},

	// ── Session / token ──────────────────────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_TOKEN'),
		message: 'This link has expired or is invalid. Please try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'SESSION_EXPIRED'),
		message: 'Your session has expired. Please sign in again.'
	},
	{
		match: (e) =>
			codeOrMessageIncludes(e, 'SESSION_NOT_FRESH') ||
			(e.message?.toLowerCase().includes('session') &&
				e.message?.toLowerCase().includes('not fresh')) === true,
		message: 'Your session has expired. Please sign in again.'
	},

	// ── Account creation / server errors ─────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'FAILED_TO_CREATE_USER'),
		message: 'Account creation failed. Please try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'FAILED_TO_CREATE_SESSION'),
		message: 'Sign-in failed. Please try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'FAILED_TO_UPDATE_USER'),
		message: 'Profile update failed. Please try again.'
	},

	// ── Social / OAuth ───────────────────────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'PROVIDER_NOT_FOUND'),
		message: 'This sign-in method is not available.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'FAILED_TO_GET_USER_INFO'),
		message: 'Could not retrieve your account info from the provider. Please try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'USER_EMAIL_NOT_FOUND'),
		message: 'No email address found on your account. Please add one to your provider first.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'SOCIAL_ACCOUNT_ALREADY_LINKED'),
		message: 'This social account is already linked to your profile.'
	},

	// ── CSRF / origin ────────────────────────────────────────────────────
	{
		match: (e) => codeOrMessageIncludes(e, 'CROSS_SITE_NAVIGATION_LOGIN_BLOCKED'),
		message: 'Request blocked for security reasons. Please refresh and try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'INVALID_ORIGIN'),
		message: 'Request blocked for security reasons. Please refresh and try again.'
	},
	{
		match: (e) => codeOrMessageIncludes(e, 'MISSING_OR_NULL_ORIGIN'),
		message: 'Request blocked for security reasons. Please refresh and try again.'
	},

	// ── Polar (payments) ─────────────────────────────────────────────────
	{
		match: (e) => e.message?.includes('Polar customer creation failed') ?? false,
		message: 'Registration failed. Please try again or contact yorick@backlogbox.com'
	},
	{
		match: (e) => e.message?.includes('Checkout creation failed') ?? false,
		message: 'Payment setup failed. Please try again or contact yorick@backlogbox.com'
	},
	{
		match: (e) => e.message?.includes('Product not found') ?? false,
		message: 'The selected plan was not found. Please try again.'
	},

	// ── Misc ─────────────────────────────────────────────────────────────
	{
		match: (e) => e.message?.includes('is not a valid email address') ?? false,
		message: 'Please use a valid email address with a real domain.'
	}
];

/** Normalise to uppercase with underscores replaced by spaces for fuzzy matching. */
function norm(s: string): string {
	return s.toUpperCase().replace(/_/g, ' ');
}

function codeOrMessageIncludes(err: APIError, needle: string): boolean {
	const n = norm(needle);
	const code = (err as APIError & { code?: string }).code ?? '';
	return norm(code).includes(n) || (err.message ? norm(err.message).includes(n) : false);
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
