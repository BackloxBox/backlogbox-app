import { describe, it, expect } from 'vitest';
import { match } from './mediaType';

describe('mediaType param matcher', () => {
	it.each(['books', 'movies', 'series', 'games', 'podcasts'])('accepts "%s"', (slug) => {
		expect(match(slug)).toBe(true);
	});

	it.each(['book', 'movie', 'game', 'podcast', 'Books', 'MOVIES', '', 'music', 'anime'])(
		'rejects "%s"',
		(slug) => {
			expect(match(slug)).toBe(false);
		}
	);
});
