import { dev } from '$app/environment';
import { log } from '$lib/server/logger';
import { getRedis } from '$lib/server/redis';
import { recordApiCall, recordApiError, recordCacheHit } from './metrics';
import type { SearchResult } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
	results: SearchResult[];
	/** Timestamp when this entry was stored */
	createdAt: number;
	/** After this, return cached but revalidate in background */
	staleAt: number;
	/** After this, entry is truly expired — block on fresh fetch */
	expiresAt: number;
}

/** Debug metadata attached to responses in dev mode */
export interface CacheDebugMeta {
	source: 'cache-fresh' | 'cache-stale' | 'fetch' | 'coalesced';
	key: string;
	ageMs: number | null;
	fetchDurationMs: number | null;
	provider: string;
}

export interface CacheStats {
	size: number;
	hits: number;
	misses: number;
	staleHits: number;
	coalescedRequests: number;
	backgroundRevalidations: number;
	evictions: number;
	hitRate: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 500;

/** Search cache: short-lived, no SWR */
const SEARCH_STALE_MS = 5 * 60 * 1000; // 5 min
const SEARCH_EXPIRE_MS = 5 * 60 * 1000; // same — no SWR window

/** Discover trending: changes slowly */
const TRENDING_STALE_MS = 30 * 60 * 1000; // 30 min
const TRENDING_EXPIRE_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Discover similar: changes very slowly */
const SIMILAR_STALE_MS = 30 * 60 * 1000; // 30 min
const SIMILAR_EXPIRE_MS = 4 * 60 * 60 * 1000; // 4 hours

export type CacheTier = 'search' | 'trending' | 'similar';

const TIER_CONFIG: Record<CacheTier, { staleMs: number; expireMs: number }> = {
	search: { staleMs: SEARCH_STALE_MS, expireMs: SEARCH_EXPIRE_MS },
	trending: { staleMs: TRENDING_STALE_MS, expireMs: TRENDING_EXPIRE_MS },
	similar: { staleMs: SIMILAR_STALE_MS, expireMs: SIMILAR_EXPIRE_MS }
};

/** Prefix for all cache keys in Redis (avoids collision with metrics etc.) */
const REDIS_PREFIX = 'cache:';

// ---------------------------------------------------------------------------
// State (in-memory — per-replica)
// ---------------------------------------------------------------------------

/** In-memory fallback cache, used when Redis is unavailable */
const memCache = new Map<string, CacheEntry>();

/** In-flight requests for coalescing (multiple callers await same promise) */
const inflight = new Map<string, Promise<SearchResult[]>>();

/** Cumulative stats (per-replica) */
const stats = {
	hits: 0,
	misses: 0,
	staleHits: 0,
	coalescedRequests: 0,
	backgroundRevalidations: 0,
	evictions: 0
};

// ---------------------------------------------------------------------------
// Storage abstraction — Redis with in-memory fallback
// ---------------------------------------------------------------------------

async function cacheGet(key: string): Promise<CacheEntry | null> {
	const redis = getRedis();
	if (redis) {
		try {
			const raw = await redis.get(REDIS_PREFIX + key);
			if (!raw) return null;
			return JSON.parse(raw) as CacheEntry;
		} catch (err) {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'redis cache get failed');
			// Fall through to memCache
		}
	}

	return memCache.get(key) ?? null;
}

async function cacheSet(key: string, entry: CacheEntry): Promise<void> {
	const redis = getRedis();
	const ttlMs = entry.expiresAt - Date.now();
	if (ttlMs <= 0) return;

	if (redis) {
		try {
			await redis.set(REDIS_PREFIX + key, JSON.stringify(entry), 'PX', ttlMs);
			log.debug({ key, ttlMs }, 'redis cache set');
			return;
		} catch (err) {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'redis cache set failed');
			// Fall through to memCache
		}
	}

	// In-memory fallback
	pruneMemCache();
	if (memCache.size >= MAX_ENTRIES) {
		let oldestKey: string | undefined;
		let oldestTime = Infinity;
		for (const [k, e] of memCache) {
			if (e.createdAt < oldestTime) {
				oldestTime = e.createdAt;
				oldestKey = k;
			}
		}
		if (oldestKey) {
			memCache.delete(oldestKey);
			stats.evictions++;
		}
	}
	memCache.set(key, entry);
}

/** Prune all expired entries from in-memory cache */
function pruneMemCache(): void {
	if (memCache.size < MAX_ENTRIES) return;
	const now = Date.now();
	let evicted = 0;
	for (const [key, entry] of memCache) {
		if (entry.expiresAt <= now) {
			memCache.delete(key);
			evicted++;
		}
	}
	stats.evictions += evicted;
	if (evicted > 0) {
		log.debug({ evicted, remaining: memCache.size }, 'memcache prune');
	}
}

// ---------------------------------------------------------------------------
// Public API: getOrFetch (coalescing + SWR + metrics)
// ---------------------------------------------------------------------------

