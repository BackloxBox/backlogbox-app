import * as v from 'valibot';
import { query } from '$app/server';
import { requireUserId } from '$lib/server/auth-guard';
import { getSearchProvider, type SearchResult } from '$lib/server/search';
import { fetchBookDescription } from '$lib/server/search/openlibrary';
import {
	fetchTmdbSeriesDetails,
	fetchTmdbMovieDetails,
	type TmdbMovieDetailsResult,
	type TmdbSeriesDetailsResult
} from '$lib/server/search/tmdb';
import { slugToMediaType } from '$lib/types';
import { error } from '@sveltejs/kit';

const searchSchema = v.object({
	slug: v.string(),
	query: v.pipe(v.string(), v.nonEmpty())
});

/**
 * Search external APIs for media items.
 * Returns normalized results regardless of provider.
 */
export const searchMedia = query(searchSchema, async (input): Promise<SearchResult[]> => {
	requireUserId(); // must be authenticated

	const type = slugToMediaType(input.slug);
	if (!type) error(400, `Invalid media type slug: ${input.slug}`);

	const provider = getSearchProvider(type);

	try {
		return await provider.search(input.query);
	} catch (err) {
		console.error(`Search failed for ${type}:`, err);
		return [];
	}
});

/** Fetch series details (description, creator, cast, network, status, totalSeasons) from TMDB */
export const getSeriesDetails = query(
	v.number(),
	async (tmdbId): Promise<TmdbSeriesDetailsResult | null> => {
		requireUserId();
		try {
			return await fetchTmdbSeriesDetails(tmdbId);
		} catch (err) {
			console.error(`Failed to fetch TMDB series details for ${tmdbId}:`, err);
			return null;
		}
	}
);

/** Fetch movie details (director, description, runtime, cast) from TMDB */
export const getMovieDetails = query(
	v.number(),
	async (tmdbId): Promise<TmdbMovieDetailsResult | null> => {
		requireUserId();
		try {
			return await fetchTmdbMovieDetails(tmdbId);
		} catch (err) {
			console.error(`Failed to fetch TMDB movie details for ${tmdbId}:`, err);
			return null;
		}
	}
);

/** Fetch book description from OpenLibrary works endpoint */
export const getBookDescription = query(v.string(), async (workKey): Promise<string | null> => {
	requireUserId();
	try {
		return await fetchBookDescription(workKey);
	} catch (err) {
		console.error(`Failed to fetch book description for ${workKey}:`, err);
		return null;
	}
});
