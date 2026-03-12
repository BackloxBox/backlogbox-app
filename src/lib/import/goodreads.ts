import Papa from 'papaparse';
import type { MediaStatus } from '$lib/types';
import type { GoodreadsCandidate } from './types';

// ---------------------------------------------------------------------------
// Goodreads CSV column names
// ---------------------------------------------------------------------------

const REQUIRED_HEADERS = ['Title', 'Exclusive Shelf'] as const;

// ---------------------------------------------------------------------------
// Shelf → status mapping
// ---------------------------------------------------------------------------

const SHELF_STATUS: Record<string, MediaStatus> = {
	read: 'completed',
	'currently-reading': 'in_progress',
	'to-read': 'backlog'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Goodreads wraps ISBNs in an Excel-style formula: `="0123456789"`.
 * Strip the `="` prefix and trailing `"` to get the bare value.
 */
function cleanIsbn(raw: string): string | null {
	if (!raw) return null;
	const cleaned = raw.replace(/^="?|"$/g, '').trim();
	return cleaned.length > 0 ? cleaned : null;
}

function parseYear(raw: string): number | null {
	const n = parseInt(raw, 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePageCount(raw: string): number | null {
	const n = parseInt(raw, 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** Goodreads dates are YYYY/MM/DD */
function parseDate(raw: string): Date | null {
	if (!raw) return null;
	const [y, m, d] = raw.split('/').map(Number);
	if (!y || !m || !d) return null;
	const date = new Date(y, m - 1, d);
	return Number.isFinite(date.getTime()) ? date : null;
}

/** Goodreads rating: 1–5 integer, 0 means unrated */
function parseRating(raw: string): number | null {
	const n = parseInt(raw, 10);
	return n >= 1 && n <= 5 ? n : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GoodreadsParseError {
	type: 'missing_headers';
	missing: string[];
}

type GoodreadsParseResult =
	| { ok: true; items: GoodreadsCandidate[] }
	| { ok: false; error: GoodreadsParseError };

/**
 * Parse a Goodreads library export CSV and return import candidates.
 * Runs entirely client-side. Throws no exceptions — returns a result union.
 */
export function parseGoodreadsCsv(csvText: string): GoodreadsParseResult {
	const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (h) => h.trim()
	});

	// Bail on catastrophic parse errors (no rows at all)
	if (data.length === 0 && errors.length > 0) {
		return { ok: false, error: { type: 'missing_headers', missing: [...REQUIRED_HEADERS] } };
	}

	// Validate required headers
	const headers = data.length > 0 ? Object.keys(data[0]) : [];
	const headerSet = new Set(headers);
	const missing = REQUIRED_HEADERS.filter((h) => !headerSet.has(h));
	if (missing.length > 0) {
		return { ok: false, error: { type: 'missing_headers', missing } };
	}

	const items: GoodreadsCandidate[] = [];

	for (const row of data) {
		const title = row['Title']?.trim();
		if (!title) continue;

		const shelf = row['Exclusive Shelf']?.trim().toLowerCase() ?? '';
		const status: MediaStatus = SHELF_STATUS[shelf] ?? 'backlog';

		const isbn = cleanIsbn(row['ISBN13'] ?? '') ?? cleanIsbn(row['ISBN'] ?? '');

		items.push({
			source: 'goodreads',
			title,
			releaseYear:
				parseYear(row['Original Publication Year'] ?? '') ?? parseYear(row['Year Published'] ?? ''),
			status,
			rating: parseRating(row['My Rating'] ?? ''),
			coverUrl: null, // populated during enrichment
			completedAt: parseDate(row['Date Read'] ?? ''),
			duplicate: false,
			meta: {
				author: row['Author']?.trim() || null,
				isbn,
				pageCount: parsePageCount(row['Number of Pages'] ?? '')
			}
		});
	}

	return { ok: true, items };
}
