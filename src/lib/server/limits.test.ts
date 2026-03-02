import { describe, it, expect } from 'vitest';
import { getLimits, FREE_LIMITS, PAID_LIMITS } from './limits';

describe('getLimits', () => {
	it('returns free limits for "free" access level', () => {
		const limits = getLimits('free');

		expect(limits.maxActiveBoards).toBe(3);
		expect(limits.maxItemsPerBoard).toBe(20);
		expect(limits.maxCustomLists).toBe(0);
		expect(limits.hasNotes).toBe(false);
		expect(limits.hasWrapped).toBe(false);
		expect(limits.hasRecommendations).toBe(false);
	});

	it('returns paid limits for "paid" access level', () => {
		const limits = getLimits('paid');

		expect(limits.maxActiveBoards).toBe(5);
		expect(limits.maxItemsPerBoard).toBe(Infinity);
		expect(limits.maxCustomLists).toBe(5);
		expect(limits.hasNotes).toBe(true);
		expect(limits.hasWrapped).toBe(true);
		expect(limits.hasRecommendations).toBe(true);
	});

	it('returns free limits for "none" access level', () => {
		const limits = getLimits('none');

		expect(limits.maxActiveBoards).toBe(3);
		expect(limits.maxItemsPerBoard).toBe(20);
	});

	it('getLimits("free") returns the FREE_LIMITS constant', () => {
		expect(getLimits('free')).toBe(FREE_LIMITS);
	});

	it('getLimits("paid") returns the PAID_LIMITS constant', () => {
		expect(getLimits('paid')).toBe(PAID_LIMITS);
	});
});
