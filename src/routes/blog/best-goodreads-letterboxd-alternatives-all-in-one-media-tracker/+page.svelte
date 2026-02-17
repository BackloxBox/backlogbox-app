<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('best-goodreads-letterboxd-alternatives-all-in-one-media-tracker')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'Is there an app that tracks all media types?',
			answer:
				'Yes. BacklogBox tracks books, movies, TV series, games, and podcasts in one Kanban-style app with separate boards for each media type. You can also create custom lists for anything else.'
		},
		{
			question: 'What is the best Goodreads alternative?',
			answer:
				'For book-only tracking, popular alternatives include StoryGraph (mood-based recommendations) and Bookwyrm (open-source, federated). For tracking books alongside movies, games, and other media, BacklogBox offers an all-in-one approach with Kanban boards.'
		},
		{
			question: 'What is the best Letterboxd alternative?',
			answer:
				'For movie-only tracking with a social focus, Trakt and Simkl are popular Letterboxd alternatives. If you want to track movies alongside your other media (books, games, TV shows), BacklogBox combines them in a single Kanban-style interface.'
		},
		{
			question: 'Why use one app instead of separate trackers?',
			answer:
				'Using separate apps (Goodreads + Letterboxd + Backloggd + Trakt) means maintaining four accounts, four interfaces, and four habits. An all-in-one tracker gives you a single overview of your entire media backlog, reduces context switching, and makes it easier to decide what to consume next.'
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

	<meta name="twitter:title" content={post.title} />
	<meta name="twitter:description" content={post.description} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: post.description,
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
		<span class="text-foreground">Goodreads & Letterboxd Alternatives</span>
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
		If you are serious about tracking what you read, watch, and play, you probably have accounts on
		Goodreads, Letterboxd, Backloggd, and maybe Trakt. That is four apps, four logins, four
		different interfaces — and none of them talk to each other. There is a better way.
	</p>

	<h2>The Problem with Single-Media Trackers</h2>

	<p>
		Each specialized tracker does one thing well. Goodreads has the largest book database.
		Letterboxd has the best movie community. Backloggd understands game completion status. Trakt
		syncs with your streaming services.
	</p>

	<p>But when you use all of them together, problems emerge:</p>

	<ul>
		<li>
			<strong>No unified backlog view</strong> — You cannot see "I have 12 books, 8 movies, and 5 games
			in my backlog" in one place.
		</li>
		<li>
			<strong>Different mental models</strong> — Goodreads uses shelves, Letterboxd uses lists and watchlists,
			Backloggd uses status tags. Your brain has to switch between systems.
		</li>
		<li>
			<strong>Fragmented decision-making</strong> — When you have a free evening, you check one app, then
			another, then another. By the time you have decided, 20 minutes are gone.
		</li>
		<li>
			<strong>No cross-media insights</strong> — You cannot see that you have been watching 10 movies
			a month but only reading 1 book.
		</li>
	</ul>

	<h2>Comparison: Single-Media Trackers vs. All-in-One</h2>

	<div class="my-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60">
					<th class="py-2 pr-4 text-left font-medium text-foreground">Feature</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Goodreads</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Letterboxd</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Backloggd</th>
					<th class="py-2 text-left font-medium text-foreground">BacklogBox</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Books</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Movies</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">TV Series</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">Partial</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Games</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Podcasts</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 pr-4">No</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Custom Lists</td>
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
				<tr>
					<td class="py-2 pr-4">Public Profile</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 pr-4">Yes</td>
					<td class="py-2 font-medium text-foreground">Yes</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>Goodreads: Great Book Database, Outdated Interface</h2>

	<p>
		Goodreads has the largest book database on the web, and its reading challenges are popular. But
		the app has not had a significant redesign since Amazon acquired it in 2013. Common complaints:
	</p>

	<ul>
		<li>Cluttered interface with too many social features</li>
		<li>Slow search and page load times</li>
		<li>Limited organization — only shelves, no visual boards</li>
		<li>No way to track non-book media</li>
	</ul>

	<p>
		If you only care about books, <strong>StoryGraph</strong> is a solid Goodreads alternative with
		mood-based recommendations and better stats. But if you want to track books
		<em>and</em> your other media, an all-in-one tracker makes more sense.
	</p>

	<h2>Letterboxd: Beautiful for Movies, Nothing Else</h2>

	<p>
		Letterboxd is the gold standard for movie logging. The community, reviews, and discovery
		features are genuinely excellent. Downsides:
	</p>

	<ul>
		<li>Movies only — no TV series, no games, no books</li>
		<li>Watchlist is a flat list, not a Kanban board</li>
		<li>Pro tier required for basic stats</li>
		<li>No way to organize by priority or viewing status beyond "watched/want to watch"</li>
	</ul>

	<h2>Backloggd: Niche but Limited</h2>

	<p>
		Backloggd fills the game tracking niche well, with IGDB integration and community reviews. But
		it only does games, and its organization options are basic compared to a full Kanban system
		where you can drag games between "Backlog", "In Progress", and "Completed" columns.
	</p>

	<h2>The All-in-One Approach</h2>

	<p>
		<a href="/">BacklogBox</a> takes a different approach: instead of doing one media type deeply, it
		gives you a consistent Kanban experience across all media types. Each type gets its own board with
		columns you can customize. The search pulls from TMDB (movies/TV), OpenLibrary (books), IGDB (games),
		and more — so metadata auto-fills just like the specialized apps.
	</p>

	<p>The result: one app, one login, one organizational method for everything.</p>

	<p>
		Plus custom lists let you go beyond media entirely. Track wines, restaurants, travel
		destinations, or anything else you want to organize in a Kanban board.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">
			Tired of juggling four different tracker apps?
		</p>
		<p class="mt-1 text-xs text-muted-foreground">
			BacklogBox combines books, movies, series, games, and podcasts in one Kanban-style tracker.
		</p>
		<div class="mt-4">
			<Button size="sm" href="/register">
				Try BacklogBox <ArrowRight class="ml-1 size-3" />
			</Button>
		</div>
	</div>

	<h2>When to Keep Specialized Trackers</h2>

	<p>
		To be fair, specialized trackers have advantages. Letterboxd's community is unmatched for movie
		discussion. Goodreads' reading challenges motivate many readers. If the social and community
		aspects are what you value most, keep those apps.
	</p>

	<p>
		But if your primary goal is <strong>organization</strong> — knowing what is in your backlog, what
		you are currently consuming, and what you have finished — an all-in-one tracker with Kanban boards
		provides a cleaner, more actionable system.
	</p>

	<p>
		Many people use both: a specialized app for the community, and an all-in-one tracker for the
		actual organization.
	</p>

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
				href="/blog/how-to-organize-your-media-backlog"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>How to Organize Your Media Backlog: Books, Movies, Games & More</span
				>
			</a>
			<a
				href="/blog/game-backlog-management-guide"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Game Backlog Management: A Complete Guide to Tackling Your Pile of Shame</span
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
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		color: var(--muted-foreground);
	}
	.prose-custom :global(li) {
		margin-bottom: 0.375rem;
		line-height: 1.75;
	}
	.prose-custom :global(:not(.not-prose) > a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.prose-custom :global(:not(.not-prose) > a:hover) {
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
</style>
