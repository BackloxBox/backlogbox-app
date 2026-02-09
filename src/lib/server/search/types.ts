import type { MediaType } from '$lib/types';

/** Normalized search result returned to the client from any provider */
export interface SearchResult {
	externalId: string;
	title: string;
	coverUrl: string | null;
	releaseYear: number | null;
	/** Type-specific metadata, varies by media type */
	meta: Record<string, unknown>;
}

/** A search provider implements search for one media type */
export interface SearchProvider {
	readonly mediaType: MediaType;
	search(query: string): Promise<SearchResult[]>;
}
