import type { SearchResult } from './types';

interface CacheEntry {
	results: SearchResult[];
	expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();

function cacheKey(mediaType: string, query: string): string {
	return `${mediaType}:${query.toLowerCase().trim()}`;
}

/** Prune expired entries (called on insert when nearing capacity) */
function prune() {
	const now = Date.now();
	for (const [key, entry] of cache) {
		if (entry.expiresAt <= now) cache.delete(key);
	}
}

export function getCached(mediaType: string, query: string): SearchResult[] | null {
	const entry = cache.get(cacheKey(mediaType, query));
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		cache.delete(cacheKey(mediaType, query));
		return null;
	}
	return entry.results;
}

export function setCache(mediaType: string, query: string, results: SearchResult[]): void {
	if (cache.size >= MAX_ENTRIES) prune();
	// If still full after prune, skip caching rather than growing unbounded
	if (cache.size >= MAX_ENTRIES) return;

	cache.set(cacheKey(mediaType, query), {
		results,
		expiresAt: Date.now() + TTL_MS
	});
}
