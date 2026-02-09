import * as v from 'valibot';
import { query } from '$app/server';
import { requireUserId } from '$lib/server/auth-guard';
import { getSearchProvider, type SearchResult } from '$lib/server/search';
import { fetchBookDescription } from '$lib/server/search/openlibrary';
import { fetchTmdbSeriesSeasons } from '$lib/server/search/tmdb';
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

/** Fetch total season count for a TMDB series by its tmdbId */
export const getSeriesSeasons = query(v.number(), async (tmdbId): Promise<number | null> => {
	requireUserId();
	return fetchTmdbSeriesSeasons(tmdbId);
});

/** Fetch book description from OpenLibrary works endpoint */
export const getBookDescription = query(v.string(), async (workKey): Promise<string | null> => {
	requireUserId();
	return fetchBookDescription(workKey);
});
