import type { SearchProvider, SearchResult } from './types';

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

function yearFromDate(dateStr: string | undefined): number | null {
	if (!dateStr) return null;
	const year = parseInt(dateStr.substring(0, 4), 10);
	return Number.isNaN(year) ? null : year;
}

export const applePodcastsProvider: SearchProvider = {
	mediaType: 'podcast',

	async search(query: string): Promise<SearchResult[]> {
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
