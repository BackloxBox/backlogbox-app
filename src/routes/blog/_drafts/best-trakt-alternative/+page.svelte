<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('best-trakt-alternative')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'Is Trakt free?',
			answer:
				'Trakt has a free tier, but many features like advanced stats, filtering, and year-in-review reports require VIP ($30/year). BacklogBox has no free tier but offers a 14-day free trial with full access to all features.'
		},
		{
			question: 'Does BacklogBox have auto-scrobbling like Trakt?',
			answer:
				'No. BacklogBox uses manual tracking with a Kanban drag-and-drop system. If automatic watch tracking from Plex, Kodi, or streaming apps is essential to your workflow, Trakt or Simkl are better choices.'
		},
		{
			question: 'What is the best TV show tracker app?',
			answer:
				'For auto-scrobbling from media servers: Trakt. For episode-by-episode social tracking with countdowns: TV Time. For TV shows plus all other media organized in Kanban boards: BacklogBox.'
		},
		{
			question: 'Can I use Trakt and another tracker together?',
			answer:
				'Yes. Many people use Trakt for passive scrobbling from Plex or Kodi, and a separate tool like BacklogBox for intentional backlog management and planning what to watch next.'
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
			{ '@type': 'ListItem', position: 2, name: 'Best Trakt Alternatives', item: pageUrl }
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
		<span class="text-foreground">Best Trakt Alternatives</span>
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
		Trakt is the power tool of media tracking — auto-scrobbling, deep integrations, episode-level TV
		tracking, and a massive database. But its complexity is a double-edged sword. If you want
		something simpler that covers more than just TV and movies, here are the best alternatives.
	</p>

	<h2>What Makes Trakt Great</h2>

	<p>
		Trakt deserves credit for what it does well. It is the most technically capable watch tracker on
		the market, and its feature set is hard to beat for power users.
	</p>

	<ul>
		<li>
			<strong>Auto-scrobbling</strong> from Plex, Kodi, Jellyfin, Emby, and dozens of streaming apps —
			watch something and it logs automatically
		</li>
		<li>
			<strong>Detailed TV episode tracking</strong> with per-episode watch status, progress bars, and
			season overviews
		</li>
		<li>
			<strong>Excellent API and third-party ecosystem</strong> — hundreds of apps and plugins integrate
			with Trakt
		</li>
		<li>
			<strong>VIP tier</strong> with advanced stats, year-in-review, and filtering tools
		</li>
		<li>
			<strong>Watch history and calendar</strong> for upcoming episodes across all your tracked shows
		</li>
		<li>
			<strong>Cross-device sync</strong> — scrobble from your TV, phone, or desktop and everything stays
			in sync
		</li>
	</ul>

	<p>
		If you run a home media server and want passive, automated tracking, Trakt is genuinely
		excellent at that.
	</p>

	<h2>Where Trakt Falls Short</h2>

	<p>
		The same depth that makes Trakt powerful also makes it inaccessible for many users. Not everyone
		wants to configure plugins and API keys just to track what they watch.
	</p>

	<ul>
		<li>
			<strong>Complex setup</strong> — auto-scrobbling requires installing plugins on Plex, Kodi, or using
			companion apps for each streaming service
		</li>
		<li>
			<strong>Dated UI</strong> — the interface is functional but visually behind modern alternatives
			like Letterboxd or Simkl
		</li>
		<li>
			<strong>Free tier is limited</strong> — basic tracking works, but stats, advanced filters, and most
			useful features sit behind the VIP paywall
		</li>
		<li>
			<strong>TV and movies only</strong> — no support for books, games, or podcasts, so you still need
			other apps for the rest of your media
		</li>
		<li>
			<strong>Overwhelming for casual users</strong> — if you just want a simple watchlist, Trakt's feature
			density gets in the way
		</li>
		<li>
			<strong>No Kanban or visual organization</strong> — everything is flat lists and tables, no drag-and-drop
			prioritization
		</li>
	</ul>

	<h2>Best Trakt Alternatives</h2>

	<h3>Simkl</h3>

	<p>
		<strong>Simkl</strong> is the closest direct Trakt competitor, covering TV shows, movies, and anime
		with auto-sync from streaming services. The UI is noticeably cleaner than Trakt, and anime tracking
		is a standout feature that Trakt handles poorly.
	</p>

	<p>
		<strong>Strengths:</strong> Cleaner interface than Trakt, strong anime support, auto-sync with streaming
		services, good calendar and progress views.
	</p>

	<p>
		<strong>Weaknesses:</strong> Smaller community than Trakt, no books or games tracking, fewer third-party
		integrations.
	</p>

	<h3>TV Time</h3>

	<p>
		<strong>TV Time</strong> is one of the most popular TV tracking apps, with a large community and social
		features built around episode discussions. The mobile app is well-designed, and episode countdown
		notifications keep you on top of your shows.
	</p>

	<p>
		<strong>Strengths:</strong> Large active community, episode-level tracking with countdowns, polished
		mobile app, social features.
	</p>

	<p>
		<strong>Weaknesses:</strong> Ads in the free tier, limited movie support compared to dedicated movie
		trackers, owned by Whip Media (corporate ownership concerns around data and direction).
	</p>

	<h3>Letterboxd</h3>

	<p>
		<strong>Letterboxd</strong> is the best-in-class movie tracker. The community, the reviews, the design
		— nothing else comes close for film logging. If movies are your primary focus, Letterboxd is hard
		to argue with.
	</p>

	<p>
		<strong>Strengths:</strong> Beautiful UI, incredible movie community, excellent discovery and curated
		lists, detailed stats on Pro tier.
	</p>

	<p>
		<strong>Weaknesses:</strong> Movies only — no TV series tracking at all, no scrobbling or automatic
		logging, Pro required for stats.
	</p>

	<h3>JustWatch</h3>

	<p>
		<strong>JustWatch</strong> solves the "where can I stream this?" problem better than any other app.
		It covers most countries and tells you exactly which platforms have a given title. It also has a basic
		watchlist feature.
	</p>

	<p>
		<strong>Strengths:</strong> Best-in-class streaming availability search, covers most countries, price
		comparison across platforms.
	</p>

	<p>
		<strong>Weaknesses:</strong> Not really a tracker — the watchlist is minimal, no episode tracking,
		no watch history, limited organization tools.
	</p>

	<h3>BacklogBox</h3>

	<p>
		<a href="/">BacklogBox</a> takes a different approach from all of the above. Instead of focusing
		on auto-logging or social features, it gives you <strong>Kanban boards</strong> for movies, TV, books,
		games, and podcasts. Search pulls from TMDB for movies and TV, OpenLibrary for books, IGDB for games,
		and Apple Podcasts — so metadata auto-fills when you add items.
	</p>

	<p>
		<strong>Strengths:</strong> All media types in one place, drag-and-drop Kanban columns (Wishlist,
		Backlog, In Progress, Completed), custom lists for anything, public profiles and shareable boards,
		Discover page with trending and upcoming titles.
	</p>

	<p>
		<strong>Weaknesses:</strong> No auto-scrobbling — all tracking is manual. No free tier ($9.99/mo or
		$99/yr, with a 14-day free trial). Smaller community than established trackers.
	</p>

	<p>
		<strong>Best for:</strong> People who want to organize their full entertainment backlog across media
		types, not just auto-log what they watch. If you think in terms of "what should I watch, read, or
		play next?" rather than "what did I watch last week?", BacklogBox fits that workflow.
	</p>

	<h2>Comparison Table</h2>

	<div class="my-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60">
					<th class="py-2 pr-4 text-left font-medium text-foreground">Feature</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Trakt</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Simkl</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">TV Time</th>
					<th class="py-2 text-left font-medium text-foreground">BacklogBox</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Movies</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Limited</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">TV Series</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
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
					<td class="py-2 pr-4">Games</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Auto-scrobbling</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">No</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Kanban Boards</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Custom Lists</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Public Profile</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr>
					<td class="py-2 pr-4">Free Tier</td>
					<td class="py-2 pr-4">Yes (limited)</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes (ads)</td>
					<td class="py-2 font-medium text-foreground">No (14-day trial)</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>When to Stay with Trakt</h2>

	<p>
		If <strong>auto-scrobbling is essential</strong> to your workflow, Trakt is still the best option.
		Nothing else matches its depth of integration with media servers and streaming apps.
	</p>

	<p>
		If you run a Plex or Kodi setup and want fully passive tracking — watch something and forget
		about it, knowing it is logged — nothing replaces Trakt for that use case. The ecosystem of
		third-party apps and plugins is unmatched.
	</p>

	<h2>When to Switch</h2>

	<p>Consider a Trakt alternative if any of these apply to you:</p>

	<ul>
		<li>
			You find <strong>Trakt's setup too complex</strong> — configuring scrobbling plugins, API connections,
			and companion apps is more work than you want
		</li>
		<li>
			You want to <strong>track books and games alongside TV and movies</strong> instead of using separate
			apps for each
		</li>
		<li>
			You prefer <strong>visual Kanban organization</strong> over flat watchlists and tables
		</li>
		<li>
			You are a <strong>casual viewer</strong> who does not need automatic scrobbling and just wants a
			clean way to manage what to watch next
		</li>
	</ul>

	<p>
		For many people, the answer is not switching entirely but <strong>using both</strong>. Keep
		Trakt for passive scrobbling from your media server, and use
		<a href="/">BacklogBox</a> for intentional planning across all your media.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">
			Track shows, movies, and everything else in one place
		</p>
		<p class="mt-1 text-xs text-muted-foreground">
			Kanban boards for your entire media backlog. 14-day free trial, no credit card required.
		</p>
		<div class="mt-4">
			<Button size="sm" href="/register">
				Try BacklogBox <ArrowRight class="ml-1 size-3" />
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
				href="/blog/best-letterboxd-alternative"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Letterboxd Alternatives for Movie and TV Tracking</span
				>
			</a>
			<a
				href="/blog/best-goodreads-letterboxd-alternatives-all-in-one-media-tracker"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Goodreads & Letterboxd Alternative: Why You Need an All-in-One Media Tracker</span
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
