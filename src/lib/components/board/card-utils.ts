import type { MediaItemWithMeta } from '$lib/server/db/queries';

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
