import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock drizzle-orm and drizzle-orm/pg-core so schema files can be imported
// ---------------------------------------------------------------------------

function colStub(): Record<string, unknown> {
	const self: Record<string, unknown> = {};
	const chain = () => self;
	self.notNull = chain;
	self.default = chain;
	self.defaultRandom = chain;
	self.defaultNow = chain;
	self.unique = chain;
	self.primaryKey = chain;
	self.references = chain;
	self.$onUpdate = chain;
	return self;
}

vi.mock('drizzle-orm/pg-core', () => {
	const col = () => colStub();
	return {
		pgTable: (name: string, columns: Record<string, unknown>) => {
			return { _tableName: name, ...columns };
		},
		pgEnum: (_name: string, values: string[]) => {
			const fn = () => colStub();
			fn.enumValues = values;
			return fn;
		},
		text: col,
		integer: col,
		boolean: col,
		timestamp: col,
		uuid: col,
		index: () => ({ on: () => ({}) }),
		unique: () => ({ on: () => ({}) })
	};
});

vi.mock('drizzle-orm', () => ({
	relations: () => ({}),
	and: (...args: unknown[]) => ({ _op: 'and', args }),
	eq: (a: unknown, b: unknown) => ({ _op: 'eq', a, b }),
	asc: (a: unknown) => ({ _op: 'asc', a }),
	desc: (a: unknown) => ({ _op: 'desc', a }),
	like: (a: unknown, b: unknown) => ({ _op: 'like', a, b }),
	count: () => ({ _op: 'count' })
}));

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
