import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pgCoreMock, drizzleOrmMock } from './test-helpers';

// ---------------------------------------------------------------------------
// Mock drizzle-orm and drizzle-orm/pg-core via shared helpers
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm/pg-core', () => pgCoreMock());
vi.mock('drizzle-orm', () => drizzleOrmMock());

// ---------------------------------------------------------------------------
// Mock the db singleton
// ---------------------------------------------------------------------------

const mockFindFirst = vi.fn();
const mockTxInsert = vi.fn().mockReturnValue({
	values: vi.fn().mockReturnValue({
		onConflictDoUpdate: vi.fn()
	})
});
const mockTransaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
	await fn({ insert: mockTxInsert });
});
const mockDeleteWhere = vi.fn();

vi.mock('./index', () => ({
	db: {
		query: {
			customListItem: { findFirst: (...args: unknown[]) => mockFindFirst(...args) }
		},
		transaction: (...args: unknown[]) => mockTransaction(...args),
		delete: vi.fn().mockReturnValue({ where: (...args: unknown[]) => mockDeleteWhere(...args) })
	}
}));

import { upsertFieldValues, deleteFieldValue } from './custom-list-queries';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('upsertFieldValues — item-list verification', () => {
	beforeEach(() => vi.clearAllMocks());

	it('no-ops when item does not belong to list', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		await upsertFieldValues('item-1', 'list-wrong', [{ fieldId: 'f1', value: 'v1' }]);

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockTransaction).not.toHaveBeenCalled();
	});

	it('upserts values when item belongs to list', async () => {
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });

		await upsertFieldValues('item-1', 'list-1', [{ fieldId: 'f1', value: 'v1' }]);

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockTransaction).toHaveBeenCalledOnce();
	});

	it('no-ops on empty values without hitting DB', async () => {
		await upsertFieldValues('item-1', 'list-1', []);

		expect(mockFindFirst).not.toHaveBeenCalled();
		expect(mockTransaction).not.toHaveBeenCalled();
	});
});

describe('deleteFieldValue — item-list verification', () => {
	beforeEach(() => vi.clearAllMocks());

	it('no-ops when item does not belong to list', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		await deleteFieldValue('item-1', 'list-wrong', 'field-1');

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockDeleteWhere).not.toHaveBeenCalled();
	});

	it('deletes when item belongs to list', async () => {
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });

		await deleteFieldValue('item-1', 'list-1', 'field-1');

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockDeleteWhere).toHaveBeenCalledOnce();
	});
});
