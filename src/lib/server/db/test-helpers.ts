/**
 * Shared test mocks for drizzle-orm and drizzle-orm/pg-core.
 *
 * Import and call `setupDrizzleMocks()` in vi.mock() blocks, or use
 * the exported mock factories directly.
 */
import { vi } from 'vitest';

/** Chainable column stub: col.notNull().default(...).unique().$onUpdate(...) etc. */
export function colStub(): Record<string, unknown> {
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

/** Mock implementation for drizzle-orm/pg-core */
export function pgCoreMock() {
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
}

/** Mock implementation for drizzle-orm (core operators) */
export function drizzleOrmMock() {
	return {
		relations: () => ({}),
		and: (...args: unknown[]) => ({ _op: 'and', args }),
		eq: (a: unknown, b: unknown) => ({ _op: 'eq', a, b }),
		desc: (a: unknown) => ({ _op: 'desc', a }),
		asc: (a: unknown) => ({ _op: 'asc', a }),
		gte: (a: unknown, b: unknown) => ({ _op: 'gte', a, b }),
		lt: (a: unknown, b: unknown) => ({ _op: 'lt', a, b }),
		like: (a: unknown, b: unknown) => ({ _op: 'like', a, b }),
		isNotNull: (a: unknown) => ({ _op: 'isNotNull', a }),
		isNull: (a: unknown) => ({ _op: 'isNull', a }),
		inArray: (a: unknown, b: unknown) => ({ _op: 'inArray', a, b }),
		count: () => ({ _op: 'count' }),
		sql: () => ({})
	};
}

/**
 * Register drizzle-orm mocks with vi.mock(). Call at module top-level.
 *
 * Usage:
 *   vi.mock('drizzle-orm/pg-core', () => pgCoreMock());
 *   vi.mock('drizzle-orm', () => drizzleOrmMock());
 */
export { vi };
