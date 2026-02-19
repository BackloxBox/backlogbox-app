import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	server: {
		allowedHosts: ['.ngrok-free.app']
	},
	ssr: {
		external: ['pino', 'pino-pretty', '@axiomhq/pino']
	},
	plugins: [
		sentrySvelteKit({
			org: 'backlogbox',
			project: 'backlogbox-prd',
			authToken: process.env.SENTRY_AUTH_TOKEN,
			bundleSizeOptimizations: {
				excludeTracing: true,
				excludeDebugStatements: true
			}
		}),
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'BacklogBox',
				short_name: 'BacklogBox',
				description: 'Track your books, movies, TV shows, games & podcasts',
				theme_color: '#09090b',
				background_color: '#09090b',
				display: 'standalone',
				scope: '/',
				start_url: '/dashboard',
				icons: [
					{ src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{
						src: 'maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,svg,png,woff2}'],
				navigateFallbackDenylist: [/^\/admin/],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'tmdb-images',
							expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					},
					{
						urlPattern: /^https:\/\/images\.igdb\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'igdb-images',
							expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					},
					{
						urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'openlibrary-covers',
							expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					}
				]
			}
		}),
		devtoolsJson()
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
