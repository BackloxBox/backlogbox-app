import * as v from 'valibot';
import { query } from '$app/server';
import { requireUserId } from '$lib/server/auth-guard';
import { getSearchProvider, type SearchResult } from '$lib/server/search';
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
