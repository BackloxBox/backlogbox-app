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
const mockFindMany = vi.fn();
const mockInsertReturning = vi.fn();
const mockDeleteReturning = vi.fn();

const mockOnConflict = vi.fn();
const mockInsertValues = vi.fn().mockReturnValue({
	returning: mockInsertReturning,
	onConflictDoUpdate: mockOnConflict
});
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

const mockDeleteWhere = vi.fn().mockReturnValue({ returning: mockDeleteReturning });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

vi.mock('./index', () => ({
	db: {
		query: {
			mediaItem: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
			mediaNote: {
				findFirst: (...args: unknown[]) => mockFindFirst(...args),
				findMany: (...args: unknown[]) => mockFindMany(...args)
			}
		},
		insert: (...args: unknown[]) => mockInsert(...args),
		delete: (...args: unknown[]) => mockDelete(...args)
	}
}));

import { updateMediaItemMeta, getNotesByItem, createNote, deleteNoteById } from './queries';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('updateMediaItemMeta — ownership check', () => {
	beforeEach(() => vi.clearAllMocks());

	it('skips upsert when item does not belong to user', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		await updateMediaItemMeta('item-1', 'wrong-user', 'book', { author: 'X' });

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('performs upsert when item belongs to user', async () => {
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });

		await updateMediaItemMeta('item-1', 'user-1', 'book', { author: 'Y' });

		expect(mockFindFirst).toHaveBeenCalledOnce();
		expect(mockInsert).toHaveBeenCalledOnce();
	});

	it('no-ops on empty meta without hitting DB', async () => {
		await updateMediaItemMeta('item-1', 'user-1', 'book', {});

		expect(mockFindFirst).not.toHaveBeenCalled();
		expect(mockInsert).not.toHaveBeenCalled();
	});
});

describe('getNotesByItem — ownership check', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns empty array when item not owned', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		const result = await getNotesByItem('item-1', 'wrong-user');

		expect(result).toEqual([]);
		expect(mockFindMany).not.toHaveBeenCalled();
	});

	it('returns notes when item owned', async () => {
		const mockNotes = [{ id: 'n1', content: 'test', mediaItemId: 'item-1' }];
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });
		mockFindMany.mockResolvedValueOnce(mockNotes);

		const result = await getNotesByItem('item-1', 'user-1');

		expect(result).toEqual(mockNotes);
		expect(mockFindMany).toHaveBeenCalledOnce();
	});
});

describe('createNote — ownership check', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns null when item not owned', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		const result = await createNote('item-1', 'wrong-user', 'test content');

		expect(result).toBeNull();
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('creates note when item owned', async () => {
		const mockNote = { id: 'n1', mediaItemId: 'item-1', content: 'test' };
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });
		mockInsertReturning.mockResolvedValueOnce([mockNote]);

		const result = await createNote('item-1', 'user-1', 'test');

		expect(result).toEqual(mockNote);
		expect(mockInsert).toHaveBeenCalledOnce();
	});
});

describe('deleteNoteById — ownership check', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns false when note does not exist', async () => {
		mockFindFirst.mockResolvedValueOnce(undefined);

		const result = await deleteNoteById('note-1', 'user-1');

		expect(result).toBe(false);
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('returns false when note exists but item not owned', async () => {
		mockFindFirst.mockResolvedValueOnce({ id: 'note-1', mediaItemId: 'item-1' });
		mockFindFirst.mockResolvedValueOnce(undefined);

		const result = await deleteNoteById('note-1', 'wrong-user');

		expect(result).toBe(false);
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deletes note when ownership verified', async () => {
		mockFindFirst.mockResolvedValueOnce({ id: 'note-1', mediaItemId: 'item-1' });
		mockFindFirst.mockResolvedValueOnce({ id: 'item-1' });
		mockDeleteReturning.mockResolvedValueOnce([{ id: 'note-1' }]);

		const result = await deleteNoteById('note-1', 'user-1');

		expect(result).toBe(true);
		expect(mockDelete).toHaveBeenCalledOnce();
	});
});
