import { expect, test } from '@playwright/test';
import { createTestUser, authenticate, cleanupTestUsers, closeDb } from './helpers/auth';

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

const SUITE = 'freemium';

test.afterAll(async () => {
	await cleanupTestUsers(SUITE);
	await closeDb();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

// ---------------------------------------------------------------------------
// Choose-boards interstitial
// ---------------------------------------------------------------------------

test.describe('choose-boards interstitial', () => {
	test('free user with >3 interests and no freeBoards redirects to /choose-boards', async ({
		context,
		page
	}) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForURL(/\/choose-boards/);

		expect(page.url()).toContain('/choose-boards');
	});

	test('choose-boards shows heading and board cards', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/choose-boards');
		await page.waitForLoadState('networkidle');

		await expect(page.getByText('Choose your free boards')).toBeVisible();
		// Should show 4 board cards (one per interest)
		const cards = page.locator('button').filter({ hasText: /Books|Movies|Series|Games/ });
		expect(await cards.count()).toBe(4);
	});

	test('can select up to 3 boards and submit', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/choose-boards');
		await page.waitForLoadState('networkidle');

		// Select 3 boards
		await page.getByRole('button', { name: 'Books' }).click();
		await page.getByRole('button', { name: 'Movies' }).click();
		await page.getByRole('button', { name: 'Series' }).click();

		// Counter should show 3 / 3
		await expect(page.getByText('3 / 3 selected')).toBeVisible();

		// Submit button should be enabled
		const submitBtn = page.getByRole('button', { name: /Continue with 3 boards/ });
		await expect(submitBtn).toBeEnabled();

		// Submit
		await submitBtn.click();
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });

		expect(page.url()).toContain('/dashboard');
	});

	test('free user with <=3 interests skips interstitial', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie'],
			freeBoards: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Should not redirect — <=3 interests, no interstitial needed
		expect(page.url()).toContain('/dashboard');
	});

	test('free user with freeBoards set skips interstitial', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: ['book', 'movie', 'series']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});
});

// ---------------------------------------------------------------------------
// Free-tier board locking
// ---------------------------------------------------------------------------

test.describe('free-tier board access', () => {
	test('locked board shows upgrade banner', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: ['book', 'movie', 'series']
		});
		await authenticate(context, user.sessionToken);

		// Navigate to a locked board (games)
		await page.goto('/games');
		await page.waitForLoadState('networkidle');

		// Should show the read-only upgrade banner in the main content
		const main = page.locator('main');
		await expect(main.getByText('This board is read-only on the free plan')).toBeVisible();
	});

	test('active free board does not show read-only banner', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series'],
			freeBoards: ['book', 'movie', 'series']
		});
		await authenticate(context, user.sessionToken);

		// Navigate to an active board
		await page.goto('/books');
		await page.waitForLoadState('networkidle');

		// Should not have the "read-only" banner in the main content area
		const main = page.locator('main');
		await expect(main.getByText('This board is read-only on the free plan')).not.toBeVisible();
	});

	test('sidebar shows lock icon on locked boards', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie', 'series', 'game'],
			freeBoards: ['book', 'movie', 'series']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// The sidebar should exist
		const sidebar = page.locator('[data-testid="app-sidebar"]');
		await expect(sidebar).toBeVisible();

		// The games nav item should have lower opacity (locked)
		const gamesLink = sidebar.locator('a[href="/games"]');
		await expect(gamesLink).toBeVisible();
		// Check it has the opacity class indicating locked
		await expect(gamesLink).toHaveClass(/opacity-40/);
	});

	test('paid user sees no lock icons', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('[data-testid="app-sidebar"]');
		const gamesLink = sidebar.locator('a[href="/games"]');
		await expect(gamesLink).toBeVisible();
		await expect(gamesLink).not.toHaveClass(/opacity-40/);
	});
});

// ---------------------------------------------------------------------------
// Free-tier feature gates
// ---------------------------------------------------------------------------

test.describe('free-tier feature gates', () => {
	test('discover page shows upgrade banner for free user recommendations', async ({
		context,
		page
	}) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/discover');
		await page.waitForLoadState('networkidle');

		// Should show upgrade CTA in the recommendations section
		const upgradeCta = page.locator('text=Upgrade').first();
		await expect(upgradeCta).toBeVisible();
	});

	test('wrapped redirects free user to /subscribe', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/wrapped/2025');
		await page.waitForURL(/\/subscribe/);

		expect(page.url()).toContain('/subscribe');
	});

	test('free user sidebar shows "Upgrade for lists" instead of new list button', async ({
		context,
		page
	}) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(-1),
			interests: ['book', 'movie'],
			freeBoards: ['book', 'movie']
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('[data-testid="app-sidebar"]');
		await expect(sidebar.getByText('Upgrade for lists')).toBeVisible();
	});

	test('paid user sees new list button', async ({ context, page }) => {
		const user = await createTestUser({ suite: SUITE, subscribed: true });
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('[data-testid="app-sidebar"]');
		await expect(sidebar.getByText('New list')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Landing / subscribe pages — pricing display
// ---------------------------------------------------------------------------

test.describe('pricing display', () => {
	test('landing page shows free and pro pricing tiers', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Should show Free tier
		const pricingSection = page.locator('#pricing');
		await expect(pricingSection.getByText('$0')).toBeVisible();
		await expect(pricingSection.getByText('/forever')).toBeVisible();

		// Should show Pro tier
		await expect(pricingSection.getByText('Full Access')).toBeVisible();
	});

	test('landing page FAQ mentions free plan', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await expect(page.getByText('Is there a free plan?')).toBeVisible();
	});
});
