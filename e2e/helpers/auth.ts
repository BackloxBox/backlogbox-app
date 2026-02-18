/**
 * E2E test helpers for creating authenticated users directly in the DB.
 *
 * Bypasses the signup/verification flow by inserting user + session rows
 * and setting the session cookie on the Playwright browser context.
 *
 * Requires DATABASE_URL to be set (available in CI via the postgres service).
 */
import postgres from 'postgres';
import type { BrowserContext } from '@playwright/test';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// DB connection (lazy, shared across tests in a worker)
// ---------------------------------------------------------------------------

let _sql: postgres.Sql | undefined;

function sql(): postgres.Sql {
	if (!_sql) {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL not set — required for E2E auth helpers');
		_sql = postgres(url, { max: 2 });
	}
	return _sql;
}

/** Close the DB connection. Call in globalTeardown or afterAll. */
export async function closeDb(): Promise<void> {
	if (_sql) {
		await _sql.end();
		_sql = undefined;
	}
}

// ---------------------------------------------------------------------------
// User creation
// ---------------------------------------------------------------------------

export interface TestUserOptions {
	/** Override user name. Default: "Test User" */
	name?: string;
	/** Override email. Default: random UUID @test.local */
	email?: string;
	/** Whether user has a paid subscription. Default: false */
	subscribed?: boolean;
	/** Whether user has freeAccess bypass. Default: false */
	freeAccess?: boolean;
	/** When the trial ends. Default: null (no trial) */
	trialEndsAt?: Date | null;
	/** When user was soft-deleted. Default: null */
	deletedAt?: Date | null;
	/** Whether email is verified. Default: true */
	emailVerified?: boolean;
}

export interface TestUser {
	id: string;
	email: string;
	sessionToken: string;
}

/**
 * Create a test user + session directly in the DB.
 * Returns the user ID and session token for cookie injection.
 */
export async function createTestUser(options: TestUserOptions = {}): Promise<TestUser> {
	const db = sql();
	const userId = randomUUID();
	const sessionId = randomUUID();
	const sessionToken = randomUUID();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

	const email = options.email ?? `test-${userId.slice(0, 8)}@test.local`;

	await db`
		INSERT INTO "user" (id, name, email, email_verified, subscribed, free_access, trial_ends_at, deleted_at, created_at, updated_at)
		VALUES (
			${userId},
			${options.name ?? 'Test User'},
			${email},
			${options.emailVerified ?? true},
			${options.subscribed ?? false},
			${options.freeAccess ?? false},
			${options.trialEndsAt ?? null},
			${options.deletedAt ?? null},
			${now},
			${now}
		)
	`;

	await db`
		INSERT INTO "session" (id, token, expires_at, user_id, created_at, updated_at)
		VALUES (
			${sessionId},
			${sessionToken},
			${expiresAt},
			${userId},
			${now},
			${now}
		)
	`;

	return { id: userId, email, sessionToken };
}

/**
 * Inject a Better Auth session cookie into a Playwright browser context.
 * After calling this, page navigations will be authenticated as the user.
 */
export async function authenticate(context: BrowserContext, sessionToken: string): Promise<void> {
	const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4173';
	const url = new URL(baseUrl);

	await context.addCookies([
		{
			name: 'better-auth.session_token',
			value: sessionToken,
			domain: url.hostname,
			path: '/',
			httpOnly: true,
			sameSite: 'Lax'
		}
	]);
}

/**
 * Clean up test users created during tests.
 * Deletes all users with @test.local emails (cascades to sessions).
 */
export async function cleanupTestUsers(): Promise<void> {
	const db = sql();
	await db`DELETE FROM "user" WHERE email LIKE '%@test.local'`;
}
