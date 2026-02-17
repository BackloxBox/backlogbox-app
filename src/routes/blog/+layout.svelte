<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<!-- Nav -->
	<nav class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
			<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="" class="size-5" />
				BacklogBox
			</a>

			<div class="flex items-center gap-1">
				<Button variant="ghost" size="sm" href="/blog">Blog</Button>
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
		</div>
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
			<p class="text-[11px] text-muted-foreground/30">
				&copy; {new Date().getFullYear()} BacklogBox
			</p>
		</div>
	</footer>
</div>
