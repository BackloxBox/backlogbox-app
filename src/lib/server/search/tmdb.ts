import { env } from '$env/dynamic/private';
import type { SearchProvider, SearchResult } from './types';

interface TMDBMovieResult {
	id: number;
	title: string;
	poster_path: string | null;
	release_date?: string;
	overview?: string;
	genre_ids?: number[];
}

interface TMDBTVResult {
	id: number;
	name: string;
	poster_path: string | null;
	first_air_date?: string;
	overview?: string;
	genre_ids?: number[];
}

interface TMDBTVDetails {
	id: number;
	number_of_seasons: number;
}

interface TMDBMovieDetails {
	id: number;
	overview?: string;
	runtime?: number;
	credits?: {
		crew: Array<{ job: string; name: string }>;
		cast: Array<{ name: string; order: number }>;
	};
}

export interface TmdbMovieDetailsResult {
	director: string | null;
	description: string | null;
	runtime: number | null;
	cast: string | null;
}

interface TMDBSearchResponse<T> {
	results: T[];
}

/**
 * TMDB genre ID → name mappings (combined movie + TV).
 * Sourced from /genre/movie/list and /genre/tv/list — static to avoid extra API calls.
 */
const TMDB_GENRES: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Sci-Fi',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western',
	// TV-specific
	10759: 'Action & Adventure',
	10762: 'Kids',
	10763: 'News',
	10764: 'Reality',
	10765: 'Sci-Fi & Fantasy',
	10766: 'Soap',
	10767: 'Talk',
	10768: 'War & Politics'
};

/** Resolve genre IDs to a comma-separated label string, taking the first two */
function genreLabel(ids: number[] | undefined): string | null {
	if (!ids || ids.length === 0) return null;
	const names = ids
		.slice(0, 2)
		.map((id) => TMDB_GENRES[id])
		.filter(Boolean);
	return names.length > 0 ? names.join(', ') : null;
}

function posterUrl(path: string | null): string | null {
	if (!path) return null;
	return `https://image.tmdb.org/t/p/w200${path}`;
}

function yearFromDate(dateStr: string | undefined): number | null {
	if (!dateStr) return null;
	const year = parseInt(dateStr.substring(0, 4), 10);
	return Number.isNaN(year) ? null : year;
}

function getApiKey(): string {
	const key = env.TMDB_API_KEY;
	if (!key) throw new Error('TMDB_API_KEY is not set');
	return key;
}

export const tmdbMovieProvider: SearchProvider = {
	mediaType: 'movie',

	async search(query: string): Promise<SearchResult[]> {
		const params = new URLSearchParams({
			api_key: getApiKey(),
			query,
			include_adult: 'false'
		});

		const response = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
		if (!response.ok) return [];

		const data: TMDBSearchResponse<TMDBMovieResult> = await response.json();

		return data.results.slice(0, 20).map((movie) => ({
			externalId: String(movie.id),
			title: movie.title,
			coverUrl: posterUrl(movie.poster_path),
			releaseYear: yearFromDate(movie.release_date),
			meta: {
				tmdbId: movie.id,
				director: null, // Would need a separate /credits call; skip for search
				genre: genreLabel(movie.genre_ids)
			}
		}));
	}
};

export const tmdbSeriesProvider: SearchProvider = {
	mediaType: 'series',

	async search(query: string): Promise<SearchResult[]> {
		const params = new URLSearchParams({
			api_key: getApiKey(),
			query,
			include_adult: 'false'
		});

		const response = await fetch(`https://api.themoviedb.org/3/search/tv?${params}`);
		if (!response.ok) return [];

		const data: TMDBSearchResponse<TMDBTVResult> = await response.json();

		return data.results.slice(0, 20).map((tv) => ({
			externalId: String(tv.id),
			title: tv.name,
			coverUrl: posterUrl(tv.poster_path),
			releaseYear: yearFromDate(tv.first_air_date),
			meta: {
				tmdbId: tv.id,
				genre: genreLabel(tv.genre_ids),
				totalSeasons: null,
				currentSeason: null
			}
		}));
	}
};

/** Fetch season count for a specific TV show from TMDB details endpoint */
export async function fetchTmdbSeriesSeasons(tmdbId: number): Promise<number | null> {
	try {
		const params = new URLSearchParams({ api_key: getApiKey() });
		const response = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?${params}`);
		if (!response.ok) return null;
		const data: TMDBTVDetails = await response.json();
		return data.number_of_seasons ?? null;
	} catch {
		return null;
	}
}

/** Fetch movie details (director, description, runtime, cast) from TMDB */
export async function fetchTmdbMovieDetails(
	tmdbId: number
): Promise<TmdbMovieDetailsResult | null> {
	try {
		const params = new URLSearchParams({
			api_key: getApiKey(),
			append_to_response: 'credits'
		});
		const response = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?${params}`);
		if (!response.ok) return null;
		const data: TMDBMovieDetails = await response.json();

		const director = data.credits?.crew.find((c) => c.job === 'Director')?.name ?? null;
		const cast =
			data.credits?.cast
				.sort((a, b) => a.order - b.order)
				.slice(0, 3)
				.map((c) => c.name)
				.join(', ') || null;

		return {
			director,
			description: data.overview || null,
			runtime: data.runtime ?? null,
			cast
		};
	} catch {
		return null;
	}
}
