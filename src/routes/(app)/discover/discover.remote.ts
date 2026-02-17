import * as v from 'valibot';
import { query } from '$app/server';
import { requireSubscription } from '$lib/server/auth-guard';
import { getDiscoverCached, setDiscoverCache } from '$lib/server/search/cache';
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

/** Fetch trending items for a media type, cached for 30 minutes */
export const getTrending = query(slugSchema, async (slug): Promise<SearchResult[]> => {
	const userId = requireSubscription();
	const type = slugToMediaType(slug);
	if (!type) error(400, `Invalid slug: ${slug}`);

	const cached = getDiscoverCached('trending', type);
	if (cached) return filterTracked(cached, userId, type);

	const fetcher = trendingFetchers[type];
	if (!fetcher) return [];

	try {
		const results = await fetcher();
		setDiscoverCache('trending', type, results);
		return filterTracked(results, userId, type);
	} catch (err) {
		log.error({ err, mediaType: type }, 'trending fetch failed');
		return [];
	}
});

// ---------------------------------------------------------------------------
// Recommendations ("because you liked X")
// ---------------------------------------------------------------------------

export type RecommendationGroup = {
	seedTitle: string;
	items: SearchResult[];
};

/** Fetch personalized recommendations based on user's recent items */
export const getRecommendations = query(
	slugSchema,
	async (slug): Promise<RecommendationGroup[]> => {
		const userId = requireSubscription();
		const type = slugToMediaType(slug);
		if (!type) error(400, `Invalid slug: ${slug}`);

		// Podcasts: no similar API available
		if (type === 'podcast') return [];

		try {
			const seeds = await getSeedItems(userId, type, 3);
			if (seeds.length === 0) return [];

			const trackedIds = await getUserExternalIds(userId, type);
			const groups: RecommendationGroup[] = [];

			for (const seed of seeds) {
				const cacheKey = seed.externalId;
				const cached = getDiscoverCached('similar', type, cacheKey);
				let items: SearchResult[];

				if (cached) {
					items = cached;
				} else {
					items = await fetchSimilarForType(type, seed);
					setDiscoverCache('similar', type, items, cacheKey);
				}

				// Filter out already-tracked items
				const filtered =
					type === 'book'
						? items.filter((r) => !trackedIds.has(r.title.toLowerCase()))
						: items.filter((r) => !trackedIds.has(r.externalId));

				if (filtered.length > 0) {
					groups.push({ seedTitle: seed.title, items: filtered });
				}
			}

			return groups;
		} catch (err) {
			log.error({ err, mediaType: type }, 'recommendations fetch failed');
			return [];
		}
	}
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchSimilarForType(
	type: string,
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
		default:
			return [];
	}
}

async function filterTracked(
	results: SearchResult[],
	userId: string,
	type: string
): Promise<SearchResult[]> {
	const mediaType = type as import('$lib/types').MediaType;
	const trackedIds = await getUserExternalIds(userId, mediaType);
	if (trackedIds.size === 0) return results;

	return mediaType === 'book'
		? results.filter((r) => !trackedIds.has(r.title.toLowerCase()))
		: results.filter((r) => !trackedIds.has(r.externalId));
}
