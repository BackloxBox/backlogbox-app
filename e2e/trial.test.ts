import { expect, test } from '@playwright/test';
import { createTestUser, authenticate, cleanupTestUsers, closeDb } from './helpers/auth';

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

const SUITE = 'trial';

test.afterAll(async () => {
	await cleanupTestUsers(SUITE);
	await closeDb();
});

// ---------------------------------------------------------------------------
// Helper: days from now
// ---------------------------------------------------------------------------

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

// ---------------------------------------------------------------------------
// Access control: auth + soft-delete
// ---------------------------------------------------------------------------

test.describe('access control', () => {
	test('unsubscribed user without trial lands on free tier (dashboard)', async ({
		context,
		page
	}) => {
		const user = await createTestUser({
			suite: SUITE,
			subscribed: false,
			trialEndsAt: null,
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Free users now stay in the app — no redirect to /subscribe
		expect(page.url()).toContain('/dashboard');
	});

	test('user with active trial can access /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});

	test('user with expired trial stays in app as free tier', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Soft-lands on free tier — stays on dashboard
		expect(page.url()).toContain('/dashboard');
	});

	test('subscribed user can access /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});

	test('soft-deleted user redirects to /subscribe', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true, deletedAt: new Date() });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForURL(/\/subscribe/);

		expect(page.url()).toContain('/subscribe');
	});
});

// ---------------------------------------------------------------------------
// Trial banner visibility
// ---------------------------------------------------------------------------

test.describe('trial banner', () => {
	test('shows trial days remaining in sidebar', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const banner = page.locator('a[href="/subscribe"]').filter({ hasText: /days? left in trial/ });
		await expect(banner).toBeVisible();
	});

	test('no trial banner for subscribed user', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const banner = page.locator('a[href="/subscribe"]').filter({ hasText: /days? left in trial/ });
		await expect(banner).not.toBeVisible();
	});

	test('no trial banner for converted user with remaining trial', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			subscribed: true,
			trialEndsAt: daysFromNow(10)
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const banner = page.locator('a[href="/subscribe"]').filter({ hasText: /days? left in trial/ });
		await expect(banner).not.toBeVisible();
	});

	test('shows free-tier upgrade banner when trial expired', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-5),
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const upgradeBanner = page
			.locator('a[href="/subscribe"]')
			.filter({ hasText: /Upgrade for full access/ });
		await expect(upgradeBanner).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Subscribe page copy
// ---------------------------------------------------------------------------

test.describe('subscribe page copy', () => {
	test('shows trial-expired messaging for expired trial user', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, trialEndsAt: daysFromNow(-5) });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=Your trial has ended')).toBeVisible();
	});

	test('shows active trial messaging for trial user', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=days left in your trial')).toBeVisible();
	});

	test('redirects subscribed user to /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForURL(/\/dashboard/);

		expect(page.url()).toContain('/dashboard');
	});

	test('shows free vs pro comparison table', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, trialEndsAt: daysFromNow(-5) });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=Compare plans')).toBeVisible();
		await expect(page.locator('table')).toBeVisible();
	});
});
