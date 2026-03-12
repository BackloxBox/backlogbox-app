import * as v from 'valibot';
import { command } from '$app/server';
import { requirePaid } from '$lib/server/auth-guard';
import {
	createMediaItem,
	getExistingTitlesForType,
	updateMediaItemFields,
	updateMediaItemMeta
} from '$lib/server/db/queries';
import { log } from '$lib/server/logger';
import { tmdbMovieProvider } from '$lib/server/search/tmdb';
import { openLibraryLimiter } from '$lib/server/search/rate-limiter';
import { resilientFetch } from '$lib/server/search/fetch';
import type { ImportResult } from '$lib/import/types';
import type { BookMetaFields, MovieMetaFields } from '$lib/types';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const bookItemSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1)),
	releaseYear: v.nullable(v.number()),
	status: v.picklist(['wishlist', 'backlog', 'in_progress', 'on_hold', 'completed', 'abandoned']),
	rating: v.nullable(v.number()),
	completedAt: v.nullable(v.string()), // ISO date string
	author: v.nullable(v.string()),
	isbn: v.nullable(v.string()),
	pageCount: v.nullable(v.number())
});

const movieItemSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1)),
	releaseYear: v.nullable(v.number()),
	status: v.picklist(['wishlist', 'backlog', 'in_progress', 'on_hold', 'completed', 'abandoned']),
	rating: v.nullable(v.number()),
	completedAt: v.nullable(v.string()) // ISO date string
});

const importBooksSchema = v.object({
	source: v.literal('goodreads'),
	items: v.array(bookItemSchema)
});

const importMoviesSchema = v.object({
	source: v.literal('letterboxd'),
	items: v.array(movieItemSchema)
});

const importSchema = v.variant('source', [importBooksSchema, importMoviesSchema]);

// ---------------------------------------------------------------------------
// Enrichment (fire-and-forget)
// ---------------------------------------------------------------------------

interface EnrichableItem {
	id: string;
	userId: string;
	title: string;
	releaseYear: number | null;
}

const OL_USER_AGENT = 'BacklogBox/1.0 (https://github.com/backlogbox)';

/**
 * Verify that an OpenLibrary cover URL returns an actual image
 * (not the transparent 1x1 pixel fallback). Returns the URL if valid, null otherwise.
 */
async function verifyOpenLibraryCover(isbn: string): Promise<string | null> {
	const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
	try {
		await openLibraryLimiter.acquire();
		const res = await resilientFetch(url, {
			method: 'HEAD',
			headers: { 'User-Agent': OL_USER_AGENT }
		});
		// OpenLibrary returns 404 when ?default=false and no cover exists
		return res.ok ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null;
	} catch {
		return null;
	}
}

/** Enrich imported books: resolve cover URLs from ISBNs via OpenLibrary */
function enrichBooks(items: Array<EnrichableItem & { isbn: string | null }>): void {
	const toEnrich = items.filter((i) => i.isbn);
	if (toEnrich.length === 0) return;

	// Fire-and-forget — no await
	(async () => {
		for (const item of toEnrich) {
			try {
				const coverUrl = await verifyOpenLibraryCover(item.isbn!);
				if (coverUrl) {
					await updateMediaItemFields(item.id, item.userId, { coverUrl });
				}
			} catch (err) {
				log.warn({ itemId: item.id, isbn: item.isbn, err }, 'book enrichment failed');
			}
		}
		log.info({ total: toEnrich.length }, 'book enrichment complete');
	})();
}

