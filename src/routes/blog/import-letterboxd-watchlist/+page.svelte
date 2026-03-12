<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import BlogPostSchema from '$lib/components/seo/BlogPostSchema.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const post = getPost('import-letterboxd-watchlist')!;

	const faqItems = [
		{
			question: 'How do I export my Letterboxd data?',
			answer:
				'Go to Settings on Letterboxd, click Import & Export, then Export Your Data. You will get a ZIP file containing several CSV files.'
		},
		{
			question: 'Which Letterboxd CSV file should I upload?',
			answer:
				'It depends on what you want to import. Use watched.csv for your full watch history, watchlist.csv for movies you plan to watch, diary.csv for watched movies with ratings, or ratings.csv for just your rated films.'
		},
		{
			question: 'Will my Letterboxd ratings transfer?',
			answer:
				'Yes. Letterboxd half-star ratings (0.5 to 5.0) are rounded to whole stars (1 to 5) to match the BacklogBox rating system. A 3.5 on Letterboxd becomes 4 stars in BacklogBox.'
		},
		{
			question: 'What about movies I watched multiple times?',
			answer:
				'If you upload diary.csv, BacklogBox automatically deduplicates rewatches. It keeps the most recent watch date and rating for each film.'
		}
	] as const;
</script>

<article class="prose-custom">
	<BlogPostSchema {post} {faqItems} breadcrumbLabel="Import Letterboxd Watchlist" />

	<p class="lead">
		You can move your entire Letterboxd watch history into BacklogBox in under 2 minutes. Export a
		CSV from Letterboxd, upload it, and your movies land on a Kanban board with ratings and watch
		dates intact.
	</p>

	<h2>What You Need</h2>

	<ul>
		<li>A Letterboxd account with logged films</li>
		<li>A BacklogBox account (the 14-day Pro trial works)</li>
	</ul>

	<h2>Step 1: Export Your Letterboxd Data</h2>

	<ol>
		<li>Log in to <a href="https://letterboxd.com" rel="noopener noreferrer">Letterboxd</a></li>
		<li>Go to <strong>Settings</strong></li>
		<li>Click <strong>Import & Export</strong></li>
		<li>Click <strong>Export Your Data</strong></li>
		<li>Download the ZIP file and unzip it</li>
	</ol>

	<p>Inside the ZIP you will find several CSV files:</p>

	<div class="not-prose my-6 grid gap-3 sm:grid-cols-2">
		<div class="rounded-lg border border-border/40 p-4">
			<p class="mb-1 font-mono text-sm font-semibold text-foreground">watched.csv</p>
			<p class="mb-2 text-sm text-muted-foreground">Every film you have marked as watched</p>
			<p class="text-xs text-muted-foreground/60">Best for: full watch history (no ratings)</p>
		</div>
		<div class="rounded-lg border border-border/40 p-4">
			<p class="mb-1 font-mono text-sm font-semibold text-foreground">watchlist.csv</p>
			<p class="mb-2 text-sm text-muted-foreground">Films on your watchlist</p>
			<p class="text-xs text-muted-foreground/60">Best for: movies you plan to watch</p>
		</div>
		<div class="rounded-lg border border-primary/30 bg-primary/5 p-4">
			<div class="mb-1 flex items-center gap-2">
				<p class="font-mono text-sm font-semibold text-foreground">diary.csv</p>
				<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
					>Recommended</span
				>
			</div>
			<p class="mb-2 text-sm text-muted-foreground">Watch diary entries with dates and ratings</p>
			<p class="text-xs text-muted-foreground/60">Best for: watch history with ratings</p>
		</div>
		<div class="rounded-lg border border-border/40 p-4">
			<p class="mb-1 font-mono text-sm font-semibold text-foreground">ratings.csv</p>
			<p class="mb-2 text-sm text-muted-foreground">Just your ratings</p>
			<p class="text-xs text-muted-foreground/60">Best for: rated films only</p>
		</div>
	</div>

	<p>
		We recommend <code>diary.csv</code> for the most complete import — it includes both ratings and
		watch dates. If you just want your to-watch list, use <code>watchlist.csv</code>.
	</p>

	<h2>Step 2: Upload to BacklogBox</h2>

	<ol>
		<li>Open BacklogBox and click <strong>Import</strong> in the sidebar</li>
		<li>Click the <strong>Letterboxd</strong> card</li>
		<li>
			If you are uploading <code>watchlist.csv</code>, check the
			<strong>"This is a watchlist file"</strong> checkbox
		</li>
		<li>Select your CSV file</li>
	</ol>

	<p>
		BacklogBox instantly parses the file and shows a preview table with every film, its year,
		rating, and mapped status.
	</p>

	<h2>Step 3: Review and Import</h2>

	<p>
		Check the preview. Deselect any films you do not want. Duplicates (films already in your
		library) are flagged and deselected automatically.
	</p>

	<p>Click <strong>Import</strong> and you are done.</p>

	<h2>How Ratings Are Mapped</h2>

	<p>
		Letterboxd uses half-star increments (0.5 to 5.0). BacklogBox uses whole stars (1 to 5). Ratings
		are rounded to the nearest whole number:
	</p>

	<div class="not-prose my-6">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Letterboxd</Table.Head>
					<Table.Head>BacklogBox</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row
					><Table.Cell class="font-mono text-xs">0.5 - 1.0</Table.Cell><Table.Cell
						>1 star</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">1.5 - 2.0</Table.Cell><Table.Cell
						>2 stars</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">2.5 - 3.0</Table.Cell><Table.Cell
						>3 stars</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">3.5 - 4.0</Table.Cell><Table.Cell
						>4 stars</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">4.5 - 5.0</Table.Cell><Table.Cell
						>5 stars</Table.Cell
					></Table.Row
				>
			</Table.Body>
		</Table.Root>
	</div>

	<h2>How Statuses Are Mapped</h2>

	<div class="not-prose my-6">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Letterboxd File</Table.Head>
					<Table.Head>BacklogBox Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row
					><Table.Cell class="font-mono text-xs">watched.csv / diary.csv / ratings.csv</Table.Cell
					><Table.Cell>Completed</Table.Cell></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">watchlist.csv</Table.Cell><Table.Cell
						>Wishlist</Table.Cell
					></Table.Row
				>
			</Table.Body>
		</Table.Root>
	</div>

	<h2>Cover Art and Metadata</h2>

	<p>
		After import, BacklogBox searches TMDB for each film to fetch poster art, genre, and director.
		This happens in the background — your movies appear instantly, and posters fill in over the next
		few minutes.
	</p>

	<h2>After Import</h2>

	<p>
		Open your <strong>Movies</strong> board to see everything organized in Kanban columns. From here you
		can drag films between statuses, add ratings, or start tracking new movies — alongside your books,
		games, and other media.
	</p>

	<!-- CTA -->
	<div class="not-prose my-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
		<p class="mb-1 text-lg font-semibold text-foreground">
			Ready to import your Letterboxd history?
		</p>
		<p class="mb-4 text-sm text-muted-foreground">
			Start a free 14-day Pro trial. No credit card required.
		</p>
		<a href="/login">
			<Button>
				Get Started Free
				<ArrowRight class="ml-1 size-4" />
			</Button>
		</a>
	</div>

	<!-- FAQ -->
	<h2>Frequently Asked Questions</h2>

	{#each faqItems as item (item.question)}
		<h3>{item.question}</h3>
		<p>{item.answer}</p>
	{/each}

	<hr class="my-10 border-border/40" />

	<div class="not-prose">
		<p class="mb-4 text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
			Related articles
		</p>
		<div class="space-y-3">
			<a
				href="/blog/import-goodreads-library"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>How to Import Your Goodreads Library into BacklogBox</span
				>
			</a>
			<a
				href="/blog/best-letterboxd-alternative"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>Best Letterboxd Alternatives in 2026: Movie & TV Trackers Compared</span
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
		</div>
	</div>
</article>
