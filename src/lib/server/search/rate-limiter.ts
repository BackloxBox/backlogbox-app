import { log } from '$lib/server/logger';

/**
 * Token-bucket rate limiter.
 *
 * Constrains outbound API calls to a provider's documented rate limit.
 * Callers `await limiter.acquire()` before each fetch — if the bucket
 * is empty the call sleeps until a token is available.
 *
 * Tokens refill continuously (not in fixed windows) so bursts are
 * allowed up to `maxTokens` but sustained throughput is capped at
 * `refillPerSecond` req/s.
 */
export class TokenBucket {
	private tokens: number;
	private lastRefill: number;
	private waiting = 0;

	constructor(
		/** Max burst capacity */
		readonly maxTokens: number,
		/** Tokens added per second (sustained rate) */
		readonly refillPerSecond: number,
		/** Label for logging */
		readonly provider: string
	) {
		this.tokens = maxTokens;
		this.lastRefill = Date.now();
	}

	/** Refill tokens based on elapsed time since last refill */
	private refill(): void {
		const now = Date.now();
		const elapsed = (now - this.lastRefill) / 1000;
		this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillPerSecond);
		this.lastRefill = now;
	}

	/**
	 * Wait until a token is available, then consume it.
	 *
	 * Uses a retry loop to handle concurrent waiters correctly:
	 * multiple callers may wake from setTimeout simultaneously,
	 * but only those that find a token available proceed.
	 */
	async acquire(): Promise<void> {
		while (true) {
			this.refill();

			if (this.tokens >= 1) {
				this.tokens -= 1;
				return;
			}

			// Calculate wait time for next token
			const deficit = 1 - this.tokens;
			const waitMs = Math.ceil((deficit / this.refillPerSecond) * 1000);

			this.waiting += 1;
			log.debug({ provider: this.provider, waitMs, waiting: this.waiting }, 'rate limiter waiting');

			await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
			this.waiting -= 1;
		}
	}

	/** Current state for debug/observability */
	get stats(): { available: number; waiting: number; maxTokens: number; provider: string } {
		this.refill();
		return {
			available: Math.floor(this.tokens),
			waiting: this.waiting,
			maxTokens: this.maxTokens,
			provider: this.provider
		};
	}
}

// ---------------------------------------------------------------------------
// Per-provider singletons
// ---------------------------------------------------------------------------

/** TMDB: 40 req / 10s = 4 req/s sustained, 40 burst */
export const tmdbLimiter = new TokenBucket(40, 4, 'tmdb');

/** IGDB: 4 req/s (Twitch default for client-credentials) */
export const igdbLimiter = new TokenBucket(4, 4, 'igdb');

/** OpenLibrary: courtesy limit ~5 req/s (no official docs, but be polite) */
export const openLibraryLimiter = new TokenBucket(5, 5, 'openlibrary');

/**
 * Snapshot stats for all providers. Used by debug overlay.
 */
export function getRateLimiterStats(): Array<{
	provider: string;
	available: number;
	waiting: number;
	maxTokens: number;
}> {
	return [tmdbLimiter.stats, igdbLimiter.stats, openLibraryLimiter.stats];
}
