import { defineConfig } from '@playwright/test';
import { existsSync } from 'fs';

if (!process.env.CI) process.loadEnvFile();

const alreadyBuilt = existsSync('.svelte-kit/output/server');

export default defineConfig({
	webServer: {
		command: alreadyBuilt ? 'pnpm preview' : 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		env: { BETTER_AUTH_URL: 'http://localhost:4173' }
	},
	testDir: 'e2e',
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : '50%'
});
