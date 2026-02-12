import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

/**
 * Lazy DB singleton — deferred via Proxy so the connection is only
 * created on first property access, not at import time.
 * This avoids crashing during SvelteKit's postbuild analysis in CI
 * where DATABASE_URL is unavailable.
 */

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy({} as never, {
	get(_, prop) {
		if (!_db) {
			if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
			_db = drizzle(postgres(env.DATABASE_URL), { schema });
		}
		return Reflect.get(_db, prop);
	}
});
