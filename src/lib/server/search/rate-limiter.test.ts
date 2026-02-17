import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$lib/server/logger', () => ({
	log: { debug: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

import { TokenBucket } from './rate-limiter';

describe('TokenBucket', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts with maxTokens available', () => {
		const bucket = new TokenBucket(10, 2, 'test');
		expect(bucket.stats.available).toBe(10);
		expect(bucket.stats.waiting).toBe(0);
	});

	it('acquire consumes a token synchronously when available', async () => {
		const bucket = new TokenBucket(3, 1, 'test');
		await bucket.acquire();
		expect(bucket.stats.available).toBe(2);
	});

	it('drains all tokens with sequential acquires', async () => {
		const bucket = new TokenBucket(2, 1, 'test');
		await bucket.acquire();
		await bucket.acquire();
		expect(bucket.stats.available).toBe(0);
	});

	it('refills tokens over time', async () => {
		const bucket = new TokenBucket(5, 2, 'test'); // 2 tokens/sec
		// drain all
		for (let i = 0; i < 5; i++) await bucket.acquire();
		expect(bucket.stats.available).toBe(0);

		// advance 1 second -> should refill 2 tokens
		vi.advanceTimersByTime(1000);
		expect(bucket.stats.available).toBe(2);
	});

	it('does not refill beyond maxTokens', async () => {
		const bucket = new TokenBucket(3, 10, 'test'); // 10/sec but max 3
		vi.advanceTimersByTime(5000);
		expect(bucket.stats.available).toBe(3);
	});

	it('acquire waits when bucket is empty', async () => {
		const bucket = new TokenBucket(1, 1, 'test');
		await bucket.acquire(); // drain

		let resolved = false;
		const promise = bucket.acquire().then(() => {
			resolved = true;
		});

		// not yet resolved
		expect(resolved).toBe(false);

		// advance enough for 1 token to refill
		await vi.advanceTimersByTimeAsync(1000);
		await promise;

		expect(resolved).toBe(true);
	});

	it('stats reports provider name', () => {
		const bucket = new TokenBucket(5, 1, 'tmdb');
		expect(bucket.stats.provider).toBe('tmdb');
		expect(bucket.stats.maxTokens).toBe(5);
	});
});
