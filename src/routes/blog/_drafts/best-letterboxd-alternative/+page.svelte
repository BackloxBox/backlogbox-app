<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('best-letterboxd-alternative')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'Is there a free Letterboxd alternative?',
			answer:
				'Letterboxd itself is free for basic movie logging. For alternatives, Trakt offers a free tier with movie and TV tracking. BacklogBox offers a 14-day free trial with full access to all features — no credit card required.'
		},
		{
			question: 'What is the best Letterboxd alternative for TV shows?',
			answer:
				'For TV-specific tracking with auto-scrobbling, Trakt is the strongest option. If you want TV tracking alongside books, games, and podcasts in one app, BacklogBox covers all media types with Kanban boards.'
		},
		{
			question: 'Can I use Letterboxd and another tracker together?',
			answer:
				'Yes, and many people do. Letterboxd is excellent for the movie community, reviews, and social features. An all-in-one tracker like BacklogBox handles the organizational side — managing your backlog across movies, TV, books, and games in one place.'
		},
		{
			question: 'Is Letterboxd worth paying for?',
			answer:
				'Letterboxd Pro ($49.99/yr) adds stats, filters, and custom posters. Patron ($99.99/yr) adds even more. If you are a dedicated movie logger who wants analytics, it is worth it. The core logging and community features are free.'
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
		<span class="text-foreground">Best Letterboxd Alternatives</span>
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
		Letterboxd is genuinely great for movies. Beautiful design, an incredible community, and the
		best movie logging experience on the web. But if you track anything beyond films — TV shows,
		books, games — you are out of luck. Here are the best alternatives for people who want more.
	</p>

	<h2>What Makes Letterboxd Great</h2>

	<p>
		Before looking at alternatives, Letterboxd deserves honest credit. It is the
		<strong>gold standard for movie-only tracking</strong>, and for good reason.
	</p>

	<ul>
		<li>
			<strong>Stunning UI</strong> — The poster-grid design is beautiful. Every profile, list, and review
			page looks like it was designed by someone who actually cares about movies.
		</li>
		<li>
			<strong>Active community</strong> — Real reviews from real people. Not algorithm-generated summaries,
			not spam. The community is opinionated and engaged.
		</li>
		<li>
			<strong>Diary-style logging</strong> — Log the date you watched a film, add a rating and short review,
			and build a personal viewing history over time.
		</li>
		<li>
			<strong>Curated lists</strong> — User-created lists (best horror of the 80s, every A24 film ranked)
			are a discovery engine in themselves.
		</li>
		<li>
			<strong>Social features</strong> — Follow friends, see what they are watching, compare ratings.
			Letterboxd turns movie watching into a shared experience.
		</li>
	</ul>

	<p>
		If all you track is movies, Letterboxd is hard to beat. The problem starts when your media
		consumption extends beyond film.
	</p>

	<h2>Where Letterboxd Falls Short</h2>

	<p>
		Letterboxd does one thing exceptionally well. But that narrow focus creates real gaps if you
		consume multiple types of media.
	</p>

	<ul>
		<li>
			<strong>Movies only</strong> — No TV series support (miniseries get partial coverage, but full shows
			do not). No books. No games. No podcasts.
		</li>
		<li>
			<strong>Flat watchlist</strong> — Your watchlist is a single list. There is no way to organize by
			priority, group by genre, or separate "definitely watching this weekend" from "maybe someday."
		</li>
		<li>
			<strong>Stats behind a paywall</strong> — Basic viewing stats require Letterboxd Pro ($49.99/yr)
			or Patron ($99.99/yr). The free tier gives you logging but no analytics.
		</li>
		<li>
			<strong>No Kanban or priority system</strong> — You cannot drag movies between columns like Backlog,
			In Progress, and Completed. It is watched or not watched — nothing in between.
		</li>
		<li>
			<strong>No cross-media view</strong> — Even if you pair Letterboxd with Goodreads and Backloggd,
			there is no single place to see your entire media backlog.
		</li>
	</ul>

	<h2>Best Letterboxd Alternatives</h2>

	<h3>Trakt</h3>

	<p>
		Trakt is the closest alternative if your main frustration with Letterboxd is
		<strong>the lack of TV show tracking</strong>. It covers both movies and TV series, with
		detailed episode-by-episode progress. The standout feature is
		<strong>auto-scrobbling</strong> — connect Trakt to Plex, Kodi, or Emby and it logs what you watch
		automatically.
	</p>

	<p>
		The VIP tier ($30/yr) adds advanced filtering, custom lists, and detailed stats. The calendar
		view showing upcoming episodes is genuinely useful for keeping up with airing shows.
	</p>

	<p>
		<strong>Strengths:</strong> Excellent TV tracking, automatic scrobbling, strong integrations with
		media servers.
	</p>

	<p>
		<strong>Weaknesses:</strong> The UI is functional but clunky compared to Letterboxd. Setup is more
		complex. No support for books, games, or other media types.
	</p>

	<h3>Simkl</h3>

	<p>
		Simkl covers TV, movies, and anime with <strong>auto-sync</strong> from streaming services. The interface
		is cleaner than Trakt, and the anime database is stronger — pulling from AniDB and MyAnimeList in
		addition to TMDB.
	</p>

	<p>
		If anime is a significant part of your watchlist, Simkl handles it better than Trakt or
		Letterboxd. The tracking is straightforward: mark episodes as watched, track progress through
		seasons, and see what is airing next.
	</p>

	<p>
		<strong>Strengths:</strong> Clean interface, strong anime database, auto-sync with streaming apps.
	</p>

	<p>
		<strong>Weaknesses:</strong> Smaller community than Letterboxd or Trakt. No book or game tracking.
		The social features are limited.
	</p>

	<h3>TV Time</h3>

	<p>
		TV Time is the <strong>most popular dedicated TV tracking app</strong>, with millions of users
		tracking episodes and seasons. The social features are built around TV — reaction tracking,
		episode discussions, and a feed of what friends are watching.
	</p>

	<p>
		Episode-by-episode tracking is its core strength. You check off episodes as you watch them,
		track how far behind you are on current shows, and get notifications for new episodes.
	</p>

	<p>
		<strong>Strengths:</strong> Strong TV series tracking, large community, episode-level granularity.
	</p>

	<p>
		<strong>Weaknesses:</strong> Owned by a large corporation (Whip Media), which has led to monetization
		changes. Movie tracking is basic. No support for books, games, or other media.
	</p>

	<h3>JustWatch</h3>

	<p>
		JustWatch is primarily a <strong>"where to stream" search engine</strong>. Type in a movie or
		show and it tells you which streaming service has it in your country. It also has a basic
		watchlist feature.
	</p>

	<p>
		It is useful for a specific problem — figuring out where something is streaming — but it is
		<strong>not really a tracker</strong>. There is no organization system, no progress tracking for
		TV shows, no logging history, and no community features.
	</p>

	<p>
		<strong>Strengths:</strong> Knows exactly which streaming service has which title. Available in many
		countries.
	</p>

	<p>
		<strong>Weaknesses:</strong> Not a true tracking app. No backlog management, no Kanban, no reviews,
		no social features.
	</p>

	<h3>BacklogBox</h3>

	<p>
		<a href="/">BacklogBox</a> takes a fundamentally different approach from the alternatives above.
		Instead of going deeper on movies or TV, it gives you
		<strong>Kanban boards for all your media</strong> — movies, TV series, books, games, and podcasts
		— in a single app.
	</p>

	<p>
		Each media type gets its own board with drag-and-drop columns: Wishlist, Backlog, In Progress,
		and Completed. Search auto-fills metadata from TMDB (movies and TV), OpenLibrary (books), IGDB
		(games), and Apple Podcasts. You also get custom lists for tracking anything else — wine,
		restaurants, travel destinations.
	</p>

	<p>
		The Discover page surfaces trending titles, recommendations, and upcoming releases across all
		media types. Public profiles let you share your boards. The pricing is $9.99/mo or $99/yr with a
		14-day free trial, no credit card required.
	</p>

	<p>
		<strong>Strengths:</strong> All media in one place, visual Kanban organization, auto-fill metadata,
		custom lists for anything.
	</p>

	<p>
		<strong>Different from Letterboxd:</strong> Less community and review focused, more organization and
		backlog management focused. If social reviews are your priority, Letterboxd is still the better choice
		for movies specifically.
	</p>

	<h2>Comparison Table</h2>

	<div class="my-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60">
					<th class="py-2 pr-4 text-left font-medium text-foreground">Feature</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Letterboxd</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Trakt</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Simkl</th>
					<th class="py-2 text-left font-medium text-foreground">BacklogBox</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Movies</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">TV Series</td>
					<td class="py-2 pr-4">Partial</td>
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
					<td class="py-2 pr-4">Kanban Boards</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Auto-fill Metadata</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Public Profile</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Community/Reviews</td>
					<td class="py-2 pr-4">Excellent</td>
					<td class="py-2 pr-4">Basic</td>
					<td class="py-2 pr-4">Limited</td>
					<td class="py-2 font-medium text-foreground">No</td>
				</tr>
				<tr>
					<td class="py-2 pr-4">Custom Lists</td>
					<td class="py-2 pr-4">Movie lists only</td>
					<td class="py-2 pr-4">Movie/TV lists</td>
					<td class="py-2 pr-4">Limited</td>
					<td class="py-2 font-medium text-foreground">Yes (anything)</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>When to Stay with Letterboxd</h2>

	<p>
		If you only watch movies and love the community, <strong>stay with Letterboxd</strong>. It is
		unbeatable at what it does. The reviews are better than any alternative. The lists are a
		discovery goldmine. The social features turn solo viewing into a shared experience.
	</p>

	<p>
		If social reviews and curated lists are your primary feature — the reason you open the app —
		nothing matches Letterboxd for movies. The alternatives listed above are stronger in other
		areas, but none of them replicate Letterboxd's community.
	</p>

	<h2>When to Switch (or Use Both)</h2>

	<p>Consider an alternative if any of these apply to you:</p>

	<ul>
		<li>
			You track <strong>multiple media types</strong> and are tired of maintaining separate apps for movies,
			TV, books, and games.
		</li>
		<li>
			You want <strong>Kanban-style organization</strong> — dragging items between Backlog, In Progress,
			and Completed instead of a flat watchlist.
		</li>
		<li>
			You care more about <strong>backlog management</strong> than social reviews. You want to know what
			to watch next, not discuss what you already watched.
		</li>
	</ul>

	<p>
		You do not have to choose one or the other. Many people keep Letterboxd for the movie community
		and use <a href="/">BacklogBox</a> for the actual backlog management across all their media. They
		serve different purposes.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">
			Track movies alongside your books, games, and TV shows
		</p>
		<p class="mt-1 text-xs text-muted-foreground">
			BacklogBox gives you Kanban boards for every media type — plus custom lists for anything else.
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
				href="/blog/best-goodreads-letterboxd-alternatives-all-in-one-media-tracker"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Goodreads & Letterboxd Alternative: Why You Need an All-in-One Media Tracker</span
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