/** Enrich imported movies: search TMDB for cover, genre, tmdbId */
function enrichMovies(items: EnrichableItem[]): void {
	if (items.length === 0) return;

	// Fire-and-forget — no await
	(async () => {
		for (const item of items) {
			try {
				const query = item.releaseYear ? `${item.title} ${item.releaseYear}` : item.title;
				const results = await tmdbMovieProvider.search(query);
				if (results.length === 0) continue;

				// Pick best match: prefer exact year match
				const match = results.find((r) => r.releaseYear === item.releaseYear) ?? results[0];

				const fields: Partial<Parameters<typeof updateMediaItemFields>[2]> = {};
				if (match.coverUrl) fields.coverUrl = match.coverUrl;

				if (Object.keys(fields).length > 0) {
					await updateMediaItemFields(item.id, item.userId, fields);
				}

				const meta: Partial<MovieMetaFields> = {};
				if (match.meta.tmdbId) meta.tmdbId = match.meta.tmdbId;
				if (match.meta.genre) meta.genre = match.meta.genre;
				if (match.meta.director) meta.director = match.meta.director;

				if (Object.keys(meta).length > 0) {
					await updateMediaItemMeta(item.id, item.userId, 'movie', meta);
				}
			} catch (err) {
				log.warn({ itemId: item.id, title: item.title, err }, 'movie enrichment failed');
			}
		}
		log.info({ total: items.length }, 'movie enrichment complete');
	})();
}

// ---------------------------------------------------------------------------
// Import command
// ---------------------------------------------------------------------------

export const importItems = command(importSchema, async (data) => {
	const userId = requirePaid();

	if (data.source === 'goodreads') {
		const titles = data.items.map((i) => i.title);
		const existing = await getExistingTitlesForType(userId, 'book', titles);

		let imported = 0;
		let duplicatesSkipped = 0;
		const enrichQueue: Array<EnrichableItem & { isbn: string | null }> = [];

		for (const item of data.items) {
			if (existing.has(item.title.toLowerCase())) {
				duplicatesSkipped++;
				continue;
			}

			try {
				const meta: BookMetaFields = {
					author: item.author,
					isbn: item.isbn,
					pageCount: item.pageCount,
					genre: null,
					description: null,
					language: null,
					publisher: null
				};

				const created = await createMediaItem(
					{
						userId,
						type: 'book',
						title: item.title,
						coverUrl: null,
						releaseYear: item.releaseYear,
						status: item.status,
						rating: item.rating,
						completedAt: item.completedAt ? new Date(item.completedAt) : null,
						sortOrder: 0
					},
					meta,
					'book'
				);

				enrichQueue.push({
					id: created.id,
					userId,
					title: item.title,
					releaseYear: item.releaseYear,
					isbn: item.isbn
				});
				imported++;
			} catch (err) {
				log.warn({ title: item.title, source: 'goodreads', err }, 'import item failed');
			}
		}

		// Kick off async enrichment
		enrichBooks(enrichQueue);

		return { imported, duplicatesSkipped } satisfies ImportResult;
	}

	// Letterboxd (movies)
	const titles = data.items.map((i) => i.title);
	const existing = await getExistingTitlesForType(userId, 'movie', titles);

	let imported = 0;
	let duplicatesSkipped = 0;
	const enrichQueue: EnrichableItem[] = [];

	for (const item of data.items) {
		if (existing.has(item.title.toLowerCase())) {
			duplicatesSkipped++;
			continue;
		}

		try {
			const created = await createMediaItem(
				{
					userId,
					type: 'movie',
					title: item.title,
					coverUrl: null,
					releaseYear: item.releaseYear,
					status: item.status,
					rating: item.rating,
					completedAt: item.completedAt ? new Date(item.completedAt) : null,
					sortOrder: 0
				},
				{
					tmdbId: null,
					director: null,
					genre: null,
					description: null,
					cast: null,
					runtime: null,
					watchingOn: null
				} satisfies MovieMetaFields,
				'movie'
			);

			enrichQueue.push({
				id: created.id,
				userId,
				title: item.title,
				releaseYear: item.releaseYear
			});
			imported++;
		} catch (err) {
			log.warn({ title: item.title, source: 'letterboxd', err }, 'import item failed');
		}
	}

	// Kick off async enrichment
	enrichMovies(enrichQueue);

	return { imported, duplicatesSkipped } satisfies ImportResult;
});
