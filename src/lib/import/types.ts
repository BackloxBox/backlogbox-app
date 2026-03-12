import type { MediaStatus, BookMetaFields, MovieMetaFields } from '$lib/types';

// ---------------------------------------------------------------------------
// Import sources
// ---------------------------------------------------------------------------

export const IMPORT_SOURCES = ['goodreads', 'letterboxd'] as const;
export type ImportSource = (typeof IMPORT_SOURCES)[number];

// ---------------------------------------------------------------------------
// Parsed import candidates — discriminated by media type
// ---------------------------------------------------------------------------

/** Base fields shared across all import candidates */
interface ImportCandidateBase {
	/** Original title from the source */
	title: string;
	releaseYear: number | null;
	status: MediaStatus;
	/** Rating on our 1–5 scale, null if unrated */
	rating: number | null;
	/** Pre-populated cover URL (e.g. from ISBN), null if needs enrichment */
	coverUrl: string | null;
	/** Date the user completed the item (read/watched), null if unknown */
	completedAt: Date | null;
	/** Whether this item already exists in the user's library */
	duplicate: boolean;
}

export interface GoodreadsCandidate extends ImportCandidateBase {
	source: 'goodreads';
	meta: Pick<BookMetaFields, 'author' | 'isbn' | 'pageCount'>;
}

export interface LetterboxdCandidate extends ImportCandidateBase {
	source: 'letterboxd';
	meta: Pick<MovieMetaFields, never>;
}

/** Discriminated union of all import candidates */
export type ImportCandidate = GoodreadsCandidate | LetterboxdCandidate;

// ---------------------------------------------------------------------------
// Import result from server
// ---------------------------------------------------------------------------

export interface ImportResult {
	imported: number;
	duplicatesSkipped: number;
}
