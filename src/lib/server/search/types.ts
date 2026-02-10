import type { MediaType, MetaFieldsFor } from '$lib/types';

/**
 * Normalized search result returned from any provider.
 * `M` narrows to the meta shape for the provider's media type.
 */
export interface SearchResult<M extends Record<string, unknown> = Record<string, unknown>> {
	externalId: string;
	title: string;
	coverUrl: string | null;
	releaseYear: number | null;
	/** Type-specific metadata — shape determined by the provider's media type */
	meta: M;
}

/** A typed search result for a specific media type */
export type TypedSearchResult<T extends MediaType> = SearchResult<Partial<MetaFieldsFor<T>>>;

/** A search provider implements search for one media type */
export interface SearchProvider<T extends MediaType = MediaType> {
	readonly mediaType: T;
	search(query: string): Promise<TypedSearchResult<T>[]>;
}
