import type { SearchResult } from './types';

interface CacheEntry {
	results: SearchResult[];
	expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DISCOVER_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();

function searchKey(mediaType: string, query: string): string {
	return `search:${mediaType}:${query.toLowerCase().trim()}`;
}

/** Prune expired entries (called on insert when nearing capacity) */
function prune() {
	const now = Date.now();
	for (const [key, entry] of cache) {
		if (entry.expiresAt <= now) cache.delete(key);
	}
}

function get(key: string): SearchResult[] | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		cache.delete(key);
		return null;
	}
	return entry.results;
}

function set(key: string, results: SearchResult[], ttlMs: number): void {
	if (cache.size >= MAX_ENTRIES) prune();
	// If still full after prune, skip caching rather than growing unbounded
	if (cache.size >= MAX_ENTRIES) return;

	cache.set(key, {
		results,
		expiresAt: Date.now() + ttlMs
	});
}

// --- Search cache (backward-compatible) ---

export function getCached(mediaType: string, query: string): SearchResult[] | null {
	return get(searchKey(mediaType, query));
}

export function setCache(mediaType: string, query: string, results: SearchResult[]): void {
	set(searchKey(mediaType, query), results, DEFAULT_TTL_MS);
}

// --- Discover cache (longer TTL, arbitrary keys) ---

/** Cache key for discover endpoints: `discover:{category}:{mediaType}` or `discover:{category}:{mediaType}:{id}` */
function discoverKey(category: string, mediaType: string, id?: string): string {
	return id ? `discover:${category}:${mediaType}:${id}` : `discover:${category}:${mediaType}`;
}

export function getDiscoverCached(
	category: string,
	mediaType: string,
	id?: string
): SearchResult[] | null {
	return get(discoverKey(category, mediaType, id));
}

export function setDiscoverCache(
	category: string,
	mediaType: string,
	results: SearchResult[],
	id?: string
): void {
	set(discoverKey(category, mediaType, id), results, DISCOVER_TTL_MS);
}
