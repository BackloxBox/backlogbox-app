import { describe, it, expect } from 'vitest';
import { match } from './listSlug';

describe('listSlug param matcher', () => {
	it.each(['my-list', 'a', 'abc123', 'my-cool-list-2', '0-start'])('accepts "%s"', (param) => {
		expect(match(param)).toBe(true);
	});

	it.each([
		'-starts-with-hyphen',
		'My-List', // uppercase
		'my_list', // underscore
		'my list', // space
		'', // empty
		'a'.repeat(65) // 65 chars (max 64)
	])('rejects "%s"', (param) => {
		expect(match(param)).toBe(false);
	});

	it('accepts max length (64 chars)', () => {
		expect(match('a' + 'b'.repeat(63))).toBe(true);
	});
});
