import type { MediaType } from '$lib/types';
import type { SearchProvider } from './types';
import { openLibraryProvider } from './openlibrary';
import { tmdbMovieProvider, tmdbSeriesProvider } from './tmdb';
import { igdbProvider } from './igdb';
import { applePodcastsProvider } from './apple-podcasts';

export type { SearchResult, TypedSearchResult, SearchProvider } from './types';

const providers: Record<MediaType, SearchProvider> = {
	book: openLibraryProvider,
	movie: tmdbMovieProvider,
	series: tmdbSeriesProvider,
	game: igdbProvider,
	podcast: applePodcastsProvider
};

export function getSearchProvider(type: MediaType): SearchProvider {
	return providers[type];
}
