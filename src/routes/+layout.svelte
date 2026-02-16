<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/backlogbox-logo.svg" />

	<!-- SEO -->
	<title>BacklogBox - The All-in-One Media Backlog Manager</title>
	<meta
		name="description"
		content="Stop losing track of what to play next. The ultimate Kanban-style tracker for your games, books, movies, and TV shows. Free to use."
	/>

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="BacklogBox - The All-in-One Media Backlog Manager" />
	<meta
		property="og:description"
		content="Stop losing track of what to play next. The ultimate Kanban-style tracker for your games, books, movies, and TV shows."
	/>
	<meta property="og:image" content="https://backlogbox.com/backlogbox-logo.svg" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="BacklogBox - The All-in-One Media Backlog Manager" />
	<meta
		name="twitter:description"
		content="Stop losing track of what to play next. The ultimate Kanban-style tracker for your games, books, movies, and TV shows."
	/>
	<meta name="twitter:image" content="https://backlogbox.com/backlogbox-logo.svg" />

	<!-- Structured data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'BacklogBox',
		url: 'https://backlogbox.com',
		description:
			'Stop losing track of what to play next. The ultimate Kanban-style tracker for your games, books, movies, and TV shows.'
	})}</script>`}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<Toaster richColors />
{@render children()}
