import { describe, it, expect } from 'vitest';
import { yearFromDate, yearFromTimestamp } from './utils';

describe('yearFromDate', () => {
	it('extracts year from ISO date', () => {
		expect(yearFromDate('2024-01-15')).toBe(2024);
	});

	it('extracts year from year-only string', () => {
		expect(yearFromDate('1999')).toBe(1999);
	});

	it('returns null for undefined', () => {
		expect(yearFromDate(undefined)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(yearFromDate('')).toBeNull();
	});

	it('returns null for non-numeric prefix', () => {
		expect(yearFromDate('abcd-01-01')).toBeNull();
	});
});

describe('yearFromTimestamp', () => {
	it('converts Unix seconds to year', () => {
		// 2024-01-01 00:00:00 UTC = 1704067200
		expect(yearFromTimestamp(1704067200)).toBe(2024);
	});

	it('handles epoch (1970)', () => {
		expect(yearFromTimestamp(0)).toBeNull(); // 0 is falsy
	});

	it('returns null for undefined', () => {
		expect(yearFromTimestamp(undefined)).toBeNull();
	});
});
