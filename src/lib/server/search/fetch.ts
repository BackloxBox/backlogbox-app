import { log } from '$lib/server/logger';

/**
 * Retryable status codes:
 * - 429: rate limited
 * - 500-503: transient server errors
 */
function isRetryable(status: number): boolean {
	return status === 429 || (status >= 500 && status <= 503);
}

/**
 * Parse `Retry-After` header value into milliseconds.
 * Supports both seconds (integer) and HTTP-date formats.
 * Returns `null` if missing or unparseable.
 */
function parseRetryAfter(response: Response): number | null {
	const header = response.headers.get('Retry-After');
	if (!header) return null;

	const seconds = Number(header);
	if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;

	const date = Date.parse(header);
	if (!Number.isNaN(date)) {
		const delayMs = date - Date.now();
		return delayMs > 0 ? delayMs : null;
	}

	return null;
}

interface ResilientFetchOptions {
	/** Max retry attempts after the initial request (default: 2) */
	maxRetries?: number;
	/** Base delay in ms, doubled each attempt (default: 500) */
	baseDelayMs?: number;
	/** Cap on delay to prevent excessively long waits (default: 5000) */
	maxDelayMs?: number;
}

/**
 * Fetch wrapper with retry + exponential backoff + jitter.
 *
 * Retries on network errors and retryable HTTP statuses (429, 5xx).
 * Respects `Retry-After` headers on 429 responses.
 * Returns the Response on success or after exhausting retries.
 * Throws only on network errors after all retries are exhausted.
 */
export async function resilientFetch(
	url: string | URL,
	init?: RequestInit,
	options?: ResilientFetchOptions
): Promise<Response> {
	const maxRetries = options?.maxRetries ?? 2;
	const baseDelayMs = options?.baseDelayMs ?? 500;
	const maxDelayMs = options?.maxDelayMs ?? 5000;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, init);

			if (!isRetryable(response.status) || attempt === maxRetries) {
				return response;
			}

			// Retryable status — compute delay
			const retryAfterMs = response.status === 429 ? parseRetryAfter(response) : null;
			const exponentialMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
			const jitterMs = Math.random() * exponentialMs * 0.5;
			const delayMs = retryAfterMs ?? Math.round(exponentialMs + jitterMs);

			log.debug(
				{ url: String(url), status: response.status, attempt, delayMs },
				'resilientFetch retrying'
			);

			await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
		} catch (err) {
			// Network error (DNS, timeout, connection refused, etc.)
			if (attempt === maxRetries) throw err;

			const exponentialMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
			const jitterMs = Math.random() * exponentialMs * 0.5;
			const delayMs = Math.round(exponentialMs + jitterMs);

			log.debug(
				{ url: String(url), err: err instanceof Error ? err.message : err, attempt, delayMs },
				'resilientFetch network error, retrying'
			);

			await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
		}
	}

	// Unreachable — loop always returns or throws on last attempt
	throw new Error('resilientFetch: unreachable');
}
