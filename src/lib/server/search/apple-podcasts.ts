import type { SearchProvider, SearchResult, TypedSearchResult } from './types';
import { yearFromDate } from './utils';

interface ApplePodcast {
	collectionId: number;
	collectionName: string;
	artistName: string;
	artworkUrl600?: string;
	artworkUrl100?: string;
	trackCount?: number;
	releaseDate?: string;
}

interface AppleSearchResponse {
	resultCount: number;
	results: ApplePodcast[];
}

export const applePodcastsProvider: SearchProvider<'podcast'> = {
	mediaType: 'podcast',

	async search(query: string): Promise<TypedSearchResult<'podcast'>[]> {
		const params = new URLSearchParams({
			term: query,
			media: 'podcast',
			entity: 'podcast',
			limit: '20'
		});

		const response = await fetch(`https://itunes.apple.com/search?${params}`);
		if (!response.ok) return [];

		const data: AppleSearchResponse = await response.json();

		return data.results.map((pod) => ({
			externalId: String(pod.collectionId),
			title: pod.collectionName,
			coverUrl: pod.artworkUrl600 ?? pod.artworkUrl100 ?? null,
			releaseYear: yearFromDate(pod.releaseDate),
			meta: {
				host: pod.artistName ?? null,
				totalEpisodes: pod.trackCount ?? null,
				currentEpisode: null,
				applePodcastId: String(pod.collectionId)
			}
		}));
	}
};

// --- Discover: Trending ---

interface AppleTopChartResult {
	id: string;
	name: string;
	artistName: string;
	artworkUrl100: string;
	genres?: Array<{ genreId: string; name: string }>;
	url?: string;
}

interface AppleTopChartFeed {
	feed: {
		results: AppleTopChartResult[];
	};
}

/** Fetch top/trending podcasts from Apple RSS marketing feed */
export async function fetchTopPodcasts(): Promise<SearchResult[]> {
	try {
		const response = await fetch(
			'https://rss.applemarketingtools.com/api/v2/us/podcasts/top/25/podcasts.json'
		);
		if (!response.ok) return [];

		const data: AppleTopChartFeed = await response.json();
		return data.feed.results.slice(0, 20).map((pod) => ({
			externalId: pod.id,
			title: pod.name,
			// Upscale artwork from 100x100 to 600x600
			coverUrl: pod.artworkUrl100?.replace('100x100bb', '600x600bb') ?? null,
			releaseYear: null,
			meta: {
				host: pod.artistName ?? null,
				totalEpisodes: null,
				currentEpisode: null,
				applePodcastId: pod.id
			}
		}));
	} catch {
		return [];
	}
}