export interface FetchResult {
	results: SearchResult[];
	debug: CacheDebugMeta | null;
}

/**
 * Unified cache access with request coalescing and stale-while-revalidate.
 *
 * 1. **Cache fresh** (`now < staleAt`): return immediately
 * 2. **Cache stale** (`staleAt < now < expiresAt`): return stale, revalidate in background
 * 3. **Cache miss / expired**: fetch, with in-flight coalescing
 *
 * @param key      Unique cache key
 * @param tier     Determines TTL/SWR window
 * @param provider Label for logging/debug/metrics
 * @param fetcher  Function to call on miss
 */
export async function getOrFetch(
	key: string,
	tier: CacheTier,
	provider: string,
	fetcher: () => Promise<SearchResult[]>
): Promise<FetchResult> {
	const now = Date.now();
	const entry = await cacheGet(key);

	// --- Cache fresh hit ---
	if (entry && now < entry.staleAt) {
		stats.hits++;
		recordCacheHit(provider);
		log.debug({ key, provider, ageMs: now - entry.createdAt }, 'cache hit (fresh)');
		return {
			results: entry.results,
			debug: dev
				? {
						source: 'cache-fresh',
						key,
						ageMs: now - entry.createdAt,
						fetchDurationMs: null,
						provider
					}
				: null
		};
	}

	// --- Cache stale hit (SWR) ---
	if (entry && now < entry.expiresAt) {
		stats.staleHits++;
		recordCacheHit(provider);
		log.debug({ key, provider, ageMs: now - entry.createdAt }, 'cache hit (stale, revalidating)');

		// Fire-and-forget background revalidation
		void revalidateInBackground(key, tier, provider, fetcher);

		return {
			results: entry.results,
			debug: dev
				? {
						source: 'cache-stale',
						key,
						ageMs: now - entry.createdAt,
						fetchDurationMs: null,
						provider
					}
				: null
		};
	}

	// --- Miss: check in-flight coalescing ---
	const existing = inflight.get(key);
	if (existing) {
		stats.coalescedRequests++;
		log.debug({ key, provider }, 'cache coalesced (awaiting in-flight)');
		const results = await existing;
		return {
			results,
			debug: dev ? { source: 'coalesced', key, ageMs: null, fetchDurationMs: null, provider } : null
		};
	}

	// --- Miss: fetch and store ---
	stats.misses++;
	const start = performance.now();

	const promise = fetcher().then(async (results) => {
		const config = TIER_CONFIG[tier];
		const fetchNow = Date.now();
		await cacheSet(key, {
			results,
			createdAt: fetchNow,
			staleAt: fetchNow + config.staleMs,
			expiresAt: fetchNow + config.expireMs
		});
		inflight.delete(key);
		return results;
	});

	// Register for coalescing before awaiting
	inflight.set(key, promise);

	try {
		const results = await promise;
		const fetchDurationMs = Math.round(performance.now() - start);
		recordApiCall(provider, fetchDurationMs);
		log.debug(
			{ key, provider, fetchDurationMs, resultCount: results.length },
			'cache miss (fetched)'
		);

		return {
			results,
			debug: dev ? { source: 'fetch', key, ageMs: null, fetchDurationMs, provider } : null
		};
	} catch (err) {
		inflight.delete(key);
		recordApiError(provider);
		throw err;
	}
}

/** Background revalidation for SWR — errors are swallowed and logged */
async function revalidateInBackground(
	key: string,
	tier: CacheTier,
	provider: string,
	fetcher: () => Promise<SearchResult[]>
): Promise<void> {
	// Don't double-revalidate if already in-flight
	if (inflight.has(key)) return;

	stats.backgroundRevalidations++;
	const start = performance.now();
	const promise = fetcher().then(async (results) => {
		const config = TIER_CONFIG[tier];
		const now = Date.now();
		await cacheSet(key, {
			results,
			createdAt: now,
			staleAt: now + config.staleMs,
			expiresAt: now + config.expireMs
		});
		inflight.delete(key);
		const latencyMs = Math.round(performance.now() - start);
		recordApiCall(provider, latencyMs);
		log.debug({ key, provider }, 'background revalidation complete');
		return results;
	});

	inflight.set(key, promise);

	try {
		await promise;
	} catch (err) {
		inflight.delete(key);
		recordApiError(provider);
		log.warn({ err, key, provider }, 'background revalidation failed');
	}
}

// ---------------------------------------------------------------------------
// Generic detail cache (for non-SearchResult[] values)
// ---------------------------------------------------------------------------

/** 24 hours — movie credits, series details, book descriptions rarely change */
const DETAIL_EXPIRE_MS = 24 * 60 * 60 * 1000;
const DETAIL_MAX_ENTRIES = 200;

interface DetailEntry<T> {
	value: T;
	expiresAt: number;
}

const detailMemCache = new Map<string, DetailEntry<unknown>>();
const detailInflight = new Map<string, Promise<unknown>>();

