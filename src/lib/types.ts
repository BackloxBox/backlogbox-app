import type { bookMeta, movieMeta, seriesMeta, gameMeta, podcastMeta } from '$lib/server/db/schema';

// ---------------------------------------------------------------------------
// Media types
// ---------------------------------------------------------------------------

/** All supported media types */
export const MEDIA_TYPES = ['book', 'movie', 'series', 'game', 'podcast'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

// ---------------------------------------------------------------------------
// Per-type metadata — derived from Drizzle schema to stay in sync
// ---------------------------------------------------------------------------

/** Meta fields for a single media type, excluding the `mediaItemId` PK */
type MetaInsert<T extends { $inferInsert: Record<string, unknown> }> = Omit<
	T['$inferInsert'],
	'mediaItemId'
>;

export type BookMetaFields = MetaInsert<typeof bookMeta>;
export type MovieMetaFields = MetaInsert<typeof movieMeta>;
export type SeriesMetaFields = MetaInsert<typeof seriesMeta>;
export type GameMetaFields = MetaInsert<typeof gameMeta>;
export type PodcastMetaFields = MetaInsert<typeof podcastMeta>;

/** Map from MediaType to its corresponding meta fields */
export type MetaFieldsFor<T extends MediaType> = T extends 'book'
	? BookMetaFields
	: T extends 'movie'
		? MovieMetaFields
		: T extends 'series'
			? SeriesMetaFields
			: T extends 'game'
				? GameMetaFields
				: T extends 'podcast'
					? PodcastMetaFields
					: never;

/** Discriminated union of all meta shapes, keyed by type */
export type TypedMeta =
	| { type: 'book'; meta: BookMetaFields }
	| { type: 'movie'; meta: MovieMetaFields }
	| { type: 'series'; meta: SeriesMetaFields }
	| { type: 'game'; meta: GameMetaFields }
	| { type: 'podcast'; meta: PodcastMetaFields };

/** All statuses a media item can be in (Kanban columns) */
export const MEDIA_STATUSES = [
	'wishlist',
	'backlog',
	'in_progress',
	'on_hold',
	'completed',
	'abandoned'
] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

/** Display labels for statuses, keyed by media type */
export const STATUS_LABELS: Record<MediaType, Record<MediaStatus, string>> = {
	book: {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'Reading',
		on_hold: 'On Hold',
		completed: 'Read',
		abandoned: 'Abandoned'
	},
	movie: {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'Watching',
		on_hold: 'On Hold',
		completed: 'Watched',
		abandoned: 'Abandoned'
	},
	series: {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'Watching',
		on_hold: 'On Hold',
		completed: 'Watched',
		abandoned: 'Abandoned'
	},
	game: {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'Playing',
		on_hold: 'On Hold',
		completed: 'Played',
		abandoned: 'Abandoned'
	},
	podcast: {
		wishlist: 'Wishlist',
		backlog: 'Backlog',
		in_progress: 'Listening',
		on_hold: 'On Hold',
		completed: 'Listened',
		abandoned: 'Abandoned'
	}
};

/** Dot color for each status column header — high saturation for light & dark legibility */
export const STATUS_COLORS: Record<MediaStatus, string> = {
	wishlist: '#3B82F6',
	backlog: '#737373',
	in_progress: '#F59E0B',
	on_hold: '#F97316',
	completed: '#22C55E',
	abandoned: '#EF4444'
};

/** Brand color for each media type — used in dashboard, charts, and sidebar icons */
export const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
	book: '#3B82F6',
	movie: '#22C55E',
	series: '#F59E0B',
	game: '#F97316',
	podcast: '#EF4444'
};

/** Display name for each media type (singular/plural) */
export const MEDIA_TYPE_LABELS: Record<MediaType, { singular: string; plural: string }> = {
	book: { singular: 'Book', plural: 'Books' },
	movie: { singular: 'Movie', plural: 'Movies' },
	series: { singular: 'Series', plural: 'Series' },
	game: { singular: 'Game', plural: 'Games' },
	podcast: { singular: 'Podcast', plural: 'Podcasts' }
};

/** URL path segment for each media type (plural, used in routes) */
export const MEDIA_TYPE_SLUGS = ['books', 'movies', 'series', 'games', 'podcasts'] as const;
export type MediaTypeSlug = (typeof MEDIA_TYPE_SLUGS)[number];

const SLUG_TO_TYPE: Record<MediaTypeSlug, MediaType> = {
	books: 'book',
	movies: 'movie',
	series: 'series',
	games: 'game',
	podcasts: 'podcast'
};

const TYPE_TO_SLUG: Record<MediaType, MediaTypeSlug> = {
	book: 'books',
	movie: 'movies',
	series: 'series',
	game: 'games',
	podcast: 'podcasts'
};

export function slugToMediaType(slug: string): MediaType | undefined {
	return SLUG_TO_TYPE[slug as MediaTypeSlug];
}

export function mediaTypeToSlug(type: MediaType): MediaTypeSlug {
	return TYPE_TO_SLUG[type];
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/** Streaming platforms for the "Watching on" selector */
export const STREAMING_PLATFORMS = [
	'Netflix',
	'Disney+',
	'HBO Max',
	'Prime Video',
	'Apple TV+',
	'Hulu',
	'Paramount+',
	'Peacock',
	'Crunchyroll',
	'YouTube'
] as const;

/** Podcast listening platforms for the "Listening on" selector */
export const PODCAST_PLATFORMS = [
	'Spotify',
	'Apple Podcasts',
	'Overcast',
	'Pocket Casts',
	'Google Podcasts',
	'Castro',
	'YouTube',
	'Amazon Music',
	'Audible',
	'iHeart Radio',
	'Stitcher'
] as const;

/** Podcast release frequency options */
export const PODCAST_FREQUENCIES = [
	'Daily',
	'Twice a week',
	'Weekly',
	'Biweekly',
	'Monthly',
	'Irregular'
] as const;
