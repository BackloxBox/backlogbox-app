import * as v from 'valibot';
import { query } from '$app/server';
import { dev } from '$app/environment';
import { requireSubscription } from '$lib/server/auth-guard';
import {
	getOrFetch,
	discoverKey,
	getCacheStats,
	type CacheDebugMeta,
	type CacheStats
} from '$lib/server/search/cache';
import { getRateLimiterStats } from '$lib/server/search/rate-limiter';
import { fetchTrendingMovies, fetchSimilarMovies } from '$lib/server/search/tmdb';
import { fetchTrendingSeries, fetchSimilarSeries } from '$lib/server/search/tmdb';
import { fetchTrendingGames, fetchSimilarGames } from '$lib/server/search/igdb';
import { fetchTrendingBooks, fetchBooksBySubject } from '$lib/server/search/openlibrary';
import { fetchTopPodcasts } from '$lib/server/search/apple-podcasts';
import { getSeedItems, getUserExternalIds } from '$lib/server/db/queries';
import { slugToMediaType, MEDIA_TYPE_SLUGS } from '$lib/types';
import type { SearchResult } from '$lib/server/search';
import { error } from '@sveltejs/kit';
import { log } from '$lib/server/logger';

const slugSchema = v.picklist([...MEDIA_TYPE_SLUGS]);

// ---------------------------------------------------------------------------
// Debug wrapper type
// ---------------------------------------------------------------------------

export type DiscoverDebug = CacheDebugMeta;

export interface TrendingResponse {
	data: SearchResult[];
	_debug: DiscoverDebug | null;
}

export type RecommendationGroup = {
	seedTitle: string;
	items: SearchResult[];
	_debug: DiscoverDebug | null;
};

export interface RecommendationsResponse {
	data: RecommendationGroup[];
	_debug: null; // top-level debug reserved for future use
}

// ---------------------------------------------------------------------------
// Debug stats endpoint (dev-only, but safe to call in prod — returns null)
// ---------------------------------------------------------------------------

export interface DebugStats {
	cache: CacheStats;
	rateLimiters: Array<{
		provider: string;
		available: number;
		waiting: number;
		maxTokens: number;
	}>;
}

export const getDebugStats = query(async (): Promise<DebugStats | null> => {
	requireSubscription();
	if (!dev) return null;
	return {
		cache: getCacheStats(),
		rateLimiters: getRateLimiterStats()
	};
});

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

type TrendingFetcher = () => Promise<SearchResult[]>;

const trendingFetchers: Record<string, TrendingFetcher> = {
	movie: fetchTrendingMovies,
	series: fetchTrendingSeries,
	game: fetchTrendingGames,
	book: fetchTrendingBooks,
	podcast: fetchTopPodcasts
};

const TRENDING_PROVIDERS: Record<string, string> = {
	movie: 'tmdb',
	series: 'tmdb',
	game: 'igdb',
	book: 'openlibrary',
	podcast: 'apple'
};

/** Fetch trending items for a media type, with caching + coalescing + SWR */
export const getTrending = query(slugSchema, async (slug): Promise<TrendingResponse> => {
	const userId = requireSubscription();
	const type = slugToMediaType(slug);
	if (!type) error(400, `Invalid slug: ${slug}`);

	const fetcher = trendingFetchers[type];
	if (!fetcher) return { data: [], _debug: null };

	const key = discoverKey('trending', type);
	const provider = TRENDING_PROVIDERS[type] ?? type;

	try {
		const { results, debug } = await getOrFetch(key, 'trending', provider, fetcher);
		const filtered = await filterTracked(results, userId, type);
		return { data: filtered, _debug: debug };
	} catch (err) {
		log.error({ err, mediaType: type }, 'trending fetch failed');
		return { data: [], _debug: null };
	}
});

// ---------------------------------------------------------------------------
// Recommendations ("because you liked X")
// ---------------------------------------------------------------------------

/** Fetch personalized recommendations based on user's recent items */
export const getRecommendations = query(
	slugSchema,
	async (slug): Promise<RecommendationsResponse> => {
		const userId = requireSubscription();
		const type = slugToMediaType(slug);
		if (!type) error(400, `Invalid slug: ${slug}`);

		// Podcasts: no similar API available
		if (type === 'podcast') return { data: [], _debug: null };

		const provider = TRENDING_PROVIDERS[type] ?? type;

		try {
			const rawSeeds = await getSeedItems(userId, type, 3);
			if (rawSeeds.length === 0) return { data: [], _debug: null };

			// Deduplicate seeds by title (e.g. "Fallout S1" and "Fallout S2" share a title)
			const seenTitles = new Set<string>();
			const seeds = rawSeeds.filter((s) => {
				const key = s.title.toLowerCase();
				if (seenTitles.has(key)) return false;
				seenTitles.add(key);
				return true;
			});

			const trackedIds = await getUserExternalIds(userId, type);
			const groups: RecommendationGroup[] = [];

			for (const seed of seeds) {
				const cacheKey = discoverKey('similar', type, seed.externalId);

				const { results: items, debug } = await getOrFetch(cacheKey, 'similar', provider, () =>
					fetchSimilarForType(type, seed)
				);

				// Filter out already-tracked items
				const filtered =
					type === 'book'
						? items.filter((r) => !trackedIds.has(r.title.toLowerCase()))
						: items.filter((r) => !trackedIds.has(r.externalId));

				if (filtered.length > 0) {
					groups.push({ seedTitle: seed.title, items: filtered, _debug: debug });
				}
			}

			return { data: groups, _debug: null };
		} catch (err) {
			log.error({ err, mediaType: type }, 'recommendations fetch failed');
			return { data: [], _debug: null };
		}
	}
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchSimilarForType(
	type: import('$lib/types').MediaType,
	seed: { externalId: string; genre: string | null }
): Promise<SearchResult[]> {
	switch (type) {
		case 'movie':
			return fetchSimilarMovies(Number(seed.externalId));
		case 'series':
			return fetchSimilarSeries(Number(seed.externalId));
		case 'game':
			return fetchSimilarGames([Number(seed.externalId)]);
		case 'book': {
			// Use first genre from the comma-separated genre string
			const genre = seed.genre?.split(',')[0]?.trim();
			if (!genre) return [];
			return fetchBooksBySubject(genre);
		}
		case 'podcast':
			return [];
	}
}

async function filterTracked(
	results: SearchResult[],
	userId: string,
	type: import('$lib/types').MediaType
): Promise<SearchResult[]> {
	const trackedIds = await getUserExternalIds(userId, type);
	if (trackedIds.size === 0) return results;

	return type === 'book'
		? results.filter((r) => !trackedIds.has(r.title.toLowerCase()))
		: results.filter((r) => !trackedIds.has(r.externalId));
}
