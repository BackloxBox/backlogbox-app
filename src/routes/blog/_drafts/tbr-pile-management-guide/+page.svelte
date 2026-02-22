<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('tbr-pile-management-guide')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'How many books is too many on a TBR pile?',
			answer:
				'There is no universal number. A TBR pile becomes a problem when it causes anxiety instead of excitement, or when you spend more time curating your list than actually reading. If you feel paralyzed choosing what to read next, your TBR is too large for your current system — not necessarily too large in absolute terms.'
		},
		{
			question: 'Should I stop buying books until I finish my TBR?',
			answer:
				'A complete buying freeze rarely works because it turns reading into a guilt-driven obligation. A better approach is the "one in, one out" rule: for every new book you buy, finish or permanently remove one from your TBR. This keeps the list manageable without removing the joy of discovering new books.'
		},
		{
			question: 'How do I deal with TBR guilt?',
			answer:
				'Recognize that TBR guilt is manufactured pressure. No one is grading you on how fast you read. Separate your "interested" list from your "committed" list — moving aspirational titles to a Wishlist immediately reduces the mental weight. Give yourself permission to remove books without reading them.'
		},
		{
			question: 'What is the best app for tracking a TBR pile?',
			answer:
				'Goodreads has the largest book database but its shelf system is clunky. StoryGraph offers better mood-based recommendations. BacklogBox takes a Kanban approach with visual columns for Wishlist, Backlog, Currently Reading, and Completed — and it also tracks movies, games, and other media in one place.'
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
		<span class="text-foreground">TBR Pile Management Guide</span>
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
		You bought 12 books last month and finished 2. Your nightstand is a skyscraper of good
		intentions. Your Kindle has 300 unread titles. Welcome to <strong>TBR pile anxiety</strong> — and
		you are not alone.
	</p>

	<p>
		The to-be-read pile is a universal reader experience. It grows faster than you can read, and the
		bigger it gets, the harder it becomes to pick your next book. This guide covers practical
		strategies to organize your TBR, stop the guilt spiral, and actually enjoy reading again.
	</p>

	<h2>Why Your TBR Pile Keeps Growing</h2>

	<p>
		Before you can manage the pile, it helps to understand why it grows faster than you can read.
		The modern reader faces an unprecedented flood of book recommendations from every direction.
	</p>

	<ul>
		<li>
			<strong>BookTok and Bookstagram</strong> — Algorithms feed you a constant stream of "you MUST read
			this" recommendations. One viral video can add five books to your list before you finish your morning
			coffee.
		</li>
		<li>
			<strong>Library holds arriving all at once</strong> — You placed 8 holds three months ago and forgot.
			Now 4 are available simultaneously, each with a 2-week deadline.
		</li>
		<li>
			<strong>Bookstore impulse buys</strong> — You went in for one book and came out with a tote bag
			full. The staff picks shelf is irresistible. The "buy 2 get 1 free" table is strategically placed
			by the entrance.
		</li>
		<li>
			<strong>Kindle daily deals</strong> — A book you vaguely remember hearing about is $1.99. Adding
			it costs nothing. Except now you have 500 digital books you will never open.
		</li>
		<li>
			<strong>Book subscription boxes</strong> — A curated book arrives monthly whether you need it or
			not. The element of surprise is fun until you have 18 unread subscription picks on a shelf.
		</li>
	</ul>

	<p>
		None of these sources are bad. The issue is that there is no natural friction. Adding a book to
		your TBR takes seconds. Reading one takes days. The math never works out.
	</p>

	<h2>TBR Pile Guilt Is Not Productive</h2>

	<p>
		Let this sink in: every avid reader has more books than time. That is not a personal failure. It
		is arithmetic. You can read maybe 30-50 books a year. Hundreds of thousands of new titles are
		published annually. The pile will always grow.
	</p>

	<p>
		The goal is not to eliminate the pile. It is to make it work for you instead of against you. A
		curated TBR is a gift to your future self — a collection of books you are genuinely excited
		about. A chaotic TBR is a source of anxiety and decision paralysis.
	</p>

	<p>
		Give yourself permission to remove books without reading them. Tastes change. A book that
		excited you two years ago might not interest you today, and that is fine. Removing it is not a
		failure. It is curation.
	</p>

	<h2>The Kanban Approach to TBR Management</h2>

	<p>
		Kanban boards — originally from manufacturing — provide the most effective structure for a TBR
		pile. Instead of one massive list, you split your books into stages:
	</p>

	<ul>
		<li>
			<strong>Wishlist</strong> — Books you are interested in but have not committed to. This is where
			BookTok recommendations and "sounds cool" titles go. No pressure, no guilt.
		</li>
		<li>
			<strong>TBR / Backlog</strong> — Books you own or have firmly decided to read. This is your committed
			list. Keep it small — ideally under 15-20 titles.
		</li>
		<li>
			<strong>Currently Reading</strong> — What you are actively reading right now. Limit this to 1-2
			books. More than that and you will not make meaningful progress on any of them.
		</li>
		<li>
			<strong>Read / Completed</strong> — Done. The satisfying column that shows your progress over time.
		</li>
	</ul>

	<p>
		The key insight: <strong
			>separating "interested" from "committed" immediately shrinks the overwhelming part.</strong
		> Most of what stresses you about your TBR is actually Wishlist material — books you might read someday.
		Once you move those out of your active TBR, the committed list becomes much more manageable.
	</p>

	<h2>How to Audit Your TBR Pile</h2>

	<p>
		If your TBR is already out of control, you need a one-time audit to reset it. Set aside 30
		minutes and work through these steps:
	</p>

	<ol>
		<li>
			<strong>List everything</strong> — Every physical book on your shelf, every Kindle download, every
			library hold, every "I should read that" floating in your head. Get it all in one place.
		</li>
		<li>
			<strong>Ask: "Would I start this today?"</strong> — For each book, be honest. If you had nothing
			else to read, would you pick this one up right now? If the answer is no, move it to Wishlist or
			remove it entirely.
		</li>
		<li>
			<strong>Apply the 2-year rule</strong> — If a book has been on your TBR for 2+ years and you keep
			skipping it in favor of other titles, let it go. You have voted with your actions. That book is
			not a priority, and keeping it on the list only adds clutter.
		</li>
		<li>
			<strong>Separate physical from digital</strong> — Your physical TBR and your digital TBR need different
			strategies. A stack of 20 paperbacks on your shelf creates visual pressure. A Kindle library of
			500 titles is invisible. Treat them as separate inventories.
		</li>
	</ol>

	<p>
		After the audit, your committed TBR should feel exciting, not overwhelming. If it still feels
		too large, keep pruning. There is no rule that says you must read a book just because you bought
		it.
	</p>

	<h2>Picking Your Next Read (Without the Paralysis)</h2>

	<p>
		You finish a book. You look at your TBR. You spend 30 minutes deliberating. You end up scrolling
		your phone instead of reading. Sound familiar? Here are strategies that short-circuit the
		decision paralysis:
	</p>

	<h3>The 3-book rule</h3>

	<p>
		Always have your next 3 reads picked out in advance. When you finish a book, your next one is
		already decided. No deliberation, no paralysis. Replenish the queue when it drops below 3.
	</p>

	<h3>Mood reading with tags</h3>

	<p>
		Tag your TBR books by mood or vibe: cozy, intense, light, dark, funny, emotional. When you
		finish a heavy literary novel, you can filter for "light" and pick something that fits your
		current state instead of forcing yourself through another dense read.
	</p>

	<h3>Alternate lengths</h3>

	<p>
		Read a long literary novel, then a short thriller. Read an 800-page fantasy epic, then a
		200-page novella. This prevents burnout and gives you more frequent completion hits, which keeps
		motivation high.
	</p>

	<h3>Seasonal reading</h3>

	<p>
		Some books suit certain seasons. Gothic horror in October. Beach reads in summer. Cozy mysteries
		in winter. Seasonal cues can make the decision for you.
	</p>

	<h3>Book club as forcing function</h3>

	<p>
		A book club pick removes choice entirely. Someone else decided for you, and you have a deadline.
		If decision paralysis is your main problem, a book club solves it by design.
	</p>

	<h2>Physical TBR vs. Digital TBR</h2>

	<p>
		Physical and digital TBR piles are fundamentally different beasts, and they require different
		management approaches.
	</p>

	<h3>Physical TBR</h3>

	<p>
		Physical books are visible, beautiful, and tactile. A curated bookshelf is a statement about who
		you are. But the visibility cuts both ways — a towering stack of unread books creates
		psychological pressure every time you walk past it.
	</p>

	<p>
		Physical books also create buying pressure. Bookstores are designed to make you buy. Limited
		editions create urgency. Signed copies feel like now-or-never opportunities. And unlike digital,
		physical books take up real space.
	</p>

	<p>
		Strategy: keep your physical TBR to one shelf or one stack. When the shelf is full, you must
		finish or remove a book before adding a new one. The physical constraint becomes a natural
		limiter.
	</p>

	<h3>Digital TBR</h3>

	<p>
		Digital books are invisible, unlimited, and dangerously easy to accumulate. A Kindle library of
		500 unread books weighs nothing and takes up no space, which means there is zero natural
		friction against hoarding.
	</p>

	<p>
		The danger is that digital books become invisible. Out of sight, out of mind. You forget what
		you have, buy duplicates, and lose track of what actually interested you.
	</p>

	<p>
		Strategy: use a tracker to make your digital TBR visible. A tool like
		<a href="/">BacklogBox</a> lets you put all your books — physical and digital — into one Kanban board
		so nothing falls through the cracks. When both formats live in the same system, you can see your true
		TBR size.
	</p>

	<h2>Tools for Managing Your TBR</h2>

	<p>
		The right tool makes TBR management sustainable instead of a one-time cleanup you abandon after
		a week. Here are the main options:
	</p>

	<ul>
		<li>
			<strong>Goodreads</strong> — The largest book database and community. Shelves work for basic tracking,
			but the interface is dated and organization gets messy with large collections. Best for social features
			and reviews.
		</li>
		<li>
			<strong>StoryGraph</strong> — Modern, mood-based recommendations, better stats than Goodreads. Book-focused
			only. Great for readers who want data on their reading habits.
		</li>
		<li>
			<strong>Spreadsheets</strong> — Maximum flexibility, zero cost. But manual data entry is tedious,
			there is no cover art or auto-fill, and you will likely abandon it within a month.
		</li>
		<li>
			<strong><a href="/">BacklogBox</a></strong> — Kanban-style boards with drag-and-drop columns. Covers
			books plus movies, TV series, games, and podcasts in one app. Auto-search fills in cover art and
			metadata. Best for readers who consume multiple media types and want one system for everything.
		</li>
	</ul>

	<p>
		The best tool is the one you will actually use. If you only track books, Goodreads or StoryGraph
		may be enough. If you also have a movie watchlist, a game backlog, and a podcast queue, an
		all-in-one tracker saves you from juggling multiple apps.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to tame your TBR pile?</p>
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
