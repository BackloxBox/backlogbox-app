import { describe, it, expect } from 'vitest';
import { match } from './username';

describe('username param matcher', () => {
	it.each(['@alice', '@bob42', '@a', '@' + 'x'.repeat(39)])('accepts "%s"', (param) => {
		expect(match(param)).toBe(true);
	});

	it.each([
		'alice', // missing @
		'@', // no chars after @
		'@Alice', // uppercase
		'@a-b', // hyphen
		'@a_b', // underscore
		'@a.b', // dot
		'@' + 'x'.repeat(40), // too long (40 chars)
		'', // empty
		'@hello world' // space
	])('rejects "%s"', (param) => {
		expect(match(param)).toBe(false);
	});
});
