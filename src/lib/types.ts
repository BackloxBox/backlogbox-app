/** All supported media types */
export const MEDIA_TYPES = ['book', 'movie', 'series', 'game', 'podcast'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

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

/** Dot color for each status column header */
export const STATUS_COLORS: Record<MediaStatus, string> = {
	wishlist: '#6B9BD2',
	backlog: '#8B8B8B',
	in_progress: '#E5A63B',
	on_hold: '#D97A3B',
	completed: '#4CAF7D',
	abandoned: '#C45B5B'
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
