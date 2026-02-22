<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('game-backlog-management-guide')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'How many games does the average gamer have in their backlog?',
			answer:
				'Studies suggest the average Steam user has played fewer than 40% of the games they own. For users with 100+ games, the unplayed percentage is often over 70%. The "pile of shame" is a universal gaming phenomenon.'
		},
		{
			question: 'Should I stop buying new games until I clear my backlog?',
			answer:
				'A complete buying freeze rarely works because it turns gaming into a chore. Instead, adopt a "one in, one out" rule: for every new game you buy, finish or permanently drop one from your backlog. This keeps the list manageable without removing the joy of buying new titles.'
		},
		{
			question: 'What is the best game backlog tracker?',
			answer:
				'Dedicated options include Backloggd and HowLongToBeat for game-only tracking. For tracking games alongside your other media (books, movies, TV shows), BacklogBox provides Kanban boards with drag-and-drop organization and auto-search from IGDB.'
		},
		{
			question: 'How do I decide what game to play next?',
			answer:
				'Use a priority system: (1) games leaving a subscription service like Game Pass, (2) games you are genuinely excited about right now, (3) shorter games for quick wins and momentum. If a game has been in your backlog for over a year and you still have not started it, consider removing it.'
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
		<span class="text-foreground">Game Backlog Management Guide</span>
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
		Your Steam library says you own 287 games. You have played 43 of them. Another sale is next
		week. This is the <strong>pile of shame</strong> — and every gamer has one.
	</p>

	<p>
		Game backlogs are uniquely overwhelming because games demand significantly more time than other
		media. A movie is 2 hours. A book is 8-12 hours. A game can be 20, 60, or 100+ hours. When your
		backlog contains dozens of games, the total time commitment feels insurmountable.
	</p>

	<p>
		But here is the thing: you do not need to play every game you own. You need a system to decide
		which games are worth your time and a way to track your progress. This guide will give you both.
	</p>

	<h2>Why Game Backlogs Grow So Fast</h2>

	<p>Understanding why the pile grows helps you slow it down. The main culprits:</p>

	<ul>
		<li>
			<strong>Steam sales and bundles</strong> — "It is 90% off" is not a reason to buy a game you will
			never play. But it feels like one. Humble Bundles and seasonal sales add 5-10 games at a time for
			the price of a coffee.
		</li>
		<li>
			<strong>Subscription services</strong> — Game Pass, PS Plus, and EA Play add new titles monthly.
			You "have access" to hundreds of games, creating a virtual backlog on top of your purchased one.
		</li>
		<li>
			<strong>Free-to-play and giveaways</strong> — Epic Games gives away titles weekly. PlayStation and
			Xbox offer monthly freebies. Every claimed game adds to the pile.
		</li>
		<li>
			<strong>FOMO and hype cycles</strong> — When a major release drops and everyone is talking about
			it, you buy it "to play later" — and later never comes because the next hype cycle starts.
		</li>
		<li>
			<strong>Completion anxiety</strong> — Some gamers feel they must 100% a game before moving on. This
			turns a 30-hour game into a 90-hour commitment and blocks everything behind it.
		</li>
	</ul>

	<h2>The Kanban System for Game Backlogs</h2>

	<p>
		Kanban boards are the most effective way to manage a game backlog because they provide visual
		clarity. Instead of a flat list of 200 titles, you see your games organized by status:
	</p>

	<ul>
		<li>
			<strong>Wishlist</strong> — Games you are interested in but have not bought yet. This is your "maybe"
			column. When a sale hits, check this column first instead of impulse buying.
		</li>
		<li>
			<strong>Backlog</strong> — Games you own and plan to play. This is your committed list. Keep it
			manageable — ideally under 20 titles.
		</li>
		<li>
			<strong>In Progress</strong> — Games you are actively playing.
			<strong>Limit this to 2-3 games maximum.</strong>
			One long RPG, one shorter indie, and maybe one multiplayer game you play with friends. More than
			that and you will not make meaningful progress on any of them.
		</li>
		<li>
			<strong>Completed</strong> — Done. Whether you finished the story, hit credits, or decided you got
			your money's worth. This column is your trophy case.
		</li>
		<li>
			<strong>Dropped</strong> — Games you started and decided are not for you. This is not failure. It
			is intentional curation. Not every game deserves 40 hours of your life.
		</li>
	</ul>

	<p>
		Tools like <a href="/">BacklogBox</a> provide a dedicated game board with these columns built in.
		Search for a game and it auto-fills from IGDB with cover art, genre, platform, and estimated play
		time. Then just drag it between columns as you progress.
	</p>

	<h2>How to Prioritize Your Game Backlog</h2>

	<p>
		With a Kanban board set up, the next question is: what do you play first? Here is a priority
		framework:
	</p>

	<h3>1. Time-sensitive games first</h3>

	<p>
		Games leaving Game Pass or PS Plus should get priority if you are interested. Check the "leaving
		soon" list monthly and either play them or accept that you will miss them.
	</p>

	<h3>2. Short games for momentum</h3>

	<p>
		A 4-hour indie game you can finish in a weekend gives you a completion dopamine hit that keeps
		you motivated. Stacking three 100-hour RPGs back-to-back is a recipe for burnout. Alternate: one
		long game, then one or two short ones.
	</p>

	<h3>3. Play what excites you right now</h3>

	<p>
		Your mood matters. If you are in the mood for a narrative adventure but your "system" says you
		should play a racing game next, ignore the system. The goal is to enjoy gaming, not to optimize
		it. A good tracker helps you find what matches your current mood without scrolling through your
		entire library.
	</p>

	<h3>4. The "one year" rule</h3>

	<p>
		If a game has been in your backlog for over a year and you still have not started it, be honest:
		is it really something you want to play, or did you add it on impulse? Move it to "Dropped"
		without guilt. Your future self will thank you for the smaller, more curated backlog.
	</p>

	<h2>The "One In, One Out" Rule for Games</h2>

	<p>
		Every time you buy or claim a new game, you must either finish one or permanently drop one. This
		is the single most effective rule for controlling backlog growth. It forces a decision: "Is this
		new game more valuable to me than anything currently in my backlog?"
	</p>

	<p>
		Exceptions: genuinely free games (Epic giveaways) can go to Wishlist without triggering the
		rule, since they cost you nothing. But they still should not go directly to Backlog without
		displacing something.
	</p>

	<h2>Stop 100%-ing Everything</h2>

	<p>
		Completionism is the silent backlog killer. If you insist on getting every achievement, finding
		every collectible, and completing every side quest, you will play 3-4 games a year instead of
		15-20.
	</p>

	<p>Redefine "completed" for yourself:</p>

	<ul>
		<li><strong>Story games</strong> — Roll credits. That is completed.</li>
		<li>
			<strong>Open-world games</strong> — Main story plus the side content you enjoy. You do not need
			every map marker.
		</li>
		<li>
			<strong>Multiplayer games</strong> — These do not really have an end. Set a time boundary or play
			them alongside your single-player game.
		</li>
		<li>
			<strong>Roguelikes</strong> — First successful run, or a set number of hours. These are designed
			to be endless.
		</li>
	</ul>

	<h2>Tracking Play Time and Progress</h2>

	<p>
		Knowing how long a game takes helps you plan. HowLongToBeat.com provides average completion
		times. A tracker like <a href="/">BacklogBox</a> with IGDB integration gives you genre and platform
		info to estimate time investment.
	</p>

	<p>Some rough benchmarks:</p>

	<div class="my-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60">
					<th class="py-2 pr-4 text-left font-medium text-foreground">Game Type</th>
					<th class="py-2 pr-4 text-left font-medium text-foreground">Main Story</th>
					<th class="py-2 text-left font-medium text-foreground">Completionist</th>
				</tr>
			</thead>
			<tbody class="text-muted-foreground">
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Indie / Short</td>
					<td class="py-2 pr-4">3-8 hours</td>
					<td class="py-2">5-15 hours</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Action / Adventure</td>
					<td class="py-2 pr-4">10-20 hours</td>
					<td class="py-2">20-40 hours</td>
				</tr>
				<tr class="border-b border-border/20">
					<td class="py-2 pr-4">Open World RPG</td>
					<td class="py-2 pr-4">40-80 hours</td>
					<td class="py-2">100-200 hours</td>
				</tr>
				<tr>
					<td class="py-2 pr-4">JRPG</td>
					<td class="py-2 pr-4">50-100 hours</td>
					<td class="py-2">80-150 hours</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2>A Practical 30-Day Game Backlog Plan</h2>

	<ol>
		<li>
			<strong>Day 1</strong> — List every game you own and want to play. Put them on a Kanban board.
		</li>
		<li>
			<strong>Day 2</strong> — Ruthlessly prune. Move anything you are not genuinely excited about to
			Dropped. Target: backlog under 20 games.
		</li>
		<li>
			<strong>Day 3-7</strong> — Pick one short game (under 10 hours) and one longer game. Start both.
		</li>
		<li>
			<strong>Day 8-14</strong> — Finish the short game. Move it to Completed. Pick another short one.
		</li>
		<li>
			<strong>Day 15-30</strong> — Continue the pattern. By the end of the month, you should have completed
			2-4 games and have a clear, manageable backlog.
		</li>
	</ol>

	<p>
		The key insight: it is not about speed. It is about momentum. Moving games from Backlog to
		Completed is psychologically motivating in a way that a static list never is.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to tackle your pile of shame?</p>
		<p class="mt-1 text-xs text-muted-foreground">
			BacklogBox gives you a dedicated game board with Kanban columns, IGDB auto-search, and
			drag-and-drop organization.
		</p>
		<div class="mt-4">
			<Button size="sm" href="/register">
				Start Tracking Games <ArrowRight class="ml-1 size-3" />
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
