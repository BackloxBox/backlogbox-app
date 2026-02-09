import type { SearchProvider, SearchResult } from './types';

interface OpenLibraryDoc {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	number_of_pages_median?: number;
	isbn?: string[];
	cover_i?: number;
}

interface OpenLibraryResponse {
	docs: OpenLibraryDoc[];
}

function coverUrl(coverId: number | undefined): string | null {
	if (!coverId) return null;
	return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

export const openLibraryProvider: SearchProvider = {
	mediaType: 'book',

	async search(query: string): Promise<SearchResult[]> {
		const params = new URLSearchParams({
			q: query,
			fields: 'key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i',
			limit: '20'
		});

		const response = await fetch(`https://openlibrary.org/search.json?${params}`);
		if (!response.ok) return [];

		const data: OpenLibraryResponse = await response.json();

		return data.docs.map((doc) => ({
			externalId: doc.key,
			title: doc.title,
			coverUrl: coverUrl(doc.cover_i),
			releaseYear: doc.first_publish_year ?? null,
			meta: {
				author: doc.author_name?.[0] ?? null,
				pageCount: doc.number_of_pages_median ?? null,
				isbn: doc.isbn?.[0] ?? null
			}
		}));
	}
};
