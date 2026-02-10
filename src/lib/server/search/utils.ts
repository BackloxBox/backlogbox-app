/** Extract a 4-digit year from an ISO-style date string (e.g. "2024-01-15") */
export function yearFromDate(dateStr: string | undefined): number | null {
	if (!dateStr) return null;
	const year = parseInt(dateStr.substring(0, 4), 10);
	return Number.isNaN(year) ? null : year;
}

/** Extract a year from a Unix timestamp in seconds (e.g. IGDB's first_release_date) */
export function yearFromTimestamp(ts: number | undefined): number | null {
	if (!ts) return null;
	return new Date(ts * 1000).getFullYear();
}
