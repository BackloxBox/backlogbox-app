<script lang="ts">
	import './layout.css';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import CacheDebugOverlay from '$lib/components/dev/CacheDebugOverlay.svelte';

	let { children } = $props();

	const siteUrl = 'https://backlogbox.com';
	const defaultTitle = 'Media Tracker & Backlog Manager - Books, Movies, Games | BacklogBox';
	const defaultDescription =
		'Organize your books, movies, TV shows, games, and podcasts in one Kanban-style tracker. Drag items from backlog to completed. Custom lists for anything.';
	const defaultImage = `${siteUrl}/og.png`;

	const canonicalUrl = $derived(`${siteUrl}${page.url.pathname}`);
</script>

<svelte:head>
	<link rel="icon" href="/backlogbox-logo.svg" />
	<link rel="canonical" href={canonicalUrl} />

	<!-- SEO -->
	<title>{defaultTitle}</title>
	<meta name="description" content={defaultDescription} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="BacklogBox" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={defaultTitle} />
	<meta property="og:description" content={defaultDescription} />
	<meta property="og:image" content={defaultImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={defaultTitle} />
	<meta name="twitter:description" content={defaultDescription} />
	<meta name="twitter:image" content={defaultImage} />

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

	<!-- Structured data: WebSite with search -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD, no user input -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'BacklogBox',
		url: siteUrl,
		description: defaultDescription
	})}</${'script'}>`}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<Toaster richColors />
{#if dev}
	<CacheDebugOverlay />
{/if}
{@render children()}
