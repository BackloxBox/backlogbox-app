import { env } from '$env/dynamic/private';
import type { SearchProvider, TypedSearchResult } from './types';
import { resilientFetch } from './fetch';
import { yearFromTimestamp } from './utils';
import { igdbLimiter } from './rate-limiter';

interface IGDBInvolvedCompany {
	company: { name: string };
	developer: boolean;
	publisher: boolean;
}

interface IGDBGame {
	id: number;
	name: string;
	cover?: { image_id: string };
	platforms?: Array<{ name: string }>;
	genres?: Array<{ name: string }>;
	first_release_date?: number;
	summary?: string;
	involved_companies?: IGDBInvolvedCompany[];
	aggregated_rating?: number;
	rating?: number;
}

interface TwitchTokenResponse {
	access_token: string;
	expires_in: number;
}

/** Cached Twitch OAuth token */
let cachedToken: { token: string; expiresAt: number } | null = null;

function getCredentials(): { clientId: string; clientSecret: string } {
	const clientId = env.TWITCH_CLIENT_ID;
	const clientSecret = env.TWITCH_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set for IGDB');
	}
	return { clientId, clientSecret };
}

async function getAccessToken(): Promise<{ clientId: string; accessToken: string }> {
	const { clientId, clientSecret } = getCredentials();

	// Return cached token if still valid (with 60s buffer)
	if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
		return { clientId, accessToken: cachedToken.token };
	}

	const response = await resilientFetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'client_credentials'
		})
	});

	if (!response.ok) {
		throw new Error(`Twitch OAuth failed: ${response.status}`);
	}

	const data: TwitchTokenResponse = await response.json();
	cachedToken = {
		token: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000
	};

	return { clientId, accessToken: data.access_token };
}

/** Shorten verbose IGDB platform names for display */
const PLATFORM_NAME_MAP: Record<string, string> = {
	'PC (Microsoft Windows)': 'PC'
};

function normalizePlatformName(name: string): string {
	return PLATFORM_NAME_MAP[name] ?? name;
}

function coverUrl(imageId: string | undefined): string | null {
	if (!imageId) return null;
	return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

/** Shared IGDB fetch helper */
async function igdbFetch(body: string): Promise<IGDBGame[]> {
	const { clientId, accessToken } = await getAccessToken();
	await igdbLimiter.acquire();
	const response = await resilientFetch('https://api.igdb.com/v4/games', {
		method: 'POST',
		headers: {
			'Client-ID': clientId,
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'text/plain',
			Accept: 'application/json'
		},
		body
	});
	if (!response.ok) return [];
	return response.json();
}

/** Map an IGDBGame to a typed search result */
/** Convert IGDB unix timestamp to ISO date string (YYYY-MM-DD) */
function isoFromTimestamp(ts: number | undefined): string | null {
	if (ts === undefined) return null;
	return new Date(ts * 1000).toISOString().slice(0, 10);
}

function mapGame(
	game: IGDBGame,
	options?: { includeReleaseDate?: boolean }
): TypedSearchResult<'game'> {
	const developers = game.involved_companies?.filter((c) => c.developer).map((c) => c.company.name);
	const publishers = game.involved_companies?.filter((c) => c.publisher).map((c) => c.company.name);

	return {
		externalId: String(game.id),
		title: game.name,
		coverUrl: coverUrl(game.cover?.image_id),
		releaseYear: yearFromTimestamp(game.first_release_date),
		releaseDate: options?.includeReleaseDate ? isoFromTimestamp(game.first_release_date) : null,
		description: game.summary ?? null,
		meta: {
			igdbId: game.id,
			platform: game.platforms?.map((p) => normalizePlatformName(p.name)).join(', ') ?? null,
			genre: game.genres?.map((g) => g.name).join(', ') ?? null,
			description: game.summary ?? null,
			developer: developers?.length ? developers.join(', ') : null,
			publisher: publishers?.length ? publishers.join(', ') : null,
			criticScore:
				typeof game.aggregated_rating === 'number' ? Math.round(game.aggregated_rating) : null,
			userScore: typeof game.rating === 'number' ? Math.round(game.rating) : null
		}
	};
}

export const igdbProvider: SearchProvider<'game'> = {
	mediaType: 'game',

	async search(query: string): Promise<TypedSearchResult<'game'>[]> {
		const escapedQuery = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		const body = `search "${escapedQuery}"; fields id, name, cover.image_id, platforms.name, genres.name, first_release_date, summary, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, aggregated_rating, rating; limit 20;`;
		const games = await igdbFetch(body);
		return games.map((g) => mapGame(g));
	}
};

const IGDB_GAME_FIELDS =
	'id, name, cover.image_id, platforms.name, genres.name, first_release_date, summary, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, aggregated_rating, rating';

// --- Discover: Trending ---

/** Fetch trending/popular games from IGDB (recent, highly rated) */
export async function fetchTrendingGames(): Promise<TypedSearchResult<'game'>[]> {
	const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
	const body = `fields ${IGDB_GAME_FIELDS}; where first_release_date > ${ninetyDaysAgo} & total_rating_count > 5; sort total_rating_count desc; limit 20;`;
	const games = await igdbFetch(body);
	return games.map((g) => mapGame(g));
}

// --- Discover: Anticipated ---

/** Fetch most anticipated unreleased games, sorted by pre-release hype */
export async function fetchAnticipatedGames(): Promise<TypedSearchResult<'game'>[]> {
	const now = Math.floor(Date.now() / 1000);
	const body = `fields ${IGDB_GAME_FIELDS}; where first_release_date > ${now} & hypes != null; sort hypes desc; limit 20;`;
	const games = await igdbFetch(body);
	return games.map((g) => mapGame(g, { includeReleaseDate: true }));
}

// --- Discover: Similar ---

interface IGDBGameWithSimilar extends IGDBGame {
	similar_games?: IGDBGame[];
}

/**
 * Fetch games similar to the given IGDB IDs in a single batched call.
 * Uses IGDB field expansion to hydrate similar_games inline.
 */
export async function fetchSimilarGames(
	igdbIds: readonly number[]
): Promise<TypedSearchResult<'game'>[]> {
	if (igdbIds.length === 0) return [];

	const idList = igdbIds.join(',');
	const similarFields = IGDB_GAME_FIELDS.split(', ')
		.map((f) => `similar_games.${f}`)
		.join(', ');
	const body = `fields ${similarFields}; where id = (${idList}); limit ${igdbIds.length};`;

	const { clientId, accessToken } = await getAccessToken();
	await igdbLimiter.acquire();
	const response = await resilientFetch('https://api.igdb.com/v4/games', {
		method: 'POST',
		headers: {
			'Client-ID': clientId,
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'text/plain',
			Accept: 'application/json'
		},
		body
	});
	if (!response.ok) return [];

	const results: IGDBGameWithSimilar[] = await response.json();

	// Flatten + dedupe similar games across all seed games
	const seen = new Set<number>();
	const seedIds = new Set(igdbIds);
	const similar: TypedSearchResult<'game'>[] = [];

	for (const result of results) {
		for (const game of result.similar_games ?? []) {
			if (seen.has(game.id) || seedIds.has(game.id)) continue;
			seen.add(game.id);
			similar.push(mapGame(game));
		}
	}

	return similar.slice(0, 20);
}
