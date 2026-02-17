import { describe, it, expect } from 'vitest';
import { slugToMediaType, mediaTypeToSlug, MEDIA_TYPES, MEDIA_TYPE_SLUGS } from './types';

describe('slugToMediaType', () => {
	it.each([
		['books', 'book'],
		['movies', 'movie'],
		['series', 'series'],
		['games', 'game'],
		['podcasts', 'podcast']
	] as const)('maps "%s" to "%s"', (slug, type) => {
		expect(slugToMediaType(slug)).toBe(type);
	});

	it('returns undefined for unknown slug', () => {
		expect(slugToMediaType('anime')).toBeUndefined();
	});

	it('returns undefined for singular form', () => {
		expect(slugToMediaType('book')).toBeUndefined();
	});
});

describe('mediaTypeToSlug', () => {
	it.each([
		['book', 'books'],
		['movie', 'movies'],
		['series', 'series'],
		['game', 'games'],
		['podcast', 'podcasts']
	] as const)('maps "%s" to "%s"', (type, slug) => {
		expect(mediaTypeToSlug(type)).toBe(slug);
	});
});

describe('constants consistency', () => {
	it('MEDIA_TYPES and MEDIA_TYPE_SLUGS have same length', () => {
		expect(MEDIA_TYPES.length).toBe(MEDIA_TYPE_SLUGS.length);
	});

	it('every media type has a slug roundtrip', () => {
		for (const type of MEDIA_TYPES) {
			const slug = mediaTypeToSlug(type);
			expect(slugToMediaType(slug)).toBe(type);
		}
	});
});
