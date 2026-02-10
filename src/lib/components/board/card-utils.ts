import type { MediaItemWithMeta } from '$lib/server/db/queries';
import type { SearchResult } from '$lib/server/search';

/** Star rating display string (e.g. "★★★☆☆"), clamped to 0-5 */
export function formatStars(rating: number | null): string {
	if (rating === null || rating === undefined) return '';
	const clamped = Math.max(0, Math.min(5, Math.round(rating)));
	return '\u2605'.repeat(clamped) + '\u2606'.repeat(5 - clamped);
}

/** Season badge label for series items (e.g. "S2" or "All") */
export function getSeasonBadge(item: MediaItemWithMeta): string | null {
	if (!item.seriesMeta) return null;
	const s = item.seriesMeta.currentSeason;
	return s ? `S${s}` : 'All';
}

/** Year badge for books (e.g. "1965") */
export function getYearBadge(item: MediaItemWithMeta): string | null {
	if (!item.bookMeta) return null;
	return item.releaseYear ? String(item.releaseYear) : null;
}

/** Format minutes as "1h 32m", "2h", or "45m" */
export function formatRuntime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

/** Runtime badge for movies (e.g. "1h 32m") */
export function getRuntimeBadge(item: MediaItemWithMeta): string | null {
	const rt = item.movieMeta?.runtime;
	if (!rt) return null;
	return formatRuntime(rt);
}

/** Single badge for the cover overlay — season for series, runtime for movies, year for books */
export function getBadge(item: MediaItemWithMeta): string | null {
	return getSeasonBadge(item) ?? getRuntimeBadge(item) ?? getYearBadge(item);
}

/** Subtitle string based on media type metadata */
export function getSubtitle(item: MediaItemWithMeta): string {
	if (item.bookMeta) {
		const parts = [item.bookMeta.author, item.bookMeta.genre].filter(Boolean);
		return parts.join(' \u00b7 ');
	}
	if (item.movieMeta) {
		const parts = [item.releaseYear ? String(item.releaseYear) : null, item.movieMeta.genre].filter(
			Boolean
		);
		return parts.join(' \u00b7 ');
	}
	if (item.seriesMeta) {
		const parts = [item.seriesMeta.watchingOn, item.seriesMeta.genre].filter(Boolean);
		return parts.join(' \u00b7 ');
	}
	if (item.gameMeta) return item.gameMeta.genre ?? item.gameMeta.platform ?? '';
	if (item.podcastMeta?.host) return item.podcastMeta.host;
	return '';
}

/**
 * Extract a set of external ID keys from board items for duplicate detection.
 * Keys are prefixed by source: "tmdb:123", "isbn:978...", "igdb:456", "podcast:789"
 */
export function extractExternalIds(items: MediaItemWithMeta[]): Set<string> {
	const ids = new Set<string>();
	for (const item of items) {
		if (item.movieMeta?.tmdbId != null) ids.add(`tmdb:${item.movieMeta.tmdbId}`);
		if (item.seriesMeta?.tmdbId != null) ids.add(`tmdb:${item.seriesMeta.tmdbId}`);
		if (item.bookMeta?.isbn) ids.add(`isbn:${item.bookMeta.isbn}`);
		if (item.gameMeta?.igdbId != null) ids.add(`igdb:${item.gameMeta.igdbId}`);
		if (item.podcastMeta?.applePodcastId) ids.add(`podcast:${item.podcastMeta.applePodcastId}`);
	}
	return ids;
}

/** Build the external ID key for a search result (matches extractExternalIds format) */
export function searchResultExternalKey(result: SearchResult): string | null {
	const m = result.meta;
	if (typeof m.tmdbId === 'number') return `tmdb:${m.tmdbId}`;
	if (typeof m.isbn === 'string' && m.isbn) return `isbn:${m.isbn}`;
	if (typeof m.igdbId === 'number') return `igdb:${m.igdbId}`;
	if (typeof m.applePodcastId === 'string' && m.applePodcastId)
		return `podcast:${m.applePodcastId}`;
	return null;
}
