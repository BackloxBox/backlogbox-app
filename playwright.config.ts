import { defineConfig } from '@playwright/test';

if (!process.env.CI) process.loadEnvFile();

export default defineConfig({
	webServer: {
		command: process.env.CI ? 'pnpm preview' : 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0
});
