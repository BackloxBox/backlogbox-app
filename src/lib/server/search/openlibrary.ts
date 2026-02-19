import type { SearchProvider, SearchResult, TypedSearchResult } from './types';
import { openLibraryLimiter } from './rate-limiter';
import { getRedis } from '$lib/server/redis';
import { log } from '$lib/server/logger';

const OL_USER_AGENT = 'BacklogBox/1.0 (https://github.com/backlogbox)';

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
	subjects?: string[];
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

export const openLibraryProvider: SearchProvider<'book'> = {
	mediaType: 'book',

	async search(query: string): Promise<TypedSearchResult<'book'>[]> {
		const params = new URLSearchParams({
			q: query,
			fields:
				'key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject,language,publisher',
			limit: '20'
		});

		await openLibraryLimiter.acquire();
		const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		if (!response.ok) return [];

		const data: OpenLibraryResponse = await response.json();

		return data.docs.map((doc) => ({
			externalId: doc.key,
			title: doc.title,
			coverUrl: coverUrl(doc.cover_i),
			releaseYear: doc.first_publish_year ?? null,
			releaseDate: null,
			description: null,
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
		await openLibraryLimiter.acquire();
		const response = await fetch(url, {
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		if (!response.ok) return null;
		const data: OpenLibraryWork = await response.json();
		if (!data.description) return null;
		// description can be a string or { type: '/type/text', value: '...' }
		return typeof data.description === 'string' ? data.description : data.description.value;
	} catch {
		return null;
	}
}

/**
 * Look up a book's primary genre/subject by work key or title.
 * Results are cached for 7 days (genre is static metadata).
 */
export async function fetchGenreByTitle(title: string): Promise<string | null> {
	const cacheKey = `genre:${title.toLowerCase().trim()}`;

	// Check cache first
	const cached = await genreCacheGet(cacheKey);
	if (cached !== undefined) return cached;

	const params = new URLSearchParams({
		q: title,
		fields: 'subject',
		limit: '1'
	});
	try {
		await openLibraryLimiter.acquire();
		const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		if (!response.ok) return null;
		const data: OpenLibraryResponse = await response.json();
		const doc = data.docs[0];
		if (!doc) return null;
		const genre = extractGenres(doc.subject, 1);

		// Cache the result (even null — avoids re-fetching for books with no genre)
		void genreCacheSet(cacheKey, genre);

		return genre;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Genre cache — Redis with in-memory fallback (7 day TTL)
// ---------------------------------------------------------------------------

const GENRE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GENRE_REDIS_PREFIX = 'genre:';
/** Sentinel value to cache "no genre found" in Redis */
const GENRE_NULL_SENTINEL = '__null__';

/** In-memory fallback for genre lookups */
const genreMemCache = new Map<string, { value: string | null; expiresAt: number }>();

/** Returns `undefined` on cache miss, `null` for "known no-genre", or the genre string */
async function genreCacheGet(key: string): Promise<string | null | undefined> {
	const redis = getRedis();
	if (redis) {
		try {
			const raw = await redis.get(GENRE_REDIS_PREFIX + key);
			if (raw === null) return undefined; // cache miss
			return raw === GENRE_NULL_SENTINEL ? null : raw;
		} catch (err) {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'genre cache get failed');
		}
	}

	const entry = genreMemCache.get(key);
	if (!entry || entry.expiresAt <= Date.now()) {
		if (entry) genreMemCache.delete(key);
		return undefined;
	}
	return entry.value;
}

function genreCacheSet(key: string, value: string | null): void {
	const redis = getRedis();
	if (redis) {
		redis
			.set(GENRE_REDIS_PREFIX + key, value ?? GENRE_NULL_SENTINEL, 'PX', GENRE_TTL_MS)
			.catch((err) => {
				log.debug({ err: err instanceof Error ? err.message : err, key }, 'genre cache set failed');
			});
		return;
	}

	genreMemCache.set(key, { value, expiresAt: Date.now() + GENRE_TTL_MS });
}

// --- Discover: Trending ---

interface OpenLibraryTrendingWork {
	key: string;
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
	subject?: string[];
	language?: string[];
}

interface OpenLibraryTrendingResponse {
	works: OpenLibraryTrendingWork[];
}

/** Fetch daily trending books from OpenLibrary */
export async function fetchTrendingBooks(): Promise<SearchResult[]> {
	try {
		await openLibraryLimiter.acquire();
		const response = await fetch('https://openlibrary.org/trending/daily.json?limit=20', {
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		if (!response.ok) return [];

		const data: OpenLibraryTrendingResponse = await response.json();
		return data.works.slice(0, 20).map((work) => ({
			externalId: work.key,
			title: work.title,
			coverUrl: coverUrl(work.cover_i),
			releaseYear: work.first_publish_year ?? null,
			releaseDate: null,
			description: null,
			meta: {
				author: work.author_name?.[0] ?? null,
				genre: extractGenres(work.subject),
				pageCount: null,
				isbn: null,
				language: languageName(work.language?.[0]),
				publisher: null
			}
		}));
	} catch {
		return [];
	}
}

// --- Discover: Similar (subject-based) ---

interface OpenLibrarySubjectWork {
	key: string;
	title: string;
	edition_count: number;
	authors?: Array<{ name: string; key: string }>;
	has_fulltext?: boolean;
	cover_id?: number;
	first_publish_year?: number;
	subject?: string[];
}

interface OpenLibrarySubjectResponse {
	name: string;
	work_count: number;
	works: OpenLibrarySubjectWork[];
}

/**
 * Fetch popular books for a given subject (genre).
 * Subject uses underscores: e.g. "science_fiction", "mystery".
 */
export async function fetchBooksBySubject(subject: string): Promise<SearchResult[]> {
	const normalized = subject
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_]/g, '');
	try {
		await openLibraryLimiter.acquire();
		const response = await fetch(`https://openlibrary.org/subjects/${normalized}.json?limit=10`, {
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		if (!response.ok) return [];

		const data: OpenLibrarySubjectResponse = await response.json();
		return data.works.slice(0, 10).map((work) => ({
			externalId: work.key,
			title: work.title,
			coverUrl: coverUrl(work.cover_id),
			releaseYear: work.first_publish_year ?? null,
			releaseDate: null,
			description: null,
			meta: {
				author: work.authors?.[0]?.name ?? null,
				genre: subject,
				pageCount: null,
				isbn: null,
				language: null,
				publisher: null
			}
		}));
	} catch {
		return [];
	}
}
