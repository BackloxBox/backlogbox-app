<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	let { children } = $props();

	let mobileMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-background">
	<!-- Nav -->
	<nav class="sticky top-0 z-50 border-b border-border/40 bg-background">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
			<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="" class="size-5" />
				BacklogBox
			</a>

			<!-- Desktop -->
			<div class="hidden items-center gap-1 md:flex">
				<Button variant="ghost" size="sm" href="/blog">Blog</Button>
				<Button variant="ghost" size="sm" href="/#pricing">Pricing</Button>
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					onclick={toggleMode}
					aria-label="Toggle theme"
				>
					<Sun class="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon
						class="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
					/>
				</Button>
				<div class="mx-1 h-4 w-px bg-border/60"></div>
				<Button variant="ghost" size="sm" href="/login">Sign in</Button>
				<Button size="sm" href="/register">Get Started</Button>
			</div>

			<!-- Mobile -->
			<div class="flex items-center gap-1 md:hidden">
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					onclick={toggleMode}
					aria-label="Toggle theme"
				>
					<Sun class="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon
						class="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
					/>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="size-8"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label="Toggle menu"
				>
					{#if mobileMenuOpen}
						<X class="size-4" />
					{:else}
						<Menu class="size-4" />
					{/if}
				</Button>
			</div>
		</div>

		{#if mobileMenuOpen}
			<div class="border-t border-border/40 bg-background px-6 py-4 md:hidden">
				<div class="flex flex-col gap-1">
					<a
						href="/blog"
						class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Blog
					</a>
					<a
						href="/#pricing"
						class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Pricing
					</a>
					<a
						href="/login"
						class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Sign in
					</a>
					<div class="my-2 h-px bg-border/60"></div>
					<div class="pt-1">
						<Button size="sm" href="/register" class="w-full">Get Started</Button>
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Content -->
	<main class="mx-auto max-w-3xl px-6 py-12 lg:py-16">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-border/40">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
			<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="" class="size-4" />
				BacklogBox
			</a>
			<div class="flex items-center gap-4 text-xs text-muted-foreground/60">
				<a
					href="https://backlogbox.userjot.com"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-foreground">Feedback</a
				>
				<a href="mailto:yorick@backlogbox.com" class="transition-colors hover:text-foreground"
					>Support</a
				>
				<a
					href="https://x.com/backlogbox"
					target="_blank"
					rel="noopener noreferrer"
					class="transition-colors hover:text-foreground">X</a
				>
			</div>
			<p class="text-[11px] text-muted-foreground/30">
				&copy; {new Date().getFullYear()} BacklogBox
			</p>
		</div>
	</footer>
</div>

<style>
	/* ------------------------------------------------------------------ */
	/* Shared prose styles for blog post articles                          */
	/* ------------------------------------------------------------------ */

	/* Headings */
	:global(.prose-custom h2) {
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--foreground);
	}
	:global(.prose-custom h3) {
		margin-top: 1.75rem;
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground);
	}

	/* Body text */
	:global(.prose-custom :not(.not-prose) > p) {
		margin-bottom: 1rem;
		line-height: 1.75;
		color: var(--muted-foreground);
	}
	:global(.prose-custom p.lead) {
		font-size: 1.0625rem;
		color: var(--foreground);
	}
	:global(.prose-custom strong) {
		color: var(--foreground);
		font-weight: 600;
	}

	/* Links */
	:global(.prose-custom :not(.not-prose) > a:not([data-slot='button'])) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	:global(.prose-custom :not(.not-prose) > a:not([data-slot='button']):hover) {
		opacity: 0.8;
	}

	/* Lists */
	:global(.prose-custom ul) {
		margin-top: 1rem;
		margin-bottom: 1rem;
		padding-left: 0;
		list-style: none;
		color: var(--muted-foreground);
	}
	:global(.prose-custom ol) {
		margin-top: 1rem;
		margin-bottom: 1rem;
		padding-left: 0;
		list-style: none;
		counter-reset: ol-counter;
		color: var(--muted-foreground);
	}
	:global(.prose-custom ul > li) {
		position: relative;
		padding-left: 1.5rem;
		margin-bottom: 0.5rem;
		line-height: 1.75;
	}
	:global(.prose-custom ul > li::before) {
		content: '';
		position: absolute;
		left: 0.25rem;
		top: 0.75rem;
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		background-color: var(--primary);
	}
	:global(.prose-custom ol > li) {
		position: relative;
		padding-left: 2rem;
		margin-bottom: 0.5rem;
		line-height: 1.75;
		counter-increment: ol-counter;
	}
	:global(.prose-custom ol > li::before) {
		content: counter(ol-counter);
		position: absolute;
		left: 0;
		top: 0.05rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.375rem;
		height: 1.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--primary-foreground);
		background-color: var(--primary);
		border-radius: 9999px;
	}

	/* Inline code */
	:global(.prose-custom code:not(pre code)) {
		padding: 0.15rem 0.4rem;
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: 'Geist Mono', ui-monospace, monospace;
		color: var(--foreground);
		background-color: var(--muted);
		border-radius: 0.25rem;
	}

	/* Blockquote */
	:global(.prose-custom blockquote) {
		margin: 1.5rem 0;
		padding: 0.75rem 1.25rem;
		border-left: 3px solid var(--primary);
		background-color: var(--muted);
		border-radius: 0 0.375rem 0.375rem 0;
	}
	:global(.prose-custom blockquote p) {
		color: var(--foreground);
		font-style: italic;
	}

	/* Horizontal rule */
	:global(.prose-custom hr) {
		margin: 2.5rem 0;
		border: none;
		border-top: 1px solid hsl(var(--border) / 0.4);
	}
</style>
