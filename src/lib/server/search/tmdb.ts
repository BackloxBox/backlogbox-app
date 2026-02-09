import { env } from '$env/dynamic/private';
import type { SearchProvider, SearchResult } from './types';

interface TMDBMovieResult {
	id: number;
	title: string;
	poster_path: string | null;
	release_date?: string;
	overview?: string;
}

interface TMDBTVResult {
	id: number;
	name: string;
	poster_path: string | null;
	first_air_date?: string;
	overview?: string;
	number_of_seasons?: number;
}

interface TMDBSearchResponse<T> {
	results: T[];
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
				director: null // Would need a separate /credits call; skip for search
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
				totalSeasons: tv.number_of_seasons ?? null,
				currentSeason: null
			}
		}));
	}
};
