import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseLetterboxdCsv } from './letterboxd';

const diaryFixture = readFileSync(
	new URL('./fixtures/letterboxd-diary.csv', import.meta.url),
	'utf-8'
);
const watchedFixture = readFileSync(
	new URL('./fixtures/letterboxd-watched.csv', import.meta.url),
	'utf-8'
);
const watchlistFixture = readFileSync(
	new URL('./fixtures/letterboxd-watchlist.csv', import.meta.url),
	'utf-8'
);
const ratingsFixture = readFileSync(
	new URL('./fixtures/letterboxd-ratings.csv', import.meta.url),
	'utf-8'
);

describe('parseLetterboxdCsv', () => {
	describe('diary.csv', () => {
		it('detects diary format and parses items', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.fileType).toBe('diary');
			// 5 rows but "My Small Land" appears twice (rewatch) → deduplicated to 4
			expect(result.items).toHaveLength(4);
		});

		it('deduplicates rewatches keeping the latest entry', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const mySmallLand = result.items.find((i) => i.title === 'My Small Land');
			expect(mySmallLand).toBeDefined();
			// Second watch (2024-08-09) should be kept, not the first (2023-07-15)
			expect(mySmallLand?.completedAt).toEqual(new Date('2024-08-09'));
			// Rating from the later watch (3.5 → rounds to 4)
			expect(mySmallLand?.rating).toBe(4);
		});

		it('sets all items to completed status', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			for (const item of result.items) {
				expect(item.status).toBe('completed');
			}
		});

		it('rounds half-star ratings to integers', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const marsOne = result.items.find((i) => i.title === 'Mars One');
			expect(marsOne?.rating).toBe(5); // 4.5 → 5

			const ironClaw = result.items.find((i) => i.title === 'The Iron Claw');
			expect(ironClaw?.rating).toBe(4); // 4 → 4
		});

		it('handles missing ratings as null', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const fallenLeaves = result.items.find((i) => i.title === 'Fallen Leaves');
			expect(fallenLeaves?.rating).toBeNull();
		});

		it('uses Watched Date over Date for completedAt', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const marsOne = result.items.find((i) => i.title === 'Mars One');
			// Watched Date is 2023-12-03 (same as Date in this case)
			expect(marsOne?.completedAt).toEqual(new Date('2023-12-03'));
		});
	});

	describe('watched.csv', () => {
		it('detects watched format', () => {
			const result = parseLetterboxdCsv(watchedFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.fileType).toBe('watched');
			expect(result.items).toHaveLength(3);
		});

		it('sets all items to completed status', () => {
			const result = parseLetterboxdCsv(watchedFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			for (const item of result.items) {
				expect(item.status).toBe('completed');
			}
		});

		it('handles titles with commas', () => {
			const result = parseLetterboxdCsv(watchedFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const dragon = result.items.find((i) => i.title === 'Goodbye, Dragon Inn');
			expect(dragon).toBeDefined();
			expect(dragon?.releaseYear).toBe(2003);
		});

		it('has null ratings (no Rating column)', () => {
			const result = parseLetterboxdCsv(watchedFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			for (const item of result.items) {
				expect(item.rating).toBeNull();
			}
		});
	});

	describe('watchlist.csv (isWatchlist flag)', () => {
		it('sets status to wishlist when isWatchlist is true', () => {
			const result = parseLetterboxdCsv(watchlistFixture, true);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.fileType).toBe('watchlist');
			expect(result.items).toHaveLength(2);
			for (const item of result.items) {
				expect(item.status).toBe('wishlist');
			}
		});

		it('sets completedAt to null for watchlist items', () => {
			const result = parseLetterboxdCsv(watchlistFixture, true);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			for (const item of result.items) {
				expect(item.completedAt).toBeNull();
			}
		});
	});

	describe('ratings.csv', () => {
		it('detects ratings format', () => {
			const result = parseLetterboxdCsv(ratingsFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.fileType).toBe('ratings');
			expect(result.items).toHaveLength(4);
		});

		it('maps half-star ratings correctly', () => {
			const result = parseLetterboxdCsv(ratingsFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const casablanca = result.items.find((i) => i.title === 'Casablanca');
			expect(casablanca?.rating).toBe(1);

			const citizenKane = result.items.find((i) => i.title === 'Citizen Kane');
			expect(citizenKane?.rating).toBe(4); // 3.5 → 4

			const dawnOfDead = result.items.find((i) => i.title === 'Dawn of the Dead');
			expect(dawnOfDead?.rating).toBe(5); // 4.5 → 5
		});
	});

	describe('error handling', () => {
		it('returns error for unrecognized format', () => {
			const result = parseLetterboxdCsv('Foo,Bar,Baz\n1,2,3');
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.type).toBe('unrecognized_format');
		});

		it('returns error for empty CSV', () => {
			const result = parseLetterboxdCsv('');
			expect(result.ok).toBe(false);
		});
	});

	describe('common fields', () => {
		it('sets source to letterboxd on all items', () => {
			const result = parseLetterboxdCsv(diaryFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			for (const item of result.items) {
				expect(item.source).toBe('letterboxd');
			}
		});

		it('parses release year', () => {
			const result = parseLetterboxdCsv(watchedFixture);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const bladeRunner = result.items.find((i) => i.title === 'Blade Runner');
			expect(bladeRunner?.releaseYear).toBe(1982);
		});
	});
});