async function detailGet<T>(key: string): Promise<DetailEntry<T> | null> {
	const redis = getRedis();
	if (redis) {
		try {
			const raw = await redis.get(REDIS_PREFIX + key);
			if (!raw) return null;
			return JSON.parse(raw) as DetailEntry<T>;
		} catch (err) {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'redis detail get failed');
		}
	}
	return (detailMemCache.get(key) as DetailEntry<T> | undefined) ?? null;
}

async function detailSet<T>(key: string, entry: DetailEntry<T>): Promise<void> {
	const ttlMs = entry.expiresAt - Date.now();
	if (ttlMs <= 0) return;

	const redis = getRedis();
	if (redis) {
		try {
			await redis.set(REDIS_PREFIX + key, JSON.stringify(entry), 'PX', ttlMs);
			return;
		} catch (err) {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'redis detail set failed');
		}
	}

	// In-memory fallback — evict oldest if full
	if (detailMemCache.size >= DETAIL_MAX_ENTRIES) {
		const now = Date.now();
		for (const [k, e] of detailMemCache) {
			if (e.expiresAt <= now) detailMemCache.delete(k);
		}
		if (detailMemCache.size >= DETAIL_MAX_ENTRIES) {
			let oldestKey: string | undefined;
			let oldestTime = Infinity;
			for (const [k, e] of detailMemCache) {
				if (e.expiresAt < oldestTime) {
					oldestTime = e.expiresAt;
					oldestKey = k;
				}
			}
			if (oldestKey) detailMemCache.delete(oldestKey);
		}
	}
	detailMemCache.set(key, entry);
}

/**
 * Generic cache-through with request coalescing for detail/singleton values.
 *
 * Same pattern as `getOrFetch` but for arbitrary JSON-serializable types
 * (movie details, book descriptions, etc.) instead of `SearchResult[]`.
 *
 * @param key      Unique cache key (e.g. `detail:movie:12345`)
 * @param provider Label for metrics
 * @param fetcher  Function to call on miss — may return `null` on upstream error
 */
export async function getOrFetchValue<T>(
	key: string,
	provider: string,
	fetcher: () => Promise<T>
): Promise<T> {
	const entry = await detailGet<T>(key);

	if (entry && entry.expiresAt > Date.now()) {
		recordCacheHit(provider);
		return entry.value;
	}

	// Coalesce concurrent requests
	const existing = detailInflight.get(key);
	if (existing) return existing as Promise<T>;

	const start = performance.now();
	const promise = fetcher().then(async (value) => {
		await detailSet(key, { value, expiresAt: Date.now() + DETAIL_EXPIRE_MS });
		detailInflight.delete(key);
		const latencyMs = Math.round(performance.now() - start);
		recordApiCall(provider, latencyMs);
		return value;
	});

	detailInflight.set(key, promise);

	try {
		return await promise;
	} catch (err) {
		detailInflight.delete(key);
		recordApiError(provider);
		throw err;
	}
}

// ---------------------------------------------------------------------------
// Legacy API (backward-compatible for search.remote.ts)
// ---------------------------------------------------------------------------

function searchKey(mediaType: string, query: string): string {
	return `search:${mediaType}:${query.toLowerCase().trim()}`;
}

/** @deprecated Use `getOrFetch()` instead */
export function getCached(mediaType: string, query: string): SearchResult[] | null {
	const key = searchKey(mediaType, query);
	// Legacy API is sync — only reads from memCache (not Redis)
	const entry = memCache.get(key);
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		memCache.delete(key);
		return null;
	}
	stats.hits++;
	return entry.results;
}

/** @deprecated Use `getOrFetch()` instead */
export function setCache(mediaType: string, query: string, results: SearchResult[]): void {
	const key = searchKey(mediaType, query);
	const now = Date.now();
	const config = TIER_CONFIG.search;
	memCache.set(key, {
		results,
		createdAt: now,
		staleAt: now + config.staleMs,
		expiresAt: now + config.expireMs
	});
}

// ---------------------------------------------------------------------------
// Cache key builders (for callers of getOrFetch)
// ---------------------------------------------------------------------------

/** Cache key for discover trending/similar */
export function discoverKey(category: string, mediaType: string, id?: string): string {
	return id ? `discover:${category}:${mediaType}:${id}` : `discover:${category}:${mediaType}`;
}

// ---------------------------------------------------------------------------
// Stats / observability (per-replica)
// ---------------------------------------------------------------------------

export function getCacheStats(): CacheStats {
	const total = stats.hits + stats.staleHits + stats.misses;
	return {
		size: memCache.size,
		hits: stats.hits,
		misses: stats.misses,
		staleHits: stats.staleHits,
		coalescedRequests: stats.coalescedRequests,
		backgroundRevalidations: stats.backgroundRevalidations,
		evictions: stats.evictions,
		hitRate: total > 0 ? `${Math.round(((stats.hits + stats.staleHits) / total) * 100)}%` : '0%'
	};
}
