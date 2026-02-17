import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

test.describe('landing page', () => {
	test('renders keyword-rich H1', async ({ page }) => {
		await page.goto('/');
		const h1 = page.locator('h1');
		await expect(h1).toBeVisible();
		await expect(h1).toContainText('Track Your');
	});

	test('has correct meta title and description', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/BacklogBox/);
		const desc = page.locator('meta[name="description"]');
		await expect(desc).toHaveAttribute('content', /track.*books|movies|games/i);
	});

	test('has canonical URL', async ({ page }) => {
		await page.goto('/');
		const canonical = page.locator('link[rel="canonical"]');
		await expect(canonical).toHaveAttribute('href', /backlogbox\.com/);
	});

	test('has structured data (JSON-LD)', async ({ page }) => {
		await page.goto('/');
		const jsonLd = page.locator('script[type="application/ld+json"]');
		await expect(jsonLd.first()).toBeAttached();
	});

	test('nav contains blog link', async ({ page }) => {
		await page.goto('/');
		const blogLink = page.locator('nav a[href="/blog"]');
		await expect(blogLink).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

test.describe('blog', () => {
	test('blog index lists articles', async ({ page }) => {
		await page.goto('/blog');
		await expect(page.locator('h1')).toBeVisible();
		// Should have at least 3 article links
		const articles = page.locator('a[href*="/blog/"]');
		await expect(articles.first()).toBeVisible();
		expect(await articles.count()).toBeGreaterThanOrEqual(3);
	});

	test('blog post renders with article schema', async ({ page }) => {
		await page.goto('/blog/how-to-organize-your-media-backlog');
		await expect(page.locator('h1')).toBeVisible();
		const jsonLd = page.locator('script[type="application/ld+json"]');
		await expect(jsonLd.first()).toBeAttached();
	});

	test('blog post has meta description', async ({ page }) => {
		await page.goto('/blog/game-backlog-management-guide');
		const desc = page.locator('meta[name="description"]').last();
		await expect(desc).toHaveAttribute('content', /game backlog/i);
	});
});

// ---------------------------------------------------------------------------
// Auth redirects — unauthenticated users hitting app routes
// ---------------------------------------------------------------------------

test.describe('auth redirects', () => {
	test('app dashboard redirects to login', async ({ page }) => {
		await page.goto('/dashboard');
		// Should redirect to /login (or stay on a page with login form)
		await page.waitForURL(/\/(login|register)/);
		expect(page.url()).toMatch(/\/(login|register)/);
	});

	test('app books board redirects to login', async ({ page }) => {
		await page.goto('/books');
		await page.waitForURL(/\/(login|register)/);
		expect(page.url()).toMatch(/\/(login|register)/);
	});

	test('app settings redirects to login', async ({ page }) => {
		await page.goto('/settings');
		await page.waitForURL(/\/(login|register)/);
		expect(page.url()).toMatch(/\/(login|register)/);
	});
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

test.describe('static assets', () => {
	test('robots.txt is accessible', async ({ request }) => {
		const res = await request.get('/robots.txt');
		expect(res.status()).toBe(200);
		const body = await res.text();
		expect(body).toContain('Sitemap:');
		expect(body).toContain('Disallow: /login');
	});

	test('sitemap.xml is accessible', async ({ request }) => {
		const res = await request.get('/sitemap.xml');
		expect(res.status()).toBe(200);
		const body = await res.text();
		expect(body).toContain('<urlset');
		expect(body).toContain('/blog');
	});

	test('healthz returns ok', async ({ request }) => {
		const res = await request.get('/healthz');
		expect(res.status()).toBe(200);
	});
});
