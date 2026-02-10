import type { SearchProvider, SearchResult } from './types';

interface OpenLibraryDoc {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	number_of_pages_median?: number;
	isbn?: string[];
	cover_i?: number;
	subject?: string[];
	language?: string[];
	publisher?: string[];
}

interface OpenLibraryResponse {
	docs: OpenLibraryDoc[];
}

interface OpenLibraryWork {
	description?: string | { value: string };
}

/** Map common ISO 639-2/3 language codes to human-readable names */
const LANGUAGE_NAMES: Record<string, string> = {
	eng: 'English',
	spa: 'Spanish',
	fre: 'French',
	ger: 'German',
	ita: 'Italian',
	por: 'Portuguese',
	rus: 'Russian',
	jpn: 'Japanese',
	chi: 'Chinese',
	kor: 'Korean',
	ara: 'Arabic',
	hin: 'Hindi',
	dut: 'Dutch',
	pol: 'Polish',
	swe: 'Swedish',
	nor: 'Norwegian',
	dan: 'Danish',
	fin: 'Finnish',
	tur: 'Turkish',
	gre: 'Greek',
	heb: 'Hebrew',
	tha: 'Thai',
	vie: 'Vietnamese',
	ind: 'Indonesian',
	cat: 'Catalan',
	ces: 'Czech',
	hun: 'Hungarian',
	rom: 'Romanian',
	ukr: 'Ukrainian'
};

function languageName(code: string | undefined): string | null {
	if (!code) return null;
	return LANGUAGE_NAMES[code] ?? code;
}

function coverUrl(coverId: number | undefined, size: 'M' | 'L' = 'L'): string | null {
	if (!coverId) return null;
	return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/** Noisy subject patterns to exclude when extracting genre labels */
const NOISY_SUBJECT_RE =
	/^(nyt:|award:|fiction$|accessible book|protected daisy|in library|large type|internet archive|overdrive|open library|long now|new york times|lending library)/i;

/**
 * Extract up to `max` clean genre labels from OpenLibrary subjects.
 * Filters out noise like NYT lists, awards, generic "Fiction", etc.
 */
function extractGenres(subjects: string[] | undefined, max = 2): string | null {
	if (!subjects?.length) return null;

	const clean = subjects
		.filter((s) => !NOISY_SUBJECT_RE.test(s))
		.filter((s) => s.length > 2 && s.length < 40)
		.slice(0, max);

	return clean.length > 0 ? clean.join(', ') : null;
}

export const openLibraryProvider: SearchProvider = {
	mediaType: 'book',

	async search(query: string): Promise<SearchResult[]> {
		const params = new URLSearchParams({
			q: query,
			fields:
				'key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject,language,publisher',
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
				genre: extractGenres(doc.subject),
				pageCount: doc.number_of_pages_median ?? null,
				isbn: doc.isbn?.[0] ?? null,
				language: languageName(doc.language?.[0]),
				publisher: doc.publisher?.[0] ?? null
			}
		}));
	}
};

/**
 * Fetch book description from OpenLibrary works endpoint.
 * `workKey` is the `/works/OL...W` key from search results.
 */
export async function fetchBookDescription(workKey: string): Promise<string | null> {
	const url = `https://openlibrary.org${workKey}.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) return null;
		const data: OpenLibraryWork = await response.json();
		if (!data.description) return null;
		// description can be a string or { type: '/type/text', value: '...' }
		return typeof data.description === 'string' ? data.description : data.description.value;
	} catch {
		return null;
	}
}
