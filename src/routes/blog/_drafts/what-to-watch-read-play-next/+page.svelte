<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('what-to-watch-read-play-next')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'How do I decide what to watch next?',
			answer:
				'Start by checking if anything in your backlog is time-sensitive (leaving a streaming platform soon, a library hold expiring). If not, match your current energy level to the content: low energy means a familiar genre or short runtime, high energy means something new or challenging. Limit your active "In Progress" list to 2-3 items so you are choosing from a short list, not an endless one.'
		},
		{
			question: 'Why do I spend more time choosing than watching?',
			answer:
				'This is called decision fatigue, also known as the paradox of choice. When you have dozens or hundreds of options with no filtering system, your brain struggles to commit. The fix is pre-deciding: curate a short list of 3-5 "next up" items when you are not under pressure to choose, then pick from that short list when you sit down to watch.'
		},
		{
			question: 'What is the best way to manage a media backlog?',
			answer:
				'A Kanban board with columns like Wishlist, Backlog, In Progress, and Completed is the most effective method. It gives you visual structure, limits how many things you consume at once, and makes progress tangible. Tools like BacklogBox provide this for books, movies, TV shows, games, and podcasts in one app.'
		},
		{
			question: 'Should I force myself to finish something I am not enjoying?',
			answer:
				'No. The sunk cost fallacy applies to entertainment too. If you are 3 episodes into a show and dreading the next one, drop it. Moving something to a "Dropped" column is a valid decision that frees your time for something you will actually enjoy. Life is too short for media you do not like.'
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
		<span class="text-foreground">What to Watch, Read, or Play Next</span>
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
		You have a free evening. You open Netflix. You scroll. You check Goodreads. You scroll some
		more. Thirty minutes later you have consumed nothing except your own time. The problem is not
		that you have nothing to watch, read, or play. The problem is that you have too much.
	</p>

	<p>
		This is the paradox of choice applied to entertainment. The more options you have, the harder it
		becomes to pick one. And the harder it is to pick, the more likely you are to default to
		re-watching something familiar or doom-scrolling social media instead.
	</p>

	<p>
		This guide gives you a concrete decision framework for picking what to consume next — one that
		works across books, movies, TV shows, games, and podcasts.
	</p>

	<h2>Why Choosing Feels So Hard</h2>

	<p>
		Psychologist Barry Schwartz coined the term "paradox of choice" to describe how more options
		lead to worse decisions and less satisfaction. His research found that people with fewer choices
		were not only happier with their selection but also less anxious during the selection process.
	</p>

	<p>
		Your media backlog is a textbook example. A watchlist with 5 items is manageable. A watchlist
		with 80 items is paralyzing. Add in the books on your shelf, the games in your Steam library,
		and the podcasts people keep recommending, and you are choosing from hundreds of options with no
		system for narrowing them down.
	</p>

	<p>Three specific factors make media decisions harder than they need to be:</p>

	<ol>
		<li>
			<strong>No urgency signal</strong> — Unlike a work deadline, entertainment has no built-in priority.
			Everything feels equally optional, so nothing feels urgent enough to pick.
		</li>
		<li>
			<strong>Fear of commitment</strong> — A 60-hour RPG or a 1,000-page book is a significant time investment.
			The fear of choosing "wrong" and wasting that time keeps you in limbo.
		</li>
		<li>
			<strong>Scattered information</strong> — Your options live across 5 different apps and platforms.
			You cannot see the full picture, so you cannot compare effectively.
		</li>
	</ol>

	<h2>The Decision Framework: Four Filters</h2>

	<p>
		Instead of staring at your entire backlog, run your options through four sequential filters.
		Each filter narrows the field until you have 1-2 clear choices.
	</p>

	<h3>Filter 1: Time-Sensitive First</h3>

	<p>
		Start with anything that has a deadline. This is the easiest filter because it removes
		subjective judgment entirely.
	</p>

	<ul>
		<li>A movie leaving Netflix or another streaming platform this month</li>
		<li>A library book due back next week</li>
		<li>A game leaving Game Pass or PS Plus</li>
		<li>A limited-time event in a live-service game</li>
		<li>
			A podcast series that is culturally relevant right now (you will lose the context later)
		</li>
	</ul>

	<p>
		If something is time-sensitive and you genuinely want to consume it, it goes to the top. No
		further deliberation needed.
	</p>

	<h3>Filter 2: Match Your Energy</h3>

	<p>
		If nothing is time-sensitive, match the content to your current state. This is the single
		biggest improvement most people can make to their media selection. Do not pick what you "should"
		consume. Pick what fits your energy level right now.
	</p>

	<ul>
		<li>
			<strong>Low energy</strong> — Comfort re-watch, light comedy, a familiar genre, a podcast you can
			listen to passively, a casual game. Do not try to start a dense literary novel when you are exhausted.
		</li>
		<li>
			<strong>Medium energy</strong> — A new show that has been recommended to you, a genre you enjoy,
			an indie game with a 6-hour runtime. Something engaging but not demanding.
		</li>
		<li>
			<strong>High energy</strong> — The prestige drama everyone is talking about, the challenging book
			you have been meaning to read, the complex strategy game. Save these for when you can actually give
			them your attention.
		</li>
	</ul>

	<p>
		Mismatching energy and content is why people abandon things. You start a cerebral thriller when
		you are tired, you do not enjoy it, and it sits half-finished for months. That is not the
		content's fault. It is a timing problem.
	</p>

	<h3>Filter 3: Short Completes First</h3>

	<p>
		If you still have multiple options after the energy filter, lean toward shorter items. There is
		a real psychological benefit to completion. Finishing a 90-minute movie or a 4-hour indie game
		gives you momentum. Your "Completed" column grows, and that visible progress motivates you to
		keep going.
	</p>

	<p>
		This does not mean you should only consume short things. It means that when you are stuck
		choosing between a 90-minute movie and a 40-episode anime series, the movie is the better
		default unless you are specifically in the mood for the series.
	</p>

	<p>
		A practical rule: always have at least one "quick win" in your active rotation. One long-form
		item (a book, a series, a big game) paired with one short item (a movie, a short game, a
		documentary) keeps your completion rate healthy.
	</p>

	<h3>Filter 4: Gut Check</h3>

	<p>
		After running through the first three filters, you should have 1-3 options left. Now trust your
		gut. Which one gives you a small spark of excitement when you think about starting it right now?
	</p>

	<p>
		If the answer is "none of them," that is also valid. Sometimes the right choice is to not
		consume anything new and instead re-watch or re-read something you love. Comfort media has
		value. Do not let your backlog guilt you into consuming things you are not in the mood for.
	</p>

	<h2>The "Next Up" Queue</h2>

	<p>
		The framework above is for in-the-moment decisions. But you can make those decisions even faster
		by maintaining a "Next Up" queue — a short list of 3-5 items you have pre-approved for yourself.
	</p>

	<p>
		Once a week, spend 5 minutes reviewing your backlog and picking 3-5 items for "Next Up." Apply
		the four filters when you have mental bandwidth (Sunday morning, not Friday night when you are
		tired). Then when you sit down to watch or read, you pick from a curated list of 3-5 instead of
		an overwhelming backlog of 80.
	</p>

	<p>
		This is essentially the <a href="/blog/how-to-organize-your-media-backlog"
			>Kanban "In Progress" column</a
		>
		applied specifically to the decision point. Your Backlog column holds everything. Your "Next Up" or
		In Progress column holds only what you have committed to right now.
	</p>

	<h2>What to Do When You Are Stuck on Something You Started</h2>

	<p>
		The decision framework also applies to items already in progress. If you have been "watching" a
		show for three weeks but have not actually pressed play, that is a signal. Ask yourself:
	</p>

	<ul>
		<li>
			<strong>Am I avoiding it because of energy mismatch?</strong> If so, keep it but wait for the right
			mood. Move it to "On Hold."
		</li>
		<li>
			<strong>Am I avoiding it because I have lost interest?</strong> If so, drop it. Move it to "Dropped."
			No guilt. You gave it a chance.
		</li>
		<li>
			<strong>Am I avoiding it because something else is more appealing?</strong> If so, switch. Life
			is short. Follow the energy.
		</li>
	</ul>

	<p>
		The sunk cost fallacy is powerful. "I already watched 4 episodes, I should finish it." No. Those
		4 hours are gone regardless. The question is whether the remaining hours are worth your time. If
		the answer is no, reclaim those hours for something better.
	</p>

	<h2>One App vs. Five: How Consolidation Helps Decisions</h2>

	<p>
		A significant part of decision difficulty comes from fragmentation. Your books are on Goodreads,
		movies on Letterboxd, games on Backloggd, TV on Trakt. To decide what to do with your evening,
		you have to open 4 apps and mentally compare across all of them.
	</p>

	<p>
		An all-in-one tracker like <a href="/">BacklogBox</a> puts your entire media backlog in one place.
		When you have a free evening, you open one dashboard, see your "In Progress" items across all media
		types, and pick from there. The decision is faster because the information is consolidated.
	</p>

	<p>
		Compare that to: open Goodreads (scroll past 40 books), open Letterboxd (scroll past 30 movies),
		open Steam (scroll past 200 games), give up, open TikTok. Consolidation is not a luxury — it is
		a decision-making tool.
	</p>

	<h2>The "One In, One Out" Rule</h2>

	<p>
		The best way to keep your backlog from growing out of control is the one in, one out rule: every
		time you add something new, either finish or remove one existing item. This forces
		intentionality.
	</p>

	<p>
		"Should I add this new show?" becomes "Am I willing to drop one of my current backlog items for
		this?" If the answer is no, maybe the new show is not as important as the initial excitement
		suggests.
	</p>

	<p>
		This rule is especially powerful for <a href="/blog/game-backlog-management-guide"
			>game backlogs</a
		>, where Steam sales and bundle deals make it dangerously easy to accumulate hundreds of
		unplayed titles.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Stop doom-scrolling. Start deciding.</p>
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
