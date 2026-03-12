<script lang="ts">
	import { getPost } from '$lib/blog/posts';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import BlogPostSchema from '$lib/components/seo/BlogPostSchema.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const post = getPost('import-goodreads-library')!;

	const faqItems = [
		{
			question: 'How do I export my Goodreads library?',
			answer:
				'Go to My Books on Goodreads, click Import and export in the left sidebar, then click Export Library. Goodreads will generate a CSV file you can download.'
		},
		{
			question: 'Will my ratings transfer from Goodreads?',
			answer:
				'Yes. BacklogBox imports your 1-5 star ratings exactly as they are on Goodreads. Books you did not rate will show as unrated.'
		},
		{
			question: 'What happens to my Goodreads shelves?',
			answer:
				'BacklogBox maps your Goodreads shelves to Kanban columns: "read" becomes Completed, "currently-reading" becomes In Progress, and "to-read" becomes Backlog. Custom shelves are not imported.'
		},
		{
			question: 'Does importing create duplicates?',
			answer:
				'No. BacklogBox checks for existing books by title before importing. Any books already in your library are automatically skipped.'
		}
	] as const;
</script>

<article class="prose-custom">
	<BlogPostSchema {post} {faqItems} breadcrumbLabel="Import Goodreads Library" />

	<p class="lead">
		Moving your reading history from Goodreads to BacklogBox takes about 2 minutes. Export a CSV
		from Goodreads, upload it, and your entire library shows up on a Kanban board — ratings, read
		dates, and all.
	</p>

	<h2>What You Need</h2>

	<ul>
		<li>A Goodreads account with books on your shelves</li>
		<li>A BacklogBox account (the 14-day Pro trial works)</li>
	</ul>

	<h2>Step 1: Export Your Goodreads Library</h2>

	<ol>
		<li>Log in to <a href="https://www.goodreads.com" rel="noopener noreferrer">Goodreads</a></li>
		<li>Go to <strong>My Books</strong></li>
		<li>In the left sidebar, click <strong>Import and export</strong></li>
		<li>Click <strong>Export Library</strong></li>
		<li>Wait for Goodreads to generate the file, then download the CSV</li>
	</ol>

	<p>
		The file is called something like <code>goodreads_library_export.csv</code>. It contains every
		book on your shelves — titles, authors, ISBNs, ratings, read dates, and shelf assignments.
	</p>

	<h2>Step 2: Upload to BacklogBox</h2>

	<ol>
		<li>Open BacklogBox and click <strong>Import</strong> in the sidebar</li>
		<li>Click the <strong>Goodreads</strong> card</li>
		<li>Select your downloaded CSV file</li>
	</ol>

	<p>
		BacklogBox parses the file instantly and shows you a preview of every book it found. You can see
		titles, authors, ratings, and how each Goodreads shelf maps to a Kanban column.
	</p>

	<h2>Step 3: Review and Import</h2>

	<p>
		The preview table lets you deselect any books you do not want to import. Books already in your
		BacklogBox library are flagged as duplicates and deselected by default.
	</p>

	<p>When you are ready, click <strong>Import</strong>. That is it.</p>

	<h2>What Gets Imported</h2>

	<div class="not-prose my-6">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Goodreads Field</Table.Head>
					<Table.Head>BacklogBox Field</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row><Table.Cell>Title</Table.Cell><Table.Cell>Title</Table.Cell></Table.Row>
				<Table.Row><Table.Cell>Author</Table.Cell><Table.Cell>Author</Table.Cell></Table.Row>
				<Table.Row
					><Table.Cell>ISBN / ISBN13</Table.Cell><Table.Cell>ISBN (used for cover art)</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell>Number of Pages</Table.Cell><Table.Cell>Page Count</Table.Cell></Table.Row
				>
				<Table.Row
					><Table.Cell>My Rating (1-5)</Table.Cell><Table.Cell>Rating (1-5 stars)</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell>Original Publication Year</Table.Cell><Table.Cell>Release Year</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell>Date Read</Table.Cell><Table.Cell>Completed Date</Table.Cell></Table.Row
				>
				<Table.Row
					><Table.Cell>Exclusive Shelf</Table.Cell><Table.Cell>Status (see below)</Table.Cell
					></Table.Row
				>
			</Table.Body>
		</Table.Root>
	</div>

	<h3>Shelf to Status Mapping</h3>

	<div class="not-prose my-6">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Goodreads Shelf</Table.Head>
					<Table.Head>BacklogBox Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row
					><Table.Cell class="font-mono text-xs">read</Table.Cell><Table.Cell>Completed</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">currently-reading</Table.Cell><Table.Cell
						>In Progress</Table.Cell
					></Table.Row
				>
				<Table.Row
					><Table.Cell class="font-mono text-xs">to-read</Table.Cell><Table.Cell>Backlog</Table.Cell
					></Table.Row
				>
			</Table.Body>
		</Table.Root>
	</div>

	<h2>Cover Art</h2>

	<p>
		After import, BacklogBox fetches cover images from OpenLibrary using each book's ISBN. This
		happens in the background — your books appear immediately, and covers fill in over the next few
		minutes.
	</p>

	<h2>After Import</h2>

	<p>
		Head to your <strong>Books</strong> board. Your entire reading history is now organized in Kanban
		columns. Drag books between columns, add ratings, or start tracking new reads — all alongside your
		movies, games, and other media.
	</p>

	<!-- CTA -->
	<div class="not-prose my-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
		<p class="mb-1 text-lg font-semibold text-foreground">
			Ready to import your Goodreads library?
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
				href="/blog/import-letterboxd-watchlist"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>How to Import Your Letterboxd Watchlist into BacklogBox</span
				>
			</a>
			<a
				href="/blog/tbr-pile-management-guide"
				class="block rounded-lg border border-border/40 p-4 text-sm transition-colors hover:border-border hover:bg-card/30"
			>
				<span class="font-medium text-foreground"
					>TBR Pile Out of Control? How to Finally Manage Your Reading List</span
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
