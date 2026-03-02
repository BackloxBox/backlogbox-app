import { expect, test } from '@playwright/test';
import { createTestUser, authenticate, cleanupTestUsers, closeDb } from './helpers/auth';

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

const SUITE = 'onboarding';

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
// Onboarding redirect tests
// ---------------------------------------------------------------------------

test.describe('onboarding redirect', () => {
	test('new user (no onboarding) redirects to /onboarding', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForURL(/\/onboarding/);

		expect(page.url()).toContain('/onboarding');
	});

	test('onboarded user goes straight to /dashboard', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: new Date()
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});
});

// ---------------------------------------------------------------------------
// Onboarding page UI tests
// ---------------------------------------------------------------------------

test.describe('onboarding step 1', () => {
	test('renders heading and 5 media type cards', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/onboarding');
		await page.waitForLoadState('networkidle');

		await expect(page.getByText('What do you want to track?')).toBeVisible();

		// 5 media type buttons
		await expect(page.getByTestId('interest-book')).toBeVisible();
		await expect(page.getByTestId('interest-movie')).toBeVisible();
		await expect(page.getByTestId('interest-series')).toBeVisible();
		await expect(page.getByTestId('interest-game')).toBeVisible();
		await expect(page.getByTestId('interest-podcast')).toBeVisible();
	});

	test('continue button disabled until interest selected', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/onboarding');
		await page.waitForLoadState('networkidle');

		const continueBtn = page.getByRole('button', { name: 'Continue' });
		await expect(continueBtn).toBeDisabled();

		// Select one interest
		await page.getByTestId('interest-movie').click();

		await expect(continueBtn).toBeEnabled();
	});

	test('no sidebar visible on onboarding page', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/onboarding');
		await page.waitForLoadState('networkidle');

		const sidebar = page.locator('[data-testid="app-sidebar"]');
		await expect(sidebar).not.toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// Skip onboarding
// ---------------------------------------------------------------------------

test.describe('skip onboarding', () => {
	test('skip redirects to dashboard and stays there', async ({ context, page }) => {
		const user = await createTestUser({
			suite: SUITE,
			trialEndsAt: daysFromNow(14),
			onboardingCompletedAt: null
		});
		await authenticate(context, user.sessionToken);

		await page.goto('/onboarding');
		await page.waitForLoadState('networkidle');

		await page.getByRole('button', { name: 'Skip for now' }).click();
		await page.waitForURL(/\/dashboard/, { timeout: 10000 });

		expect(page.url()).toContain('/dashboard');

		// Reload — should stay on dashboard, not redirect back to onboarding
		await page.reload();
		await page.waitForLoadState('networkidle');

		expect(page.url()).toContain('/dashboard');
	});
});
