import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/server/logger', () => ({
	log: { debug: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

// ---------------------------------------------------------------------------
// Mock Redis — in-memory Map that behaves like ioredis for get/set
// ---------------------------------------------------------------------------

const redisStore = new Map<string, { value: string; expiresAt: number }>();

const mockRedis = {
	get: vi.fn(async (key: string) => {
		const entry = redisStore.get(key);
		if (!entry) return null;
		if (entry.expiresAt <= Date.now()) {
			redisStore.delete(key);
			return null;
		}
		return entry.value;
	}),
	set: vi.fn(async (key: string, value: string, _mode: string, ttlMs: number) => {
		redisStore.set(key, { value, expiresAt: Date.now() + ttlMs });
		return 'OK';
	})
};

vi.mock('$lib/server/redis', () => ({
	getRedis: () => mockRedis
}));

// Mock metrics — we just verify they're called, not their Redis internals
const mockRecordCacheHit = vi.fn();
const mockRecordApiCall = vi.fn();
const mockRecordApiError = vi.fn();

vi.mock('./metrics', () => ({
	recordCacheHit: (...args: unknown[]) => mockRecordCacheHit(...args),
	recordApiCall: (...args: unknown[]) => mockRecordApiCall(...args),
	recordApiError: (...args: unknown[]) => mockRecordApiError(...args)
}));

// Dynamic import so mocks are in place before module executes.
let cacheModule: typeof import('./cache');

beforeEach(async () => {
	vi.useFakeTimers();
	vi.resetModules();
	redisStore.clear();
	mockRedis.get.mockClear();
	mockRedis.set.mockClear();
	mockRecordCacheHit.mockClear();
	mockRecordApiCall.mockClear();
	mockRecordApiError.mockClear();
	cacheModule = await import('./cache');
});

afterEach(() => {
	vi.useRealTimers();
});

describe('getOrFetch', () => {
	it('calls fetcher on cache miss and stores in redis', async () => {
		const fetcher = vi.fn().mockResolvedValue([{ externalId: '1', title: 'Test' }]);
		const result = await cacheModule.getOrFetch('key:1', 'search', 'tmdb', fetcher);

		expect(fetcher).toHaveBeenCalledOnce();
		expect(result.results).toHaveLength(1);
		expect(result.results[0].title).toBe('Test');
		expect(result.debug?.source).toBe('fetch');
		// Verify written to redis
		expect(mockRedis.set).toHaveBeenCalledOnce();
		expect(mockRedis.set.mock.calls[0][0]).toBe('cache:key:1');
		// Verify metrics recorded
		expect(mockRecordApiCall).toHaveBeenCalledWith('tmdb', expect.any(Number));
	});

	it('returns cached result on fresh hit from redis', async () => {
		const fetcher = vi.fn().mockResolvedValue([{ externalId: '1', title: 'Cached' }]);

		await cacheModule.getOrFetch('key:fresh', 'search', 'tmdb', fetcher);
		const result = await cacheModule.getOrFetch('key:fresh', 'search', 'tmdb', fetcher);

		expect(fetcher).toHaveBeenCalledOnce(); // not called again
		expect(result.debug?.source).toBe('cache-fresh');
		expect(mockRedis.get).toHaveBeenCalled();
		expect(mockRecordCacheHit).toHaveBeenCalledWith('tmdb');
	});

	it('returns stale result and revalidates in background', async () => {
		let callCount = 0;
		const fetcher = vi.fn().mockImplementation(() => {
			callCount++;
			return Promise.resolve([{ externalId: '1', title: `v${callCount}` }]);
		});

		// populate cache with 'trending' tier (30 min stale, 2 hour expire)
		await cacheModule.getOrFetch('key:swr', 'trending', 'tmdb', fetcher);
		expect(callCount).toBe(1);

		// advance past stale but before expire
		vi.advanceTimersByTime(31 * 60 * 1000);

		const result = await cacheModule.getOrFetch('key:swr', 'trending', 'tmdb', fetcher);
		expect(result.debug?.source).toBe('cache-stale');
		expect(result.results[0].title).toBe('v1'); // still old data
		expect(mockRecordCacheHit).toHaveBeenCalledWith('tmdb');

		// let background revalidation complete
		await vi.runAllTimersAsync();
		expect(callCount).toBe(2); // fetcher called in background
	});

	it('coalesces concurrent requests for same key', async () => {
		let resolveOuter: (v: Array<{ externalId: string; title: string }>) => void;
		const fetcherPromise = new Promise<Array<{ externalId: string; title: string }>>((resolve) => {
			resolveOuter = resolve;
		});
		const fetcher = vi.fn().mockReturnValue(fetcherPromise);

		// Start both requests — they'll both await cacheGet (async) first
		const p1 = cacheModule.getOrFetch('key:coal', 'search', 'tmdb', fetcher);
		// Flush microtasks so p1's cacheGet resolves and it reaches the fetch/inflight section
		await vi.advanceTimersByTimeAsync(0);
		const p2 = cacheModule.getOrFetch('key:coal', 'search', 'tmdb', fetcher);

		// p1 should have called fetcher, p2 should coalesce onto p1's inflight
		expect(fetcher).toHaveBeenCalledOnce();

		resolveOuter!([{ externalId: '1', title: 'Coalesced' }]);
		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1.results[0].title).toBe('Coalesced');
		expect(r2.results[0].title).toBe('Coalesced');
		expect(r2.debug?.source).toBe('coalesced');
	});

	it('propagates fetcher errors, cleans up inflight, records error metric', async () => {
		const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

		await expect(cacheModule.getOrFetch('key:err', 'search', 'tmdb', fetcher)).rejects.toThrow(
			'Network error'
		);
		expect(mockRecordApiError).toHaveBeenCalledWith('tmdb');

		// subsequent call retries (not stuck in inflight)
		fetcher.mockResolvedValue([]);
		const result = await cacheModule.getOrFetch('key:err', 'search', 'tmdb', fetcher);
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
	it('expired entries trigger fresh fetch', async () => {
		const fetcher = vi.fn().mockResolvedValue([
			{
				externalId: '1',
				title: 'T',
				coverUrl: null,
				releaseYear: 2024,
				releaseDate: null,
				description: null,
				meta: {}
			}
		]);

		await cacheModule.getOrFetch('exp:1', 'search', 'test', fetcher);

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
				releaseDate: null,
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
				releaseDate: null,
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
				releaseDate: null,
				description: null,
				meta: {}
			}
		];
		cacheModule.setCache('movie', '  Test  ', results);
		expect(cacheModule.getCached('movie', 'test')).toEqual(results);
	});
});
