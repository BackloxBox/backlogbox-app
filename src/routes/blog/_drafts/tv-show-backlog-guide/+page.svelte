<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('tv-show-backlog-guide')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'How do I decide what TV show to watch next?',
			answer:
				'Check for time-sensitive content first (shows leaving your streaming platforms soon). Then match your energy level: low energy favors comfort shows or light comedies, high energy is right for dense dramas or new genres. Finally, prefer shorter series when you want a quick win — a 6-episode miniseries is easier to commit to than a 7-season epic.'
		},
		{
			question: 'How many TV shows should I watch at once?',
			answer:
				'Two to three is the sweet spot. One "main" show you are invested in, one lighter show for low-energy evenings, and optionally a weekly release you follow as it airs. More than three and you start losing track of plotlines, characters, and where you left off.'
		},
		{
			question: 'Should I finish a TV show I am not enjoying?',
			answer:
				'No. The sunk cost fallacy is especially strong with TV shows because you feel invested after watching multiple episodes. But if you are three episodes in and dreading the next one, drop it. Move it to your "Dropped" column and free up your time for something you will actually enjoy.'
		},
		{
			question: 'What is the best app for tracking TV shows?',
			answer:
				'If you only track TV shows, Trakt or Simkl are strong dedicated options with episode-level tracking and auto-scrobbling. If you also track books, movies, games, or podcasts, an all-in-one tracker like BacklogBox lets you manage your TV backlog alongside all your other media in one Kanban-style interface.'
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
		<span class="text-foreground">TV Show Backlog Guide</span>
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
		You subscribe to Netflix, Disney+, HBO Max, Amazon Prime, and maybe Hulu. Each one has shows you
		"need to watch." Your friends keep recommending series. Social media spoilers are everywhere.
		And somehow you still spend 30 minutes every evening scrolling through catalogs before giving up
		and re-watching The Office.
	</p>

	<p>
		The TV show backlog is arguably the hardest media backlog to manage. Unlike books (one at a
		time) or movies (two hours and done), TV shows are long-term commitments that compete for the
		same evening hours across multiple streaming platforms. This guide gives you a practical system
		for finally getting through your streaming watchlist.
	</p>

	<h2>Why TV Show Backlogs Are Uniquely Difficult</h2>

	<p>TV shows have characteristics that make them harder to manage than other media types:</p>

	<ul>
		<li>
			<strong>Variable time commitment</strong> — A miniseries is 6 hours. A prestige drama is 60+ hours
			across multiple seasons. You cannot compare them the way you compare two 2-hour movies.
		</li>
		<li>
			<strong>Ongoing releases</strong> — New seasons drop. Weekly episodes air. Your "completed" shows
			reactivate when season 3 comes out. Books and movies do not have this problem.
		</li>
		<li>
			<strong>Platform fragmentation</strong> — The show you want to watch is on a platform you do not
			subscribe to. Or it was on Netflix last month but moved to Peacock. The availability layer adds
			friction that books and games do not have.
		</li>
		<li>
			<strong>Social pressure</strong> — "Have you watched [show]?" is the new "Have you read [book]?"
			except the pace of TV discourse is faster. Spoilers appear within days. The pressure to watch something
			"before it is spoiled" adds urgency that does not exist for most other media.
		</li>
		<li>
			<strong>Episode memory decay</strong> — Take a two-week break from a book and you can pick up where
			you left off. Take a two-week break from a complex TV show and you have forgotten half the plotlines.
			This makes stopping and restarting costly.
		</li>
	</ul>

	<h2>The Kanban Method for TV Shows</h2>

	<p>
		The same <a href="/blog/how-to-organize-your-media-backlog"
			>Kanban method that works for general media backlogs</a
		>
		works especially well for TV shows, with a few TV-specific adaptations.
	</p>

	<h3>Recommended columns</h3>

	<ul>
		<li>
			<strong>Wishlist</strong> — Shows you have heard about and might want to watch. Low commitment.
			This is where friend recommendations and social media hype go. Do not feel obligated to promote
			everything out of Wishlist.
		</li>
		<li>
			<strong>Backlog</strong> — Shows you have decided to watch. You have done enough research (trailer,
			reviews, trusted recommendation) to commit. These are queued for when you finish something in your
			active rotation.
		</li>
		<li>
			<strong>In Progress</strong> — Shows you are actively watching. This is the critical column.
			<strong>Limit it to 2-3 shows maximum.</strong> One "main" show (the one you are invested in), one
			"light" show (for low-energy evenings), and optionally one weekly release you follow as it airs.
		</li>
		<li>
			<strong>On Hold</strong> — Paused but not dropped. Waiting for the next season, or you need a break
			from a heavy show. The distinction from Backlog is important: these are partially watched, not unstarted.
		</li>
		<li>
			<strong>Completed</strong> — Finished all available seasons (or the entire series). Your trophy
			shelf.
		</li>
		<li>
			<strong>Dropped</strong> — Gave it a fair shot and it is not for you. Three episodes is a reasonable
			trial period for most shows. If you are not engaged by then, you probably will not be.
		</li>
	</ul>

	<h3>The WIP limit matters even more for TV</h3>

	<p>
		The work-in-progress limit — capping your "In Progress" column at 2-3 shows — is more important
		for TV than for any other media type. Here is why:
	</p>

	<p>
		A book stays on your nightstand. A game saves your progress. But a TV show has episode memory
		decay. The more shows you juggle simultaneously, the more likely you are to forget plot points,
		mix up character names, or lose track of where you are. Two months later, you end up restarting
		from episode 1, which means you wasted the time you already invested.
	</p>

	<p>
		Limiting yourself to 2-3 active shows means you actually remember what is happening in each one.
		You finish them faster. You enjoy them more because you are engaged, not confused.
	</p>

	<h2>The Streaming Platform Problem</h2>

	<p>
		A unique challenge with TV backlogs is that your content moves. A show on Netflix today might be
		on Peacock next month. Your backlog needs to account for this.
	</p>

	<h3>Time-sensitive watching</h3>

	<p>
		Before adding something new to your "In Progress" column, check if anything in your Backlog is
		about to leave a platform. Most streaming services announce removals 30 days in advance. If a
		show you want to watch is leaving your platform next month, it jumps the queue.
	</p>

	<p>
		This is also a useful filter for pruning. If a show leaves your platform and you did not feel
		urgency to watch it, maybe you never will. Remove it from your backlog. If it mattered, you
		would have prioritized it.
	</p>

	<h3>The subscription rotation strategy</h3>

	<p>You do not need to subscribe to every platform simultaneously. A practical approach:</p>

	<ol>
		<li>Keep one or two core platforms active year-round (the ones you use most)</li>
		<li>
			Rotate secondary platforms quarterly — subscribe for a month, binge the shows you want to see,
			cancel
		</li>
		<li>
			Use your backlog to plan rotation — when you have 3-4 shows queued on a platform, subscribe
			for a month and work through them
		</li>
	</ol>

	<p>
		This is both a budgeting strategy and a backlog management strategy. It creates natural time
		pressure (you have one month to watch these shows) which actually helps with decision-making.
	</p>

	<h2>Weekly Releases vs. Binge Watching</h2>

	<p>
		The streaming era created two distinct watching patterns, and your backlog strategy needs to
		handle both.
	</p>

	<p>
		<strong>Weekly releases</strong> (new episodes every week) do not count against your WIP limit in
		the same way. You are watching one episode per week, which takes 45-60 minutes. You can follow a weekly
		show alongside your main binge without overloading yourself. Think of weekly shows as background commitments.
	</p>

	<p>
		<strong>Binge-ready series</strong> (all episodes available) are the main event. These are what your
		WIP limit manages. When you sit down for an evening of watching, you are choosing between binge-ready
		shows, not weekly ones.
	</p>

	<p>
		A practical split: 1-2 weekly shows (low time commitment per week) plus 1-2 binge shows (your
		main evening watching). This feels like a lot, but the weekly shows only take an hour per week
		each.
	</p>

	<h2>The "Three Episode Rule"</h2>

	<p>
		How long should you give a show before dropping it? Three episodes is the commonly accepted
		threshold, and it is a reasonable one.
	</p>

	<p>
		Most shows use the first episode for setup and world-building. The second episode establishes
		the rhythm. By the third episode, you have a clear sense of whether the show is for you. If you
		are not interested by then, it is unlikely episode 7 will change your mind.
	</p>

	<p>
		Exceptions exist — some shows (Breaking Bad, The Wire) are famously slow starters. But in 2026,
		with hundreds of excellent shows competing for your time, giving every slow starter 10 episodes
		"to get good" is not a viable strategy. Three episodes. In or out.
	</p>

	<p>
		The key mindset shift: dropping a show is not failure. It is curation. Every show you drop frees
		up hours for something you will actually enjoy. Your "Dropped" column should be a source of
		pride, not guilt.
	</p>

	<h2>Managing Returning Shows</h2>

	<p>
		TV shows have a unique lifecycle problem: they come back. You finished season 2 of a show, moved
		it to Completed, and six months later season 3 drops. How do you handle this?
	</p>

	<ul>
		<li>
			<strong>Move it back to Backlog</strong> — When a new season is announced, move the show from Completed
			to Backlog. This keeps your Backlog column as the single source of truth for "what am I going to
			watch next."
		</li>
		<li>
			<strong>Separate "series completed" from "season completed"</strong> — Some trackers distinguish
			between "I finished all available content" and "this series has ended permanently." BacklogBox treats
			completed as having finished all available content — when a new season drops, you move it back to
			your queue.
		</li>
		<li>
			<strong>Re-watch before new seasons</strong> — If more than a year has passed, budget time to rewatch
			the previous season (or at least a recap). Factor this into your time estimate for the "new" content.
		</li>
	</ul>

	<h2>Building Your TV Show Backlog: A 15-Minute Setup</h2>

	<ol>
		<li>
			<strong>List every show you are currently watching</strong> — Across all platforms. These go directly
			into "In Progress." If you have more than 3, pick the 2-3 you are most engaged with and move the
			rest to "On Hold."
		</li>
		<li>
			<strong>List every show you want to watch</strong> — Check your Netflix "My List," your Disney+
			watchlist, your mental list. Everything goes into Backlog.
		</li>
		<li>
			<strong>Check for time-sensitive content</strong> — Is anything leaving a platform soon? If so,
			flag it.
		</li>
		<li>
			<strong>Prune ruthlessly</strong> — Be honest: will you actually watch all 40 shows on your list?
			Remove anything that has been on your watchlist for over a year without any movement. If you were
			going to watch it, you would have by now.
		</li>
		<li>
			<strong>Set your WIP limit</strong> — 2-3 binge shows plus any weekly releases. Write this number
			down. When you are tempted to start a 4th binge show, check your limit first.
		</li>
	</ol>

	<p>
		Tools like <a href="/">BacklogBox</a> give you a dedicated Kanban board for TV shows with
		drag-and-drop columns, auto-search from TMDB for cover art and metadata, and a dashboard that
		shows your TV progress alongside your
		<a href="/blog/game-backlog-management-guide">game backlog</a>, books, movies, and podcasts.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to tackle your streaming watchlist?</p>
		<p class="mt-1 text-xs text-muted-foreground">
			BacklogBox gives you Kanban boards for books, movies, series, games, and podcasts — plus
			custom lists for anything else.
		</p>
		<div class="mt-4">
			<Button size="sm" href="/register">
				Start Tracking <ArrowRight class="ml-1 size-3" />
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
				href="/blog/how-to-organize-your-media-backlog"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>How to Organize Your Media Backlog: Books, Movies, Games & More</span
				>
			</a>
			<a
				href="/blog/best-media-tracker-apps"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Media Tracker Apps in 2026: Track Books, Movies, Games & More</span
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
