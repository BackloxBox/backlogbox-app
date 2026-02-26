<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	const post = getPost('import-from-goodreads-letterboxd-backloggd')!;
	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;

	const faqItems = [
		{
			question: 'Can I export my data from Goodreads?',
			answer:
				'Yes. Goodreads lets you export your entire library as a CSV file. Go to My Books, then click "Import and export" in the left sidebar, then click "Export Library." The CSV includes titles, authors, ratings, shelves, dates read, and review text. The export is instant for most libraries.'
		},
		{
			question: 'Can I export my data from Letterboxd?',
			answer:
				'Yes. Letterboxd provides a full data export in CSV format. Go to Settings > Import & Export > Export Your Data. You will receive a ZIP file containing separate CSVs for your diary, ratings, reviews, watchlist, and lists. Letterboxd is one of the most export-friendly platforms available.'
		},
		{
			question: 'Can I export my data from Backloggd?',
			answer:
				'Backloggd does not currently offer a built-in export feature. You can manually recreate your game list using the IGDB database that both Backloggd and BacklogBox pull from, which means cover art and metadata will auto-fill when you search for each title.'
		},
		{
			question: 'Will I lose my ratings and reviews when switching trackers?',
			answer:
				'It depends on the source. Goodreads and Letterboxd exports include ratings, reviews, and dates. When importing into a new tracker, ratings typically transfer cleanly. Long-form reviews may need manual migration depending on the target platform. BacklogBox preserves ratings during import.'
		},
		{
			question: 'Can I use both Goodreads and BacklogBox at the same time?',
			answer:
				'Absolutely. Many people keep a specialized tracker for community features (Goodreads reading groups, Letterboxd reviews) and use BacklogBox for the actual backlog management across all media types. They serve different purposes and work well together.'
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
		<span class="text-foreground">Import from Goodreads, Letterboxd & Backloggd</span>
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
		You have years of reading history on Goodreads, a carefully curated watchlist on Letterboxd, and
		a pile of shame documented on Backloggd. Switching to a new tracker should not mean starting
		from scratch.
	</p>

	<p>
		This guide walks you through exporting your data from the most popular single-media trackers and
		consolidating everything into one place. Whether you are switching completely or keeping your
		existing accounts alongside an <a
			href="/blog/best-goodreads-letterboxd-alternatives-all-in-one-media-tracker"
			>all-in-one media tracker</a
		>, the first step is getting your data out.
	</p>

	<h2>Why Consolidate Your Media Tracking?</h2>

	<p>
		If you track books, movies, TV shows, and games, you are probably using at least three separate
		apps. Each one has its own login, its own interface, its own notification system. The overhead
		adds up:
	</p>

	<ul>
		<li>You cannot see your total backlog across all media types in one view</li>
		<li>When you have a free evening, you check 3-4 apps before deciding what to consume</li>
		<li>Your year-end media recap requires manually gathering data from multiple sources</li>
		<li>You lose track of things because they are in the "wrong" app's backlog</li>
	</ul>

	<p>
		Consolidating into a single tracker does not mean abandoning the communities you value on
		Goodreads or Letterboxd. Many people keep their community accounts active for social features
		while using <a href="/">BacklogBox</a> for the actual backlog organization. The key is having one
		place where you can see everything.
	</p>

	<h2>Exporting from Goodreads (Books)</h2>

	<p>
		Goodreads has one of the most straightforward export processes. Your entire library exports as a
		single CSV file.
	</p>

	<h3>Step-by-step export</h3>

	<ol>
		<li>Log in to <strong>goodreads.com</strong> on desktop (not the mobile app)</li>
		<li>Click <strong>"My Books"</strong> in the top navigation</li>
		<li>In the left sidebar, click <strong>"Import and export"</strong></li>
		<li>Click <strong>"Export Library"</strong></li>
		<li>Wait for the export to generate (usually under 30 seconds)</li>
		<li>Click the download link when it appears</li>
	</ol>

	<h3>What you get</h3>

	<p>The Goodreads CSV includes:</p>

	<ul>
		<li><strong>Title and author</strong> — Full book metadata</li>
		<li><strong>ISBN</strong> — Universal book identifier for matching across platforms</li>
		<li><strong>Your rating</strong> — 1-5 star rating</li>
		<li>
			<strong>Shelves</strong> — Which Goodreads shelves each book is on (read, currently-reading, to-read,
			plus custom shelves)
		</li>
		<li><strong>Date read</strong> and <strong>date added</strong> — Your reading timeline</li>
		<li><strong>Review text</strong> — Your full reviews if you wrote any</li>
		<li><strong>Page count</strong> and <strong>publication year</strong></li>
	</ul>

	<h3>Shelf-to-column mapping</h3>

	<p>When importing into a Kanban-style tracker, Goodreads shelves map naturally to columns:</p>

	<ul>
		<li><strong>to-read</strong> shelf &rarr; <strong>Backlog</strong> column</li>
		<li><strong>currently-reading</strong> shelf &rarr; <strong>In Progress</strong> column</li>
		<li><strong>read</strong> shelf &rarr; <strong>Completed</strong> column</li>
		<li>
			Custom shelves &rarr; Either <strong>Wishlist</strong> or custom columns, depending on how you used
			them
		</li>
	</ul>

	<h2>Exporting from Letterboxd (Movies)</h2>

	<p>
		Letterboxd is exceptionally export-friendly. They provide a complete data export that includes
		everything you have ever logged.
	</p>

	<h3>Step-by-step export</h3>

	<ol>
		<li>Log in to <strong>letterboxd.com</strong></li>
		<li>Go to <strong>Settings</strong> (click your avatar, then Settings)</li>
		<li>Scroll to <strong>"Import & Export"</strong></li>
		<li>Click <strong>"Export Your Data"</strong></li>
		<li>Download the ZIP file</li>
	</ol>

	<h3>What you get</h3>

	<p>The Letterboxd export is a ZIP containing multiple CSV files:</p>

	<ul>
		<li>
			<strong>diary.csv</strong> — Every film you logged with date watched, rating, and rewatch flag
		</li>
		<li>
			<strong>ratings.csv</strong> — All your ratings (0.5 to 5 stars, in half-star increments)
		</li>
		<li><strong>reviews.csv</strong> — Full text of every review you wrote</li>
		<li><strong>watchlist.csv</strong> — Your watchlist items with date added</li>
		<li><strong>lists.csv</strong> — Your custom lists and their contents</li>
	</ul>

	<h3>Watchlist-to-column mapping</h3>

	<ul>
		<li><strong>watchlist.csv</strong> items &rarr; <strong>Backlog</strong> column</li>
		<li><strong>diary.csv</strong> items (watched) &rarr; <strong>Completed</strong> column</li>
		<li>Films rated but not in diary &rarr; <strong>Completed</strong> (rated implies watched)</li>
	</ul>

	<h2>Exporting from Trakt (TV Shows & Movies)</h2>

	<p>
		Trakt stores detailed watch history including individual episode progress, which makes it
		especially valuable for TV show data.
	</p>

	<h3>Step-by-step export</h3>

	<ol>
		<li>Log in to <strong>trakt.tv</strong></li>
		<li>Go to <strong>Settings > Data</strong></li>
		<li>Click <strong>"Export"</strong></li>
		<li>Select what to export: history, ratings, watchlist, or all</li>
		<li>Download the JSON or CSV file</li>
	</ol>

	<p>
		Alternatively, Trakt has a robust API. If the built-in export does not give you what you need,
		third-party tools like <strong>TraktRater</strong> or the Trakt API can pull your full history programmatically.
	</p>

	<h3>What you get</h3>

	<ul>
		<li>
			<strong>Watch history</strong> — Every movie and episode you have watched, with timestamps
		</li>
		<li><strong>Ratings</strong> — 1-10 scale ratings for movies and shows</li>
		<li><strong>Watchlist</strong> — Your queued items</li>
		<li><strong>Collection</strong> — Items you own (physical or digital)</li>
		<li><strong>Episode progress</strong> — Which episodes you have watched per show</li>
	</ul>

	<h2>Exporting from Backloggd (Games)</h2>

	<p>
		Backloggd does not currently offer a built-in data export. This is one of the platform's
		limitations. However, there are workarounds:
	</p>

	<ul>
		<li>
			<strong>Manual recreation</strong> — Since both Backloggd and BacklogBox use the IGDB database for
			game metadata, you can search for your titles and they will auto-fill with the same cover art and
			details. For a library under 50 games, this takes 15-20 minutes.
		</li>
		<li>
			<strong>Steam import</strong> — If most of your games are on Steam, export your Steam library directly.
			Steam provides library data through its API, and many trackers support Steam import.
		</li>
		<li>
			<strong>Screenshot method</strong> — Take screenshots of your Backloggd shelves and use them as
			a reference while adding games to your new tracker. Not elegant, but effective.
		</li>
	</ul>

	<h2>Importing into BacklogBox</h2>

	<p>
		BacklogBox is building import support for all major platforms. Here is what is available and
		what is coming:
	</p>

	<ul>
		<li>
			<strong>Goodreads CSV import</strong> — Coming soon. Upload your Goodreads CSV and your books will
			be mapped to the correct Kanban columns automatically based on shelf data.
		</li>
		<li>
			<strong>Letterboxd CSV import</strong> — Coming soon. Watchlist items go to Backlog, watched films
			go to Completed, ratings preserved.
		</li>
		<li>
			<strong>Trakt import</strong> — Coming soon. TV show progress and movie history imported with episode-level
			tracking.
		</li>
		<li>
			<strong>Manual entry with auto-search</strong> — Available now. Search for any title and metadata
			auto-fills from TMDB, OpenLibrary, IGDB, and more.
		</li>
	</ul>

	<p>
		In the meantime, you can start building your backlog manually using the auto-search feature.
		Adding a title takes about 5 seconds — search, click, and it is on your board with cover art and
		metadata filled in.
	</p>

	<h2>Tips for a Clean Migration</h2>

	<ol>
		<li>
			<strong>Do not import everything blindly</strong> — A migration is a great time to prune. If you
			have 300 books on Goodreads and realistically will never read 200 of them, only import the ones
			you actually intend to read. A smaller, curated backlog is more useful than a complete historical
			archive.
		</li>
		<li>
			<strong>Start with one media type</strong> — Do not try to migrate books, movies, TV shows, and
			games all at once. Pick the one you track most actively, import that, get comfortable with the new
			system, then add the rest.
		</li>
		<li>
			<strong>Keep your old accounts</strong> — There is no reason to delete your Goodreads or
			Letterboxd accounts. The communities are valuable. Use them for social features and discovery,
			use BacklogBox for <a href="/blog/how-to-organize-your-media-backlog">backlog management</a>.
		</li>
		<li>
			<strong>Set up your columns first</strong> — Before importing, decide on your column structure.
			The default Wishlist / Backlog / In Progress / Completed works for most people, but you might want
			to add "Dropped" or "On Hold" columns before importing.
		</li>
	</ol>

	<div
		class="not-prose my-10 rounded-xl border border-border/60 bg-card/30 p-6 text-center backdrop-blur-sm"
	>
		<p class="text-sm font-medium text-foreground">Ready to consolidate your media tracking?</p>
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
					>Best Media Tracker Apps in 2026: Track Books, Movies, Games & More</span
				>
			</a>
			<a
				href="/blog/how-to-organize-your-media-backlog"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>How to Organize Your Media Backlog: Books, Movies, Games & More</span
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
