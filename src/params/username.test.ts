import { describe, it, expect } from 'vitest';
import { match } from './username';

describe('username param matcher', () => {
	it.each(['@alice', '@bob42', '@abc', '@' + 'x'.repeat(39)])('accepts "%s"', (param) => {
		expect(match(param)).toBe(true);
	});

	it.each([
		'alice', // missing @
		'@', // no chars after @
		'@a', // too short (1 char)
		'@ab', // too short (2 chars)
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
