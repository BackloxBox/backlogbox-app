import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/server/logger', () => ({
	log: { debug: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

// Dynamic import so mocks are in place before module executes.
// Each test file gets its own module instance in vitest, but we
// resetModules between tests to clear the module-level Map state.
let cacheModule: typeof import('./cache');

beforeEach(async () => {
	vi.useFakeTimers();
	vi.resetModules();
	cacheModule = await import('./cache');
});

afterEach(() => {
	vi.useRealTimers();
});

describe('getOrFetch', () => {
	it('calls fetcher on cache miss', async () => {
		const fetcher = vi.fn().mockResolvedValue([{ externalId: '1', title: 'Test' }]);
		const result = await cacheModule.getOrFetch('key:1', 'search', 'test', fetcher);

		expect(fetcher).toHaveBeenCalledOnce();
		expect(result.results).toHaveLength(1);
		expect(result.results[0].title).toBe('Test');
		expect(result.debug?.source).toBe('fetch');
	});

	it('returns cached result on fresh hit', async () => {
		const fetcher = vi.fn().mockResolvedValue([{ externalId: '1', title: 'Cached' }]);

		await cacheModule.getOrFetch('key:fresh', 'search', 'test', fetcher);
		const result = await cacheModule.getOrFetch('key:fresh', 'search', 'test', fetcher);

		expect(fetcher).toHaveBeenCalledOnce(); // not called again
		expect(result.debug?.source).toBe('cache-fresh');
	});

	it('returns stale result and revalidates in background', async () => {
		let callCount = 0;
		const fetcher = vi.fn().mockImplementation(() => {
			callCount++;
			return Promise.resolve([{ externalId: '1', title: `v${callCount}` }]);
		});

		// populate cache with 'trending' tier (30 min stale, 2 hour expire)
		await cacheModule.getOrFetch('key:swr', 'trending', 'test', fetcher);
		expect(callCount).toBe(1);

		// advance past stale but before expire
		vi.advanceTimersByTime(31 * 60 * 1000);

		const result = await cacheModule.getOrFetch('key:swr', 'trending', 'test', fetcher);
		expect(result.debug?.source).toBe('cache-stale');
		expect(result.results[0].title).toBe('v1'); // still old data

		// let background revalidation complete
		await vi.runAllTimersAsync();
		expect(callCount).toBe(2); // fetcher called in background
	});

	it('coalesces concurrent requests for same key', async () => {
		let resolveOuter: (v: Array<{ externalId: string; title: string }>) => void;
		const fetcher = vi.fn().mockReturnValue(
			new Promise<Array<{ externalId: string; title: string }>>((resolve) => {
				resolveOuter = resolve;
			})
		);

		const p1 = cacheModule.getOrFetch('key:coal', 'search', 'test', fetcher);
		const p2 = cacheModule.getOrFetch('key:coal', 'search', 'test', fetcher);

		expect(fetcher).toHaveBeenCalledOnce(); // only one fetch

		resolveOuter!([{ externalId: '1', title: 'Coalesced' }]);
		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1.results[0].title).toBe('Coalesced');
		expect(r2.results[0].title).toBe('Coalesced');
		expect(r2.debug?.source).toBe('coalesced');
	});

	it('propagates fetcher errors and cleans up inflight', async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

		await expect(cacheModule.getOrFetch('key:err', 'search', 'test', fetcher)).rejects.toThrow(
			'Network error'
		);

		// subsequent call retries (not stuck in inflight)
		fetcher.mockResolvedValue([]);
		const result = await cacheModule.getOrFetch('key:err', 'search', 'test', fetcher);
		expect(result.results).toEqual([]);
	});
});

describe('getCacheStats', () => {
	it('returns zeroed stats initially', () => {
		const stats = cacheModule.getCacheStats();
		expect(stats.size).toBe(0);
		expect(stats.hits).toBe(0);
		expect(stats.misses).toBe(0);
		expect(stats.hitRate).toBe('0%');
	});

	it('tracks hits and misses', async () => {
		const fetcher = vi.fn().mockResolvedValue([]);

		await cacheModule.getOrFetch('s:1', 'search', 'test', fetcher);
		await cacheModule.getOrFetch('s:1', 'search', 'test', fetcher);

		const stats = cacheModule.getCacheStats();
		expect(stats.misses).toBe(1);
		expect(stats.hits).toBe(1);
	});
});

describe('eviction', () => {
	it('expired entries are not returned by getCached', async () => {
		const fetcher = vi.fn().mockResolvedValue([
			{
				externalId: '1',
				title: 'T',
				coverUrl: null,
				releaseYear: 2024,
				description: null,
				meta: {}
			}
		]);

		await cacheModule.getOrFetch('exp:1', 'search', 'test', fetcher);
		expect(cacheModule.getCacheStats().size).toBe(1);

		// advance past search expire (5 min)
		vi.advanceTimersByTime(6 * 60 * 1000);

		// expired entry triggers a fresh fetch, not a cache hit
		const result = await cacheModule.getOrFetch('exp:1', 'search', 'test', fetcher);
		expect(result.debug?.source).toBe('fetch');
		expect(fetcher).toHaveBeenCalledTimes(2);
	});
});

describe('discoverKey', () => {
	it('builds key without id', () => {
		expect(cacheModule.discoverKey('trending', 'movie')).toBe('discover:trending:movie');
	});

	it('builds key with id', () => {
		expect(cacheModule.discoverKey('similar', 'book', '42')).toBe('discover:similar:book:42');
	});
});

describe('legacy API', () => {
	it('getCached returns null on miss', () => {
		expect(cacheModule.getCached('movie', 'test')).toBeNull();
	});

	it('setCache + getCached roundtrip', () => {
		const results = [
			{
				externalId: '1',
				title: 'T',
				coverUrl: null,
				releaseYear: 2024,
				description: null,
				meta: {}
			}
		];
		cacheModule.setCache('movie', 'test', results);
		const cached = cacheModule.getCached('movie', 'test');
		expect(cached).toEqual(results);
	});

	it('getCached returns null after expiry', () => {
		const results = [
			{
				externalId: '1',
				title: 'T',
				coverUrl: null,
				releaseYear: 2024,
				description: null,
				meta: {}
			}
		];
		cacheModule.setCache('movie', 'test', results);
		vi.advanceTimersByTime(6 * 60 * 1000); // past 5 min
		expect(cacheModule.getCached('movie', 'test')).toBeNull();
	});

	it('getCached normalizes query case and whitespace', () => {
		const results = [
			{
				externalId: '1',
				title: 'T',
				coverUrl: null,
				releaseYear: 2024,
				description: null,
				meta: {}
			}
		];
		cacheModule.setCache('movie', '  Test  ', results);
		expect(cacheModule.getCached('movie', 'test')).toEqual(results);
	});
});
