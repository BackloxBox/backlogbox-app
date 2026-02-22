<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('best-backloggd-alternative')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'Is Backloggd free?',
			answer:
				'Yes, Backloggd is free to use. If you want a free alternative with broader media coverage, BacklogBox offers a 14-day free trial with no credit card required.'
		},
		{
			question: 'What is the best game backlog tracker?',
			answer:
				'It depends on your needs. Backloggd is best for community reviews, HowLongToBeat for completion time estimates, and BacklogBox for Kanban-style organization across games and all other media types.'
		},
		{
			question: 'Can I track games and movies in one app?',
			answer:
				'Yes. BacklogBox tracks games (via IGDB), movies and TV shows (via TMDB), books (via OpenLibrary), and podcasts in one Kanban-style app with separate boards for each media type.'
		},
		{
			question: 'How do I manage a game backlog with 200+ games?',
			answer:
				'Use a Kanban board with WIP limits. Keep your active Backlog column under 20 titles, limit In Progress to 2-3 games, and prune anything that has sat untouched for over a year.'
		}
	] as const;
</script>

<svelte:head>
	<title>{post.title} | BacklogBox Blog</title>
	<meta name="description" content={post.description} />
	<meta name="keywords" content={post.keywords.join(', ')} />
	<link rel="canonical" href={pageUrl} />

	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="article:published_time" content={post.publishedAt} />
	<meta property="article:modified_time" content={post.updatedAt} />

	<meta property="og:image" content="{siteUrl}/blog/{post.slug}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={post.title} />
	<meta name="twitter:description" content={post.description} />
	<meta name="twitter:image" content="{siteUrl}/blog/{post.slug}/og.png" />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Blog', item: `${siteUrl}/blog` },
			{ '@type': 'ListItem', position: 2, name: post.title, item: pageUrl }
		]
	})}</${'script'}>`}

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: post.description,
		image: `${siteUrl}/blog/${post.slug}/og.png`,
		datePublished: post.publishedAt,
		dateModified: post.updatedAt,
		author: { '@type': 'Organization', name: 'BacklogBox' },
		publisher: { '@type': 'Organization', name: 'BacklogBox', url: siteUrl },
		mainEntityOfPage: pageUrl
	})}</${'script'}>`}

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: { '@type': 'Answer', text: item.answer }
		}))
	})}</${'script'}>`}
</svelte:head>

<article class="prose-custom">
	<nav class="mb-8 text-xs text-muted-foreground/60">
		<a href="/blog" class="transition-colors hover:text-foreground">Blog</a>
		<span class="mx-1.5">/</span>
		<span class="text-foreground">Best Backloggd Alternatives</span>
	</nav>

	<header class="mb-10">
		<h1 class="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
			{post.title}
		</h1>
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
	</header>

	<p class="lead">
		Backloggd carved out a niche as the Letterboxd for games — an IGDB-powered database, community
		reviews, and a clean way to log what you have played. But if your pile of shame extends beyond
		games into books, movies, and TV shows, you need something broader.
	</p>

	<p>
		This guide covers what Backloggd does well, where it falls short, and the best alternatives
		depending on what you actually need from a game tracker.
	</p>

	<h2>What Makes Backloggd Great</h2>

	<p>
		Credit where it is due: Backloggd is a solid game tracker. Its
		<strong>IGDB integration</strong> means the game database is extensive and accurate. Cover art, platforms,
		genres, and release dates are all pulled automatically.
	</p>

	<p>
		The <strong>community</strong> is growing and engaged. Reviews are thoughtful, ratings are useful
		for discovery, and the social feed gives you a sense of what other gamers are playing. If you come
		from Letterboxd, the experience feels familiar and intentional.
	</p>

	<p>
		The <strong>status tracking</strong> covers gaming-specific states well: playing, completed, shelved,
		abandoned, and wishlisted. The visual design is clean, and the game pages look good. For a free, community-driven
		game logger, Backloggd delivers.
	</p>

	<h2>Where Backloggd Falls Short</h2>

	<p>
		Backloggd was built for one thing — logging games — and everything outside that scope is
		missing. That is fine if games are your only media type. It is a problem if they are not.
	</p>

	<ul>
		<li>
			<strong>Games only</strong> — No support for movies, books, TV shows, or podcasts. If you consume
			multiple media types, you need separate apps for each.
		</li>
		<li>
			<strong>Basic organization</strong> — Status tags (playing, completed, shelved) are useful but flat.
			There are no Kanban boards, no drag-and-drop, and no way to visually prioritize your backlog.
		</li>
		<li>
			<strong>No custom lists</strong> — You cannot create arbitrary lists for tracking things outside
			the standard statuses.
		</li>
		<li>
			<strong>No discovery or recommendations</strong> — There is no "trending" or "upcoming" section
			to help you find new games. Discovery happens through community reviews, not through the app itself.
		</li>
		<li>
			<strong>Performance issues</strong> — Some users report occasional slowness, especially when browsing
			large libraries or loading game pages with many reviews.
		</li>
	</ul>

	<h2>Best Backloggd Alternatives</h2>

	<h3>HowLongToBeat</h3>

	<p>
		HowLongToBeat answers the question every gamer asks: "How long will this take?" Every game has
		community-submitted <strong>completion time estimates</strong> for main story, main + extras, and
		completionist runs. When you are deciding between a 6-hour indie and a 90-hour RPG, this data is invaluable.
	</p>

	<p>
		The backlog tracking is functional but basic. You can mark games as playing, backlog, or
		completed. There is no visual board or drag-and-drop. The UI feels dated compared to newer
		trackers, and it covers <strong>games only</strong> — no movies, books, or TV.
	</p>

	<p>
		<strong>Best for:</strong> Gamers who want time estimates to plan their sessions and do not need advanced
		organization.
	</p>

	<h3>GG|</h3>

	<p>
		GG| (also known as GG App) is a newer game tracker with a <strong>clean, modern UI</strong>
		and integration with deal-tracking services. You can log games, track status, and get alerts when
		titles on your wishlist go on sale.
	</p>

	<p>
		The design is polished and the deal alerts are a genuine differentiator — no other game tracker
		tells you when your wishlisted game hits 75% off. The trade-off is a
		<strong>smaller community</strong> compared to Backloggd, and like most alternatives, it is games
		only.
	</p>

	<p>
		<strong>Best for:</strong> Deal-conscious gamers who want a modern interface with price tracking built
		in.
	</p>

	<h3>Playnite</h3>

	<p>
		Playnite takes a completely different approach. It is an <strong>open-source desktop app</strong
		>
		that imports your existing libraries from Steam, GOG, Epic, Origin, Ubisoft Connect, and more. Instead
		of manually adding games, Playnite pulls your entire collection automatically.
	</p>

	<p>
		The library management is powerful — custom tags, filters, and sorting. Extensions add metadata
		from IGDB, HowLongToBeat, and other sources. But it is
		<strong>desktop only</strong> with no mobile app and no web access. Setup requires some configuration,
		and it does not track any other media types.
	</p>

	<p>
		<strong>Best for:</strong> PC gamers with large multi-launcher libraries who want everything in one
		desktop client.
	</p>

	<h3>Infinite Backlog</h3>

	<p>
		Infinite Backlog is a web-based game tracker focused specifically on
		<strong>backlog management</strong>. It uses IGDB data and organizes games into simple columns.
		The approach is more organizational than social — less about reviews and ratings, more about
		moving games through your pipeline.
	</p>

	<p>
		The user base is smaller than Backloggd or HowLongToBeat, and the feature set is more limited.
		But if you want a focused, no-frills backlog tool for <strong>games only</strong>, it does the
		job.
	</p>

	<p>
		<strong>Best for:</strong> Gamers who want simple column-based backlog tracking without social features.
	</p>

	<h3>BacklogBox</h3>

	<p>
		<a href="/">BacklogBox</a> takes a different angle. Instead of building a deeper game-only
		tracker, it provides
		<strong>Kanban boards for games alongside movies, TV shows, books, and podcasts</strong>. The
		game board uses IGDB auto-search — same database as Backloggd — so coverage is equivalent.
	</p>

	<p>
		The key difference is organizational philosophy. Where Backloggd uses flat status tags,
		BacklogBox uses <strong>drag-and-drop Kanban columns</strong>: Wishlist, Backlog, In Progress,
		and Completed. You can visually see your pipeline and limit work in progress. A Discover page
		surfaces trending, recommended, and upcoming titles across all media types.
	</p>

	<p>
		The trade-off is clear: BacklogBox is <strong>less community and review focused</strong> than
		Backloggd. There is no social feed of reviews or community ratings. It is an organization tool,
		not a social platform. If you want both, you can use Backloggd for the community and
		<a href="/">BacklogBox</a> for the actual backlog management.
	</p>

	<p>
		<strong>Best for:</strong> Gamers who also track movies, books, or TV and want visual Kanban organization
		across all media.
	</p>

	<h2>Feature Comparison</h2>

	<div class="my-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60">
					<th class="py-2 pr-4 text-left font-medium text-foreground">Feature</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Backloggd</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">HowLongToBeat</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Playnite</th>
					<th class="py-2 text-left font-medium text-foreground">BacklogBox</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Game Database</td>
					<td class="py-2 pr-4">IGDB</td>
					<td class="py-2 pr-4">Custom</td>
					<td class="py-2 pr-4">Multi-source</td>
					<td class="py-2 font-medium text-foreground">IGDB</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Completion Times</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Via extension</td>
					<td class="py-2">No</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Kanban Boards</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Movies / TV</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Books</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Custom Lists</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">Tags</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Mobile Access</td>
					<td class="py-2 pr-4">Web</td>
					<td class="py-2 pr-4">Web + App</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Web</td>
				</tr>
				<tr>
					<td class="py-2 pr-4">Public Profile</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>When to Stay with Backloggd</h2>

	<p>
		If games are your only media type and you value the <strong>community experience</strong> — reading
		reviews, seeing what friends are playing, rating and logging for a social audience — Backloggd does
		the job well. The IGDB integration is solid, the design is clean, and the growing community adds genuine
		discovery value.
	</p>

	<p>
		Backloggd is also free, which matters if you are not ready to pay for a tracker. For a zero-cost
		game logger with social features, it is hard to beat.
	</p>

	<h2>When to Switch</h2>

	<p>Consider an alternative if any of these apply:</p>

	<ul>
		<li>
			<strong>You track more than games</strong> — If your backlog includes movies, books, or TV shows,
			you need either multiple apps or an all-in-one tracker.
		</li>
		<li>
			<strong>You want visual organization</strong> — If flat status tags feel limiting and you prefer
			Kanban-style drag-and-drop columns with clear priority ordering, Backloggd does not offer that.
		</li>
		<li>
			<strong>You want custom lists</strong> — If you want to track things beyond the standard game statuses
			— a "Games to buy on sale" list, a "Couch co-op" list, or non-media items entirely — you need a
			more flexible tool.
		</li>
	</ul>

	<p>
		Many gamers use both. Backloggd for the community and reviews, and a separate tool like
		<a href="/">BacklogBox</a> for the actual organizational backbone. They solve different problems.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to organize your pile of shame?</p>
		<p class="mt-1 text-xs text-muted-foreground">
			BacklogBox gives you Kanban boards for games, movies, books, TV, and podcasts — with IGDB
			auto-search and drag-and-drop organization.
		</p>
		<div class="mt-4">
			<Button size="sm" href="/register">
				Start Your Free Trial <ArrowRight class="ml-1 size-3" />
			</Button>
		</div>
	</div>

	<h2>Frequently Asked Questions</h2>

	{#each faqItems as faq (faq.question)}
		<h3>{faq.question}</h3>
		<p>{faq.answer}</p>
	{/each}

	<hr class="my-10 border-border/40" />

	<div class="not-prose">
		<p class="mb-4 text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
			Related articles
		</p>
		<div class="space-y-3">
			<a
				href="/blog/game-backlog-management-guide"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Game Backlog Management: A Complete Guide to Tackling Your Pile of Shame</span
				>
			</a>
			<a
				href="/blog/best-media-tracker-apps"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Media Tracker Apps in 2026: Books, Movies, Games & More Compared</span
				>
			</a>
		</div>
	</div>
</article>

<style>
	.prose-custom :global(h2) {
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--foreground);
	}
	.prose-custom :global(h3) {
		margin-top: 1.75rem;
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground);
	}
	.prose-custom :global(:not(.not-prose) > p) {
		margin-bottom: 1rem;
		line-height: 1.75;
		color: var(--muted-foreground);
	}
	.prose-custom :global(p.lead) {
		font-size: 1.0625rem;
		color: var(--foreground);
	}
	.prose-custom :global(ul),
	.prose-custom :global(ol) {
		margin-top: 1.25rem;
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		color: var(--muted-foreground);
	}
	.prose-custom :global(li) {
		margin-bottom: 0.375rem;
		line-height: 1.75;
	}
	.prose-custom :global(:not(.not-prose) > a:not([data-slot='button'])) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prose-custom :global(:not(.not-prose) > a:not([data-slot='button']):hover) {
		opacity: 0.8;
	}
	.prose-custom :global(strong) {
		color: var(--foreground);
		font-weight: 600;
	}
	.prose-custom :global(table) {
		border-collapse: collapse;
		width: 100%;
	}
	.prose-custom :global(th),
	.prose-custom :global(td) {
		white-space: nowrap;
	}

	@media (max-width: 639px) {
		.prose-custom :global(th),
		.prose-custom :global(td) {
			white-space: normal;
		}
	}
</style>
