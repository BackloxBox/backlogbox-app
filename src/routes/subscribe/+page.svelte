<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import { authClient } from '$lib/auth-client';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Check from '@lucide/svelte/icons/check';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';

	let billing = $state<'monthly' | 'yearly'>('yearly');
	let loading = $state<'monthly' | 'yearly' | null>(null);

	const plans = {
		monthly: { price: '$9.99', period: '/mo', slug: 'monthly' },
		yearly: { price: '$99', period: '/yr', slug: 'yearly', badge: 'Save $21' }
	} as const;

	const features = [
		'Unlimited boards for all 5 media types',
		'Drag & drop kanban organization',
		'Auto-search from TMDB, OpenLibrary, IGDB & more',
		'Public profile & shareable boards',
		'Full access to all future features'
	] as const;

	const categories = [
		{ icon: BookOpen, label: 'Books', color: '#3B82F6' },
		{ icon: Film, label: 'Movies', color: '#22C55E' },
		{ icon: Tv, label: 'Series', color: '#F59E0B' },
		{ icon: Gamepad2, label: 'Games', color: '#F97316' },
		{ icon: Podcast, label: 'Podcasts', color: '#EF4444' }
	] as const;

	async function subscribe(slug: 'monthly' | 'yearly') {
		loading = slug;
		try {
			await authClient.checkout({ slug });
		} finally {
			loading = null;
		}
	}
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
	<!-- Background decoration (matching landing page) -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #3B82F6"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #F59E0B"
		></div>
	</div>

	<!-- Nav -->
	<nav class="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
		<a href="/" class="text-sm font-bold tracking-tight text-foreground">BacklogBox</a>
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
			<Button variant="ghost" size="sm" href="/" class="gap-1.5">
				<ArrowLeft class="size-3.5" />
				Back
			</Button>
		</div>
	</nav>

	<!-- Content -->
	<div class="relative z-10 mx-auto max-w-lg px-6 pt-12 pb-24 text-center sm:pt-20">
		<!-- Category pills -->
		<div class="mb-6 flex flex-wrap items-center justify-center gap-2">
			{#each categories as cat (cat.label)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
				>
					<span style:color={cat.color}><cat.icon class="size-3" /></span>
					{cat.label}
				</span>
			{/each}
		</div>

		<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			One plan.
			<span class="subscribe-gradient bg-clip-text text-transparent">Everything included.</span>
		</h1>

		<p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
			Track your books, movies, series, games, and podcasts — all in one beautiful kanban board.
		</p>

		<!-- Billing toggle -->
		<div class="mt-8 inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
			<button
				class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors {billing === 'monthly'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (billing = 'monthly')}
			>
				Monthly
			</button>
			<button
				class="rounded-full px-4 py-1.5 text-xs font-medium transition-colors {billing === 'yearly'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (billing = 'yearly')}
			>
				Yearly
				{#if billing === 'yearly'}
					<span class="ml-1.5 text-[10px] font-semibold text-green-500">Save $21</span>
				{/if}
			</button>
		</div>

		<!-- Pricing card -->
		<div
			class="mt-6 rounded-xl border border-border bg-card/60 p-6 text-left shadow-sm backdrop-blur-sm sm:p-8"
		>
			<div class="flex items-baseline gap-1">
				<span class="text-4xl font-bold tracking-tight text-foreground">
					{plans[billing].price}
				</span>
				<span class="text-sm text-muted-foreground">{plans[billing].period}</span>
			</div>

			{#if billing === 'yearly'}
				<p class="mt-1 text-xs text-green-500">That's $8.25/mo — 2 months free</p>
			{/if}

			<ul class="mt-6 space-y-3">
				{#each features as feature (feature)}
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						{feature}
					</li>
				{/each}
			</ul>

			<Button
				class="mt-8 w-full"
				size="lg"
				disabled={loading !== null}
				onclick={() => subscribe(billing)}
			>
				{#if loading}
					Redirecting...
				{:else}
					Subscribe {billing === 'yearly' ? 'Yearly' : 'Monthly'}
				{/if}
			</Button>

			<p class="mt-3 text-center text-[11px] text-muted-foreground/60">
				Cancel anytime from your settings. Powered by Polar.
			</p>
		</div>
	</div>
</div>

<style>
	.subscribe-gradient {
		background-image: linear-gradient(135deg, #3b82f6, #22c55e, #f59e0b);
	}
</style>
