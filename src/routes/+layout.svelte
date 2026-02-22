<script lang="ts">
	import './layout.css';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import CacheDebugOverlay from '$lib/components/dev/CacheDebugOverlay.svelte';
	import IosInstallHint from '$lib/components/pwa/IosInstallHint.svelte';
	import { initPostHog, identifyUser, resetUser } from '$lib/analytics';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children, data } = $props();

	// --- Analytics (pageviews auto-tracked via defaults: '2026-01-30') ---
	initPostHog(env.PUBLIC_POSTHOG_KEY, env.PUBLIC_POSTHOG_HOST);

	// --- PWA service worker registration ---
	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});

	let prevUserId: string | null = null;
	$effect(() => {
		const user = data.user;
		if (user && user.id !== prevUserId) {
			identifyUser(user.id, { name: user.name, email: user.email });
			prevUserId = user.id;
		} else if (!user && prevUserId) {
			resetUser();
			prevUserId = null;
		}
	});

	const siteUrl = 'https://backlogbox.com';
	const defaultTitle = 'Media Tracker & Backlog Manager - Books, Movies, Games | BacklogBox';
	const defaultDescription =
		'Organize your books, movies, TV shows, games, and podcasts in one Kanban-style tracker. Drag items from backlog to completed. Custom lists for anything.';
	const defaultImage = `${siteUrl}/og.png`;

	const canonicalUrl = $derived(`${siteUrl}${page.url.pathname}`);
</script>

<svelte:head>
	<link rel="icon" href="/backlogbox-logo.svg" type="image/svg+xml" sizes="any" />
	{#if pwaInfo?.webManifest?.href}
		<link rel="manifest" href={pwaInfo.webManifest.href} />
	{/if}
	<link rel="canonical" href={canonicalUrl} />

	<!-- Default title — child pages override via their own <svelte:head> -->
	<!-- Description is NOT set here to avoid duplicates; each public page sets its own -->
	<title>{defaultTitle}</title>

	<!-- Open Graph (site-wide defaults, pages override per-page fields) -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="BacklogBox" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={defaultImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Structured data: SoftwareApplication -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, no user input -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'BacklogBox',
		url: siteUrl,
		applicationCategory: 'LifestyleApplication',
		operatingSystem: 'Web',
		description: defaultDescription,
		offers: {
			'@type': 'Offer',
			price: '9.99',
			priceCurrency: 'USD',
			url: `${siteUrl}/subscribe`
		}
	})}</${'script'}>`}

	<!-- Structured data: WebSite -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, no user input -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'BacklogBox',
		url: siteUrl,
		description: defaultDescription
	})}</${'script'}>`}

	<!-- Structured data: Organization -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, no user input -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'BacklogBox',
		url: siteUrl,
		logo: `${siteUrl}/backlogbox-logo.svg`,
		description: defaultDescription,
		sameAs: ['https://x.com/backlogbox']
	})}</${'script'}>`}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<Toaster richColors />
<Tooltip.Provider>
	<IosInstallHint />
	{#if dev}
		<CacheDebugOverlay />
	{/if}
	{@render children()}
</Tooltip.Provider>
