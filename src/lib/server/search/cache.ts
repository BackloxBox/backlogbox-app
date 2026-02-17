import { dev } from '$app/environment';
import { log } from '$lib/server/logger';
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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const cache = new Map<string, CacheEntry>();

/** In-flight requests for coalescing (multiple callers await same promise) */
const inflight = new Map<string, Promise<SearchResult[]>>();

/** Cumulative stats */
const stats = {
	hits: 0,
	misses: 0,
	staleHits: 0,
	coalescedRequests: 0,
	backgroundRevalidations: 0,
	evictions: 0
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Prune all expired entries (past expiresAt) */
function prune(): void {
	const now = Date.now();
	let evicted = 0;
	for (const [key, entry] of cache) {
		if (entry.expiresAt <= now) {
			cache.delete(key);
			evicted++;
		}
	}
	stats.evictions += evicted;
	if (evicted > 0) {
		log.debug({ evicted, remaining: cache.size }, 'cache prune');
	}
}

/**
 * Store a result in the cache.
 */
function set(key: string, results: SearchResult[], tier: CacheTier): void {
	if (cache.size >= MAX_ENTRIES) prune();
	// Still full after prune — evict oldest entry
	if (cache.size >= MAX_ENTRIES) {
		let oldestKey: string | undefined;
		let oldestTime = Infinity;
		for (const [k, e] of cache) {
			if (e.createdAt < oldestTime) {
				oldestTime = e.createdAt;
				oldestKey = k;
			}
		}
		if (oldestKey) {
			cache.delete(oldestKey);
			stats.evictions++;
		}
	}

	const now = Date.now();
	const config = TIER_CONFIG[tier];
	cache.set(key, {
		results,
		createdAt: now,
		staleAt: now + config.staleMs,
		expiresAt: now + config.expireMs
	});

	log.debug({ key, tier, size: cache.size }, 'cache set');
}

// ---------------------------------------------------------------------------
// Public API: getOrFetch (coalescing + SWR)
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
 * @param provider Label for logging/debug
 * @param fetcher  Function to call on miss
 */
export async function getOrFetch(
	key: string,
	tier: CacheTier,
	provider: string,
	fetcher: () => Promise<SearchResult[]>
): Promise<FetchResult> {
	const now = Date.now();
	const entry = cache.get(key);

	// --- Cache fresh hit ---
	if (entry && now < entry.staleAt) {
		stats.hits++;
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

	const promise = fetcher().then((results) => {
		set(key, results, tier);
		inflight.delete(key);
		return results;
	});

	// Register for coalescing before awaiting
	inflight.set(key, promise);

	try {
		const results = await promise;
		const fetchDurationMs = Math.round(performance.now() - start);
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
	const promise = fetcher().then((results) => {
		set(key, results, tier);
		inflight.delete(key);
		log.debug({ key, provider }, 'background revalidation complete');
		return results;
	});

	inflight.set(key, promise);

	try {
		await promise;
	} catch (err) {
		inflight.delete(key);
		log.warn({ err, key, provider }, 'background revalidation failed');
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
	const entry = cache.get(key);
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		cache.delete(key);
		return null;
	}
	stats.hits++;
	return entry.results;
}

/** @deprecated Use `getOrFetch()` instead */
export function setCache(mediaType: string, query: string, results: SearchResult[]): void {
	set(searchKey(mediaType, query), results, 'search');
}

// ---------------------------------------------------------------------------
// Cache key builders (for callers of getOrFetch)
// ---------------------------------------------------------------------------

/** Cache key for discover trending/similar */
export function discoverKey(category: string, mediaType: string, id?: string): string {
	return id ? `discover:${category}:${mediaType}:${id}` : `discover:${category}:${mediaType}`;
}

// ---------------------------------------------------------------------------
// Stats / observability
// ---------------------------------------------------------------------------

export function getCacheStats(): CacheStats {
	const total = stats.hits + stats.staleHits + stats.misses;
	return {
		size: cache.size,
		hits: stats.hits,
		misses: stats.misses,
		staleHits: stats.staleHits,
		coalescedRequests: stats.coalescedRequests,
		backgroundRevalidations: stats.backgroundRevalidations,
		evictions: stats.evictions,
		hitRate: total > 0 ? `${Math.round(((stats.hits + stats.staleHits) / total) * 100)}%` : '0%'
	};
}
