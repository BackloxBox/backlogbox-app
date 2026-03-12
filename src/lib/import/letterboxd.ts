import Papa from 'papaparse';
import type { MediaStatus } from '$lib/types';
import type { LetterboxdCandidate } from './types';

// ---------------------------------------------------------------------------
// Letterboxd CSV detection — each export file has distinct headers
// ---------------------------------------------------------------------------

type LetterboxdFileType = 'watched' | 'watchlist' | 'diary' | 'ratings';

interface FileSignature {
	type: LetterboxdFileType;
	/** Column that uniquely identifies this file type */
	marker: string;
	/** Default status for all items in this file */
	status: MediaStatus;
}

/**
 * Detection order matters: check most-specific first.
 * diary has 'Watched Date', ratings has 'Rating' but no 'Watched Date',
 * watched/watchlist are identical 4-column formats — disambiguated by
 * absence of Rating + Watched Date (fallback to 'watched').
 */
const SIGNATURES: FileSignature[] = [
	{ type: 'diary', marker: 'Watched Date', status: 'completed' },
	{ type: 'ratings', marker: 'Rating', status: 'completed' },
	// watched and watchlist have identical headers (Date,Name,Year,Letterboxd URI).
	// We default to 'watched' — user picks the right file.
	{ type: 'watched', marker: 'Name', status: 'completed' }
];

function detectFileType(headers: Set<string>): FileSignature | null {
	for (const sig of SIGNATURES) {
		if (headers.has(sig.marker)) return sig;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseYear(raw: string): number | null {
	const n = parseInt(raw, 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** Letterboxd rating: 0.5–5.0 in half-star increments → round to 1–5 integer */
function parseRating(raw: string): number | null {
	if (!raw) return null;
	const n = parseFloat(raw);
	if (!Number.isFinite(n) || n < 0.5 || n > 5) return null;
	return Math.round(n);
}

/** Letterboxd dates are YYYY-MM-DD (ISO 8601) */
function parseDate(raw: string): Date | null {
	if (!raw) return null;
	const d = new Date(raw);
	return Number.isFinite(d.getTime()) ? d : null;
}

// ---------------------------------------------------------------------------
// Dedup: diary.csv can have multiple entries for the same film (rewatches)
// Keep only the latest entry per title+year.
// ---------------------------------------------------------------------------

function deduplicateByLatestWatch(items: LetterboxdCandidate[]): LetterboxdCandidate[] {
	const seen = new Map<string, LetterboxdCandidate>();
	for (const item of items) {
		const key = `${item.title.toLowerCase()}::${item.releaseYear ?? ''}`;
		const existing = seen.get(key);
		if (!existing) {
			seen.set(key, item);
			continue;
		}
		// Keep whichever has the later completedAt (or the new one if dates are equal/null)
		const existingTime = existing.completedAt?.getTime() ?? 0;
		const newTime = item.completedAt?.getTime() ?? 0;
		if (newTime >= existingTime) {
			seen.set(key, item);
		}
	}
	return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LetterboxdParseError {
	type: 'unrecognized_format';
}

type LetterboxdParseResult =
	| { ok: true; items: LetterboxdCandidate[]; fileType: LetterboxdFileType }
	| { ok: false; error: LetterboxdParseError };

/**
 * Prompt the user to indicate whether this is a watchlist file.
 * Since watched.csv and watchlist.csv have identical headers,
 * the caller must set `isWatchlist` when the user indicates so.
 */
export function parseLetterboxdCsv(
	csvText: string,
	isWatchlist: boolean = false
): LetterboxdParseResult {
	const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (h) => h.trim()
	});

	if (data.length === 0 && errors.length > 0) {
		return { ok: false, error: { type: 'unrecognized_format' } };
	}

	const headers = data.length > 0 ? new Set(Object.keys(data[0])) : new Set<string>();
	const sig = detectFileType(headers);
	if (!sig) {
		return { ok: false, error: { type: 'unrecognized_format' } };
	}

	// Override status for watchlist files
	const defaultStatus: MediaStatus =
		isWatchlist || sig.type === 'watchlist' ? 'wishlist' : sig.status;
	const fileType: LetterboxdFileType = isWatchlist ? 'watchlist' : sig.type;

	const items: LetterboxdCandidate[] = [];

	for (const row of data) {
		const title = row['Name']?.trim();
		if (!title) continue;

		// Prefer 'Watched Date' for diary, fall back to 'Date' (entry creation date)
		const dateStr = row['Watched Date'] ?? row['Date'] ?? '';

		items.push({
			source: 'letterboxd',
			title,
			releaseYear: parseYear(row['Year'] ?? ''),
			status: defaultStatus,
			rating: parseRating(row['Rating'] ?? ''),
			coverUrl: null, // populated during enrichment
			completedAt: defaultStatus === 'completed' ? parseDate(dateStr) : null,
			duplicate: false,
			meta: {}
		});
	}

	// Deduplicate diary rewatches (keep latest)
	const deduped = fileType === 'diary' ? deduplicateByLatestWatch(items) : items;

	return { ok: true, items: deduped, fileType };
}
