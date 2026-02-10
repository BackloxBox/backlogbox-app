<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const user = $derived(page.data.user);

	const categories = [
		{ icon: BookOpen, label: 'Books', color: '#3B82F6' },
		{ icon: Film, label: 'Movies', color: '#22C55E' },
		{ icon: Tv, label: 'Series', color: '#F59E0B' },
		{ icon: Gamepad2, label: 'Games', color: '#F97316' },
		{ icon: Podcast, label: 'Podcasts', color: '#EF4444' }
	] as const;

	const columns = ['Wishlist', 'Backlog', 'In Progress', 'Completed'] as const;
	const columnColors = ['#3B82F6', '#737373', '#F59E0B', '#22C55E'] as const;
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
	<!-- Background decoration -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #3B82F6"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #F59E0B"
		></div>
		<div
			class="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-[100px] dark:opacity-[0.03]"
			style="background: #22C55E"
		></div>
	</div>

	<!-- Nav -->
	<nav class="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
		<span class="text-sm font-bold tracking-tight text-foreground">BacklogBox</span>
		<div class="flex items-center gap-2">
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
			{#if user}
				<Button variant="outline" size="sm" href="/dashboard">Dashboard</Button>
			{:else}
				<Button variant="ghost" size="sm" href="/login">Sign in</Button>
				<Button size="sm" href="/register">Get Started</Button>
			{/if}
		</div>
	</nav>

	<!-- Hero -->
	<div class="relative z-10 mx-auto max-w-2xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
		<!-- Category pills -->
		<div class="mb-8 flex flex-wrap items-center justify-center gap-2">
			{#each categories as cat (cat.label)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
				>
					<span style:color={cat.color}><cat.icon class="size-3" /></span>
					{cat.label}
				</span>
			{/each}
		</div>

		<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
			Your media backlog,
			<br />
			<span class="landing-gradient bg-clip-text text-transparent">finally organized.</span>
		</h1>

		<p class="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
			A kanban board for everything you want to read, watch, play, and listen to. Drag items from
			backlog to completed.
		</p>

		<div class="mt-8 flex items-center justify-center gap-3">
			{#if user}
				<Button size="lg" href="/dashboard" class="gap-2">
					Go to Dashboard
					<ArrowRight class="size-4" />
				</Button>
			{:else}
				<Button size="lg" href="/register" class="gap-2">
					Start Tracking
					<ArrowRight class="size-4" />
				</Button>
				<Button variant="outline" size="lg" href="/login">Sign in</Button>
			{/if}
		</div>
	</div>

	<!-- Board preview -->
	<div class="relative z-10 mx-auto max-w-3xl px-6 pb-24">
		<div class="rounded-xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-6">
			<div class="grid grid-cols-4 gap-2 sm:gap-3">
				{#each columns as col, i (col)}
					<div class="space-y-2">
						<div class="flex items-center gap-1.5 px-1">
							<span class="size-1.5 shrink-0 rounded-full" style:background-color={columnColors[i]}
							></span>
							<span class="text-[10px] font-medium text-muted-foreground sm:text-xs">{col}</span>
						</div>
						<!-- Placeholder cards -->
						{#each { length: i === 1 ? 3 : i === 2 ? 2 : i === 3 ? 1 : 2 } as _, j (j)}
							<div class="h-8 rounded-md border border-border bg-background/80 sm:h-10"></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<p class="mt-4 text-center text-xs text-muted-foreground/60">
			Organize across wishlists, backlogs, and more — for each media type.
		</p>
	</div>
</div>

<style>
	.landing-gradient {
		background-image: linear-gradient(135deg, #3b82f6, #22c55e, #f59e0b);
	}
</style>
