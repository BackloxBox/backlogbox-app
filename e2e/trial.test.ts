import { expect, test } from '@playwright/test';
import { createTestUser, authenticate, cleanupTestUsers, closeDb } from './helpers/auth';

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

test.afterAll(async () => {
	await cleanupTestUsers();
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
// Subscription / trial redirect tests
// ---------------------------------------------------------------------------

test.describe('trial access control', () => {
	test('unsubscribed user without trial redirects to /subscribe', async ({ context, page }) => {
		const user = await createTestUser({ subscribed: false, trialEndsAt: null });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForURL(/\/subscribe/);

		expect(page.url()).toContain('/subscribe');
	});

	test('user with active trial can access /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		// Should stay on dashboard, not redirect
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});

	test('user with expired trial redirects to /subscribe', async ({ context, page }) => {
		const user = await createTestUser({ trialEndsAt: daysFromNow(-1) });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForURL(/\/subscribe/);

		expect(page.url()).toContain('/subscribe');
	});

	test('subscribed user can access /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});

	test('soft-deleted user redirects to /subscribe', async ({ context, page }) => {
		const user = await createTestUser({
			subscribed: true,
			deletedAt: new Date()
		});
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
		const user = await createTestUser({ trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// The trial banner shows "X days left in trial" as a link
		const banner = page.locator('a[href="/subscribe"]').filter({ hasText: /days? left in trial/ });
		await expect(banner).toBeVisible();
	});

	test('no trial banner for subscribed user', async ({ context, page }) => {
		const user = await createTestUser({ subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const banner = page.locator('a[href="/subscribe"]').filter({ hasText: /days? left in trial/ });
		await expect(banner).not.toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Subscribe page messaging
// ---------------------------------------------------------------------------

test.describe('subscribe page copy', () => {
	test('shows trial-expired messaging for expired trial user', async ({ context, page }) => {
		const user = await createTestUser({ trialEndsAt: daysFromNow(-5) });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=Your trial has ended')).toBeVisible();
		await expect(page.locator('text=Your data is safe')).toBeVisible();
	});

	test('shows active trial messaging for trial user', async ({ context, page }) => {
		const user = await createTestUser({ trialEndsAt: daysFromNow(10) });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=days left in your trial')).toBeVisible();
	});

	test('redirects subscribed user to /dashboard', async ({ context, page }) => {
		const user = await createTestUser({ subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/subscribe');
		await page.waitForURL(/\/dashboard/);

		expect(page.url()).toContain('/dashboard');
	});
});
