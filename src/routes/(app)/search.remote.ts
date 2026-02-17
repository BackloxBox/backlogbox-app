import * as v from 'valibot';
import { query } from '$app/server';
import { requireSubscription } from '$lib/server/auth-guard';
import { getSearchProvider, type SearchResult } from '$lib/server/search';
import { getOrFetch } from '$lib/server/search/cache';
import { fetchBookDescription } from '$lib/server/search/openlibrary';
import {
	fetchTmdbSeriesDetails,
	fetchTmdbMovieDetails,
	type TmdbMovieDetailsResult,
	type TmdbSeriesDetailsResult
} from '$lib/server/search/tmdb';
import { slugToMediaType } from '$lib/types';
import { error } from '@sveltejs/kit';
import { log } from '$lib/server/logger';

const SEARCH_PROVIDERS: Record<string, string> = {
	book: 'openlibrary',
	movie: 'tmdb',
	series: 'tmdb',
	game: 'igdb',
	podcast: 'apple'
};

const searchSchema = v.object({
	slug: v.string(),
	query: v.pipe(v.string(), v.nonEmpty())
});

/**
 * Search external APIs for media items.
 * Uses getOrFetch for coalescing (no SWR — search should always feel fresh).
 */
export const searchMedia = query(searchSchema, async (input): Promise<SearchResult[]> => {
	requireSubscription();

	const type = slugToMediaType(input.slug);
	if (!type) error(400, `Invalid media type slug: ${input.slug}`);

	const provider = getSearchProvider(type);
	const key = `search:${type}:${input.query.toLowerCase().trim()}`;
	const providerName = SEARCH_PROVIDERS[type] ?? type;

	try {
		const { results } = await getOrFetch(key, 'search', providerName, () =>
			provider.search(input.query)
		);
		return results;
	} catch (err) {
		log.error({ err, mediaType: type, query: input.query }, 'search provider failed');
		return [];
	}
});

/** Fetch series details (description, creator, cast, network, status, totalSeasons) from TMDB */
export const getSeriesDetails = query(
	v.number(),
	async (tmdbId): Promise<TmdbSeriesDetailsResult | null> => {
		requireSubscription();
		try {
			return await fetchTmdbSeriesDetails(tmdbId);
		} catch (err) {
			log.error({ err, tmdbId, provider: 'tmdb' }, 'series details fetch failed');
			return null;
		}
	}
);

/** Fetch movie details (director, description, runtime, cast) from TMDB */
export const getMovieDetails = query(
	v.number(),
	async (tmdbId): Promise<TmdbMovieDetailsResult | null> => {
		requireSubscription();
		try {
			return await fetchTmdbMovieDetails(tmdbId);
		} catch (err) {
			log.error({ err, tmdbId, provider: 'tmdb' }, 'movie details fetch failed');
			return null;
		}
	}
);

/** Fetch book description from OpenLibrary works endpoint */
export const getBookDescription = query(v.string(), async (workKey): Promise<string | null> => {
	requireSubscription();
	try {
		return await fetchBookDescription(workKey);
	} catch (err) {
		log.error({ err, workKey, provider: 'openlibrary' }, 'book description fetch failed');
		return null;
	}
});
