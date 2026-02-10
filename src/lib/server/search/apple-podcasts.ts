import type { SearchProvider, TypedSearchResult } from './types';
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
