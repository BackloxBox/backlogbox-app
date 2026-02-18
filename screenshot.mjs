import playwright from '@playwright/test';
const { chromium } = playwright;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 375, height: 812 },
	deviceScaleFactor: 2
});
const page = await context.newPage();

// Blog post - find CTA section
await page.goto('http://localhost:4174/blog/how-to-organize-your-media-backlog', {
	waitUntil: 'networkidle'
});

// Full page screenshot to find CTA
await page.screenshot({ path: '/tmp/blog-post-full.png', fullPage: true });

// Now light mode
await page.goto('http://localhost:4174/blog/game-backlog-management-guide', {
	waitUntil: 'networkidle'
});
// Click theme toggle
const themeBtn = page.locator('button[aria-label="Toggle theme"]');
await themeBtn.click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/blog-post-light-full.png', fullPage: true });

await browser.close();
console.log('done');
