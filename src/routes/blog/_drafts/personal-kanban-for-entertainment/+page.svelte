<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('personal-kanban-for-entertainment')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'What is personal Kanban?',
			answer:
				'Personal Kanban is a lightweight productivity method based on two rules: visualize your work and limit your work in progress. You create columns on a board (such as Backlog, In Progress, and Completed) and move cards between them as you make progress. It was popularized by Jim Benson and Tonianne DeMaria Barry.'
		},
		{
			question: 'How many items should I have in my "In Progress" column?',
			answer:
				'Most people find that 2-3 items is the sweet spot. One long-form item (a book or TV series) and one or two shorter ones (a movie or a podcast series) keeps you progressing without spreading yourself too thin. The exact number depends on your free time, but fewer is almost always better.'
		},
		{
			question: 'Should I use one Kanban board for all media or separate boards?',
			answer:
				'Separate boards per media type are generally easier to manage. A single board mixing books, games, and TV shows gets cluttered fast. Tools like BacklogBox give you a dedicated board for each media type with a dashboard that shows your activity across all of them.'
		},
		{
			question: 'Is personal Kanban better than a simple watchlist or reading list?',
			answer:
				'Yes, for most people. A flat list gives you no structure — it just grows. Kanban adds status (where is each item?), constraints (how many are you actively consuming?), and visual flow (what finished recently?). These three additions turn a paralyzing list into an actionable system.'
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
		<span class="text-foreground">Personal Kanban for Entertainment</span>
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
		Kanban revolutionized how teams ship software. But the same method that helps engineers manage
		sprint boards works just as well for your Netflix watchlist, your reading pile, and that Steam
		library you keep meaning to get through.
	</p>

	<p>
		If you have ever opened a streaming app with the intention to watch something, scrolled for 20
		minutes, and then given up — you have a backlog problem. Not a willpower problem. A
		<strong>visibility</strong> problem. Personal Kanban fixes that.
	</p>

	<h2>What Is Personal Kanban?</h2>

	<p>
		Kanban started on the factory floor. In the 1940s, Toyota developed a visual card system to
		manage inventory and production flow. Each card represented a task, and cards moved across a
		board as work progressed. The system was so effective that software teams adopted it decades
		later to manage development sprints.
	</p>

	<p>
		In 2011, Jim Benson and Tonianne DeMaria Barry published <strong>Personal Kanban</strong>, which
		distilled the method down to two rules:
	</p>

	<ol>
		<li><strong>Visualize your work</strong> — Put everything on a board where you can see it.</li>
		<li>
			<strong>Limit your work in progress (WIP)</strong> — Do not start more things than you can realistically
			handle at once.
		</li>
	</ol>

	<p>
		That is it. Columns on a board. Cards that move left to right. A cap on how many cards can sit
		in the "doing" column at any time. Simple enough to set up in 10 minutes, powerful enough to
		change how you consume media.
	</p>

	<h2>Why Kanban Works for Entertainment</h2>

	<p>
		Decision fatigue is real. Research shows that the more choices you face, the worse your
		decisions become — or you avoid deciding entirely. This is exactly what happens when you open
		Netflix with 50 items on your watchlist. You scroll, you deliberate, you re-read synopses you
		have already read, and 20 minutes later you put on a show you have already seen three times.
	</p>

	<p>
		A Kanban board short-circuits this cycle. When you sit down to watch something, you do not
		browse your entire watchlist. You look at your <strong>In Progress</strong> column. There are two
		or three items in it. You pick one. Done.
	</p>

	<p>
		The visual nature of the board also makes progress tangible. Dragging a card from "In Progress"
		to "Completed" is a small but real dopamine hit. Over time, your Completed column grows, and you
		can see months of books read, shows finished, and games beaten. A flat list never gives you
		that.
	</p>

	<h2>Setting Up Your Entertainment Kanban</h2>

	<p>
		Every entertainment Kanban board needs four core columns. You can add more later, but start with
		these:
	</p>

	<ul>
		<li>
			<strong>Wishlist</strong> — Items you are interested in but have not committed to. A friend recommended
			a book, you saw a trailer that looked good, someone on Reddit mentioned a podcast. These go here.
			Low commitment, no pressure.
		</li>
		<li>
			<strong>Backlog</strong> — Items you have decided you will consume. You have moved past "maybe"
			and into "yes, this is happening." This is your curated queue.
		</li>
		<li>
			<strong>In Progress</strong> — What you are actively watching, reading, or playing right now. This
			is the most important column because it has a limit (more on that next).
		</li>
		<li>
			<strong>Completed</strong> — Done. Finished the book, watched the last episode, rolled credits on
			the game. Your trophy shelf.
		</li>
	</ul>

	<p>Two optional columns that many people find useful:</p>

	<ul>
		<li>
			<strong>Dropped</strong> — You started it, gave it a fair shot, and it is not for you. There is
			no shame in this column. Not every book deserves your time, and not every show earns its second
			season. Dropping something frees up your WIP limit for something you will actually enjoy.
		</li>
		<li>
			<strong>On Hold</strong> — Paused but not abandoned. Maybe you are waiting for the next season,
			or you need a break from a dense book. The distinction from Dropped matters: On Hold items come
			back.
		</li>
	</ul>

	<h2>The WIP Limit: The Most Important Rule</h2>

	<p>
		If you take one thing from this article, let it be this: <strong
			>limit your "In Progress" column to 2-3 items</strong
		>. This single constraint is what separates Kanban from a regular list.
	</p>

	<p>
		Without a WIP limit, you end up with 8 half-read books, 5 half-watched series, and 3 games you
		started but cannot remember the controls for. You are technically "in progress" on everything
		but actually finishing nothing.
	</p>

	<p>
		Finishing things is more satisfying than starting things. A WIP limit forces you to complete (or
		deliberately drop) something before you start the next thing. It sounds restrictive, but it is
		liberating. You stop feeling guilty about the 15 things you are "supposed to be" consuming,
		because there are only 2-3 things on your plate at any given time.
	</p>

	<p>
		A good starting point: one long-form item (a book, a TV series, or a long game) and one or two
		shorter items (a movie, a short game, a podcast series). Adjust based on how much free time you
		have.
	</p>

	<h2>One Board Per Media Type vs. One Board for Everything</h2>

	<p>This is a common question, and there are real trade-offs either way.</p>

	<p>
		<strong>Separate boards per media type</strong> give you a cleaner view. Your book board shows only
		books. Your movie board shows only movies. When you want to pick a game to play, you are not scrolling
		past TV shows and podcasts. Each board stays manageable, and you can set different WIP limits per
		type (maybe 2 books at a time but only 1 game).
	</p>

	<p>
		<strong>A single mega-board</strong> gives you a total overview of everything you are consuming across
		all media. The downside is clutter. Once you have 50+ cards across books, movies, games, TV shows,
		and podcasts, one board becomes hard to scan.
	</p>

	<p>
		The approach <a href="/">BacklogBox</a> takes is the best of both: a separate Kanban board per media
		type, with a dashboard that surfaces your "In Progress" items across all boards. You get the clean
		per-type management and the bird's-eye view.
	</p>

	<h2>Kanban vs. Simple Lists: What Is the Difference?</h2>

	<p>
		You might be thinking: "I already have a watchlist. Why do I need a board?" Fair question. Here
		is what Kanban adds that a list does not:
	</p>

	<ul>
		<li>
			<strong>Status</strong> — A list is flat. Everything sits in the same pile. A board separates items
			by where they are in your pipeline: waiting, active, or done.
		</li>
		<li>
			<strong>Constraints</strong> — A list can grow to 200 items without friction. A board with a WIP
			limit forces you to make decisions: what matters enough to be "In Progress" right now?
		</li>
		<li>
			<strong>Visual flow</strong> — Cards move left to right. You can see progress happening. A list
			with checkboxes does not give you the same sense of momentum.
		</li>
	</ul>

	<p>
		A list of 200 titles is paralyzing. A board with 3 items "In Progress," 10 in "Backlog," and a
		growing "Completed" column is actionable. The information is the same — the structure changes
		everything.
	</p>

	<h2>Getting Started in 10 Minutes</h2>

	<p>You do not need a complex setup. You can be up and running in 10 minutes with these steps:</p>

	<ol>
		<li>
			<strong>Pick one media type</strong> — Start with whatever you consume most. Do not try to organize
			everything at once. Books, movies, games — just pick one.
		</li>
		<li>
			<strong>Brain dump titles</strong> — Write down every title you can think of that you want to watch,
			read, or play. Do not filter yet. Just get them out of your head.
		</li>
		<li>
			<strong>Sort into columns</strong> — Wishlist (interested, not committed), Backlog (committed, coming
			soon), In Progress (active right now), Completed (done).
		</li>
		<li>
			<strong>Set your WIP limit</strong> — Pick 2-3 items for "In Progress." Move everything else to
			Backlog or Wishlist.
		</li>
		<li>
			<strong>Start consuming</strong> — Pick something from "In Progress" and go. When you finish it,
			move it to Completed, pull the next item from Backlog, and repeat.
		</li>
	</ol>

	<p>
		If you want a tool that gives you this structure out of the box,
		<a href="/">BacklogBox</a> provides Kanban boards for books, movies, TV series, games, and podcasts
		with drag-and-drop columns, auto-search from external databases, and custom lists for anything else
		you want to track.
	</p>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to try Kanban for your media backlog?</p>
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
		margin-top: 0.75rem;
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
