import type { MediaItemWithMeta } from '$lib/server/db/queries';

/** Star rating display string (e.g. "★★★☆☆") */
export function formatStars(rating: number | null): string {
	if (rating === null || rating === undefined) return '';
	return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
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

/** Runtime badge for movies (e.g. "1h 32m") */
export function getRuntimeBadge(item: MediaItemWithMeta): string | null {
	const rt = item.movieMeta?.runtime;
	if (!rt) return null;
	const h = Math.floor(rt / 60);
	const m = rt % 60;
	return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
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
