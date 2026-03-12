import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseGoodreadsCsv } from './goodreads';

const fixture = readFileSync(new URL('./fixtures/goodreads.csv', import.meta.url), 'utf-8');

describe('parseGoodreadsCsv', () => {
	it('parses all rows from a real Goodreads export', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.items).toHaveLength(5);
	});

	it('maps titles correctly (including quoted titles with commas)', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.items[0].title).toBe('Gideon the Ninth (The Locked Tomb #1)');
		expect(result.items[2].title).toBe('Tomorrow, and Tomorrow, and Tomorrow');
	});

	it('cleans ISBN from Goodreads ="" quoting', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// ISBN13 preferred when available
		expect(result.items[0].meta.isbn).toBe('9781250313195');
		// Falls back to ISBN when ISBN13 is empty
		expect(result.items[3].meta.isbn).toBe('9780486272634');
		// Both empty → null
		expect(result.items[1].meta.isbn).toBeNull();
	});

	it('maps Exclusive Shelf to correct status', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// 'read' → completed
		expect(result.items[0].status).toBe('completed');
		// 'to-read' → backlog
		expect(result.items[3].status).toBe('backlog');
		// 'currently-reading' → in_progress
		expect(result.items[4].status).toBe('in_progress');
	});

	it('maps ratings correctly (0 = null, 1-5 preserved)', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.items[0].rating).toBe(3);
		expect(result.items[1].rating).toBeNull(); // rating 0
		expect(result.items[2].rating).toBe(5);
	});

	it('prefers Original Publication Year over Year Published', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// Flatland: Year Published = 1992, Original Publication Year = 1884
		expect(result.items[3].releaseYear).toBe(1884);
	});

	it('parses Date Read into completedAt', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.items[0].completedAt).toEqual(new Date(2020, 9, 25)); // 2020/10/25
		expect(result.items[3].completedAt).toBeNull(); // to-read, no Date Read
	});

	it('extracts author and page count', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.items[0].meta.author).toBe('Tamsyn Muir');
		expect(result.items[0].meta.pageCount).toBe(448);
	});

	it('returns error for CSV missing required headers', () => {
		const result = parseGoodreadsCsv('Name,Rating\nFoo,5');
		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error.type).toBe('missing_headers');
		expect(result.error.missing).toContain('Title');
	});

	it('returns error for empty CSV', () => {
		const result = parseGoodreadsCsv('');
		expect(result.ok).toBe(false);
	});

	it('sets source to goodreads on all items', () => {
		const result = parseGoodreadsCsv(fixture);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		for (const item of result.items) {
			expect(item.source).toBe('goodreads');
		}
	});
});
