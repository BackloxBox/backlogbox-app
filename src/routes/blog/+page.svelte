<script lang="ts">
	import { posts } from '$lib/blog/posts';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const siteUrl = 'https://backlogbox.com';

	const sortedPosts = [...posts].sort(
		(a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
	);
</script>

<svelte:head>
	<title>Blog - Media Tracking Tips & Guides | BacklogBox</title>
	<meta
		name="description"
		content="Tips, guides, and strategies for organizing your media backlog. Learn how to track books, movies, games, and more with Kanban boards."
	/>
	<meta property="og:title" content="Blog - Media Tracking Tips & Guides | BacklogBox" />
	<meta
		property="og:description"
		content="Tips, guides, and strategies for organizing your media backlog."
	/>

	<!-- BreadcrumbList: Home > Blog -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` }
		]
	})}</${'script'}>`}

	<!-- CollectionPage with ItemList -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Blog - Media Tracking Tips & Guides',
		description: 'Tips, guides, and strategies for organizing your media backlog.',
		url: `${siteUrl}/blog`,
		mainEntity: {
			'@type': 'ItemList',
			itemListElement: posts.map((p, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${siteUrl}/blog/${p.slug}`,
				name: p.title
			}))
		}
	})}</${'script'}>`}
</svelte:head>

<div>
	<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Blog</h1>
	<p class="mt-3 text-base leading-relaxed text-muted-foreground">
		Tips, guides, and strategies for organizing your media backlog.
	</p>

	<div class="mt-12 space-y-8">
		{#each sortedPosts as post (post.slug)}
			<article>
				<a
					href="/blog/{post.slug}"
					class="group block rounded-xl border border-border/60 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card/50"
				>
					<h2
						class="text-lg leading-tight font-semibold text-foreground group-hover:text-primary sm:text-xl"
					>
						{post.title}
					</h2>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						{post.description}
					</p>
					<div class="mt-4 flex items-center gap-4 text-xs text-muted-foreground/60">
						<span class="inline-flex items-center gap-1">
							<Calendar class="size-3" />
							{new Date(post.publishedAt).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</span>
						<span class="inline-flex items-center gap-1">
							<Clock class="size-3" />
							{post.readingTime}
						</span>
					</div>
					<span
						class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
					>
						Read more <ArrowRight class="size-3" />
					</span>
				</a>
			</article>
		{/each}
	</div>
</div>
