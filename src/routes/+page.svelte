<script lang="ts">
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
	import Check from '@lucide/svelte/icons/check';
	import Search from '@lucide/svelte/icons/search';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Globe from '@lucide/svelte/icons/globe';
	import ListPlus from '@lucide/svelte/icons/list-plus';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import Wine from '@lucide/svelte/icons/wine';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let mobileMenuOpen = $state(false);
	let billing = $state<'monthly' | 'yearly'>('yearly');

	const pills = [
		{ icon: BookOpen, label: 'Books', color: '#3B82F6' },
		{ icon: Film, label: 'Movies', color: '#22C55E' },
		{ icon: Tv, label: 'Series', color: '#F59E0B' },
		{ icon: Gamepad2, label: 'Games', color: '#F97316' },
		{ icon: Podcast, label: 'Podcasts', color: '#EF4444' },
		{ icon: ListPlus, label: 'Custom Lists', color: '#8B5CF6' }
	] as const;

	const features = [
		{
			icon: LayoutDashboard,
			title: 'Kanban for every media type',
			description:
				'Dedicated drag & drop boards for books, movies, series, games, and podcasts. See your progress at a glance.',
			color: '#3B82F6'
		},
		{
			icon: Search,
			title: 'Auto-search & auto-fill',
			description:
				'Search TMDB, OpenLibrary, IGDB & more. Cover art, metadata, and details fill in automatically.',
			color: '#22C55E'
		},
		{
			icon: ListPlus,
			title: 'Custom lists for anything',
			description:
				'Track wines, restaurants, travel destinations — anything. Create kanban boards with custom fields for any topic.',
			color: '#8B5CF6'
		},
		{
			icon: Globe,
			title: 'Public profile & sharing',
			description:
				"Share your boards with a link. Your public profile shows what you're tracking, reading, and playing.",
			color: '#F97316'
		}
	] as const;

	const customListExamples = [
		{ icon: Wine, label: 'Wine Collection', color: '#8B5CF6', items: 24 },
		{ icon: MapPin, label: 'Travel Bucket List', color: '#06B6D4', items: 18 },
		{ icon: UtensilsCrossed, label: 'Restaurants to Try', color: '#F43F5E', items: 31 }
	] as const;

	const steps = [
		{
			num: '01',
			title: 'Add your media',
			description:
				'Search for titles or add them manually. Covers and metadata fill in automatically.'
		},
		{
			num: '02',
			title: 'Organize your board',
			description:
				'Drag items between columns — wishlist, backlog, in progress, completed. Your rules.'
		},
		{
			num: '03',
			title: 'Share your taste',
			description: 'Enable your public profile and share your boards with anyone via a simple link.'
		}
	] as const;

	const plans = {
		monthly: { price: '$9.99', period: '/mo', slug: 'monthly' },
		yearly: { price: '$99', period: '/yr', slug: 'yearly' }
	} as const;

	const pricingFeatures = [
		'Unlimited boards for all 5 media types',
		'Custom lists for anything you want to track',
		'Drag & drop kanban organization',
		'Auto-search from TMDB, OpenLibrary, IGDB & more',
		'Dashboard with stats & progress charts',
		'Public profile & shareable boards',
		'Full access to all future features'
	] as const;

	const boardTabs = [
		{ icon: Film, label: 'Movies', active: true },
		{ icon: Tv, label: 'Series', active: false },
		{ icon: BookOpen, label: 'Books', active: false },
		{ icon: Gamepad2, label: 'Games', active: false },
		{ icon: Podcast, label: 'Podcasts', active: false }
	] as const;

	const boardColumns = [
		{ name: 'Wishlist', color: '#3B82F6', cards: ['Dune: Part Two', 'The Brutalist'] },
		{ name: 'Backlog', color: '#737373', cards: ['Nosferatu', 'Conclave', 'Anora'] },
		{ name: 'In Progress', color: '#F59E0B', cards: ['The Substance'] },
		{ name: 'Completed', color: '#22C55E', cards: ['Oppenheimer', 'Poor Things'] }
	] as const;

	function scrollTo(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
		mobileMenuOpen = false;
	}
</script>

<svelte:head>
	<meta
		name="description"
		content="Organize your books, movies, TV shows, games, and podcasts in one Kanban-style tracker. Drag items from backlog to completed. Custom lists for anything."
	/>
	<meta
		property="og:title"
		content="Media Tracker & Backlog Manager - Books, Movies, Games | BacklogBox"
	/>
	<meta
		property="og:description"
		content="Organize your books, movies, TV shows, games, and podcasts in one Kanban-style tracker. Drag items from backlog to completed. Custom lists for anything."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Media Tracker & Backlog Manager - Books, Movies, Games | BacklogBox"
	/>
	<meta
		name="twitter:description"
		content="Organize your books, movies, TV shows, games, and podcasts in one Kanban-style tracker. Drag items from backlog to completed. Custom lists for anything."
	/>
	<meta name="twitter:image" content="https://backlogbox.com/og.png" />
</svelte:head>

<div class="relative min-h-screen bg-background">
	<!-- Ambient background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
		<div
			class="absolute -top-48 -right-48 h-[700px] w-[700px] rounded-full opacity-[0.05] blur-[140px] dark:opacity-[0.035]"
			style="background: #3B82F6"
		></div>
		<div
			class="absolute top-[45%] -left-64 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[140px] dark:opacity-[0.03]"
			style="background: #F59E0B"
		></div>
		<div
			class="absolute top-[75%] right-[15%] h-[500px] w-[500px] rounded-full opacity-[0.04] blur-[140px] dark:opacity-[0.025]"
			style="background: #22C55E"
		></div>
	</div>

	<!-- ================================================================== -->
	<!-- NAV                                                                 -->
	<!-- ================================================================== -->
	<nav class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 lg:px-8">
			<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="BacklogBox" class="size-5" />
				BacklogBox
			</a>

			<!-- Desktop -->
			<div class="hidden items-center gap-1 md:flex">
				<Button variant="ghost" size="sm" onclick={() => scrollTo('features')}>Features</Button>
				<Button variant="ghost" size="sm" onclick={() => scrollTo('pricing')}>Pricing</Button>
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
				<Button size="sm" href="/register">Start Free Trial</Button>
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
			<div class="border-t border-border/40 bg-background/95 px-6 py-4 backdrop-blur-xl md:hidden">
				<div class="flex flex-col gap-1">
					<button
						class="rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={() => scrollTo('features')}
					>
						Features
					</button>
					<button
						class="rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={() => scrollTo('pricing')}
					>
						Pricing
					</button>
					<a
						href="/blog"
						class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Blog
					</a>
					<div class="my-2 h-px bg-border/60"></div>
					<a
						href="/login"
						class="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						Sign in
					</a>
					<div class="pt-1">
						<Button size="sm" href="/register" class="w-full">Start Free Trial</Button>
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<!-- ================================================================== -->
	<!-- HERO                                                                -->
	<!-- ================================================================== -->
	<section class="landing-section pt-24 pb-16 sm:pt-32 sm:pb-20">
		<div class="mx-auto max-w-3xl text-center">
			<!-- Pills -->
			<div class="mb-10 flex flex-wrap items-center justify-center gap-2">
				{#each pills as pill, i (pill.label)}
					<span class="landing-pill" style="animation-delay: {i * 60}ms">
						<span style:color={pill.color}><pill.icon class="size-3" /></span>
						{pill.label}
					</span>
				{/each}
			</div>

			<h1
				class="landing-fade-in text-4xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
			>
				Track Your Books, Movies,
				<br />
				<span class="hero-gradient bg-clip-text text-transparent">Games & More</span>
			</h1>

			<p
				class="landing-fade-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
				style="animation-delay: 100ms"
			>
				The all-in-one media backlog tracker. Kanban boards for books, movies, series, games, and
				podcasts — plus custom lists for anything else.
				<span class="font-medium text-foreground">14-day free trial, no card required.</span>
			</p>

			<div
				class="landing-fade-in mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
				style="animation-delay: 200ms"
			>
				<Button size="lg" href="/register" class="w-full gap-2 sm:w-auto">
					Start Free Trial
					<ArrowRight class="size-4" />
				</Button>
				<Button variant="outline" size="lg" href="/login" class="w-full sm:w-auto">Sign in</Button>
			</div>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- APP PREVIEW                                                         -->
	<!-- ================================================================== -->
	<section class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-4xl">
			<div class="landing-board-preview">
				<!-- Window chrome -->
				<div class="flex items-center gap-2 border-b border-border/40 px-5 py-3">
					<div class="size-[9px] rounded-full bg-muted-foreground/20"></div>
					<div class="size-[9px] rounded-full bg-muted-foreground/20"></div>
					<div class="size-[9px] rounded-full bg-muted-foreground/20"></div>
				</div>

				<!-- Board tabs -->
				<div class="scrollbar-none flex items-center gap-0.5 overflow-x-auto px-5 pt-3 pb-2">
					{#each boardTabs as tab (tab.label)}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors sm:text-xs {tab.active
								? 'bg-muted text-foreground'
								: 'text-muted-foreground/50'}"
						>
							<tab.icon class="size-3" />
							{tab.label}
						</span>
					{/each}
				</div>

				<!-- Kanban columns -->
				<div class="grid grid-cols-2 gap-2 px-5 pt-2 pb-5 sm:grid-cols-4 sm:gap-3">
					{#each boardColumns as col (col.name)}
						<div class="space-y-1.5">
							<div class="flex items-center gap-1.5 px-0.5 pb-1">
								<span class="size-1.5 shrink-0 rounded-full" style:background-color={col.color}
								></span>
								<span class="text-[10px] font-medium text-muted-foreground sm:text-xs">
									{col.name}
								</span>
								<span class="text-[9px] text-muted-foreground/40 tabular-nums">
									{col.cards.length}
								</span>
							</div>
							{#each col.cards as card (card)}
								<div class="landing-board-card">
									<GripVertical class="hidden size-3 shrink-0 text-muted-foreground/20 sm:block" />
									<p
										class="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground sm:text-xs"
									>
										{card}
									</p>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
			<p class="mt-5 text-center text-[11px] tracking-wide text-muted-foreground/40 uppercase">
				A separate board for each media type — drag items between columns
			</p>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- FEATURES                                                            -->
	<!-- ================================================================== -->
	<section id="features" class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-4xl">
			<div class="mb-14 max-w-lg">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					A media tracker built to
					<span class="hero-gradient bg-clip-text text-transparent">keep you organized</span>
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
					Built for people who consume media across every format — and want to track more than just
					media.
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each features as feature (feature.title)}
					<div class="landing-feature-card">
						<div
							class="mb-4 inline-flex size-10 items-center justify-center rounded-xl"
							style="background-color: {feature.color}12"
						>
							<span style:color={feature.color}><feature.icon class="size-[18px]" /></span>
						</div>
						<h3 class="text-[15px] font-semibold text-foreground">{feature.title}</h3>
						<p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
							{feature.description}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- CUSTOM LISTS SHOWCASE                                               -->
	<!-- ================================================================== -->
	<section class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-4xl">
			<div class="landing-card overflow-hidden">
				<div class="flex flex-col gap-10 p-8 sm:flex-row sm:items-center sm:p-10">
					<div class="flex-1">
						<div
							class="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
						>
							<Sparkles class="size-3 text-amber-400" />
							New
						</div>
						<h3 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							Custom lists for
							<span class="hero-gradient bg-clip-text text-transparent">anything</span>
						</h3>
						<p class="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
							Not just media. Create kanban boards for wines, restaurants, travel destinations, or
							anything you want to organize. Add custom fields, pick an icon, and track it your way.
						</p>
					</div>

					<div class="flex shrink-0 flex-col gap-2.5 sm:w-60">
						{#each customListExamples as list (list.label)}
							<div class="landing-list-example">
								<div
									class="flex size-9 items-center justify-center rounded-lg"
									style="background-color: {list.color}12"
								>
									<span style:color={list.color}><list.icon class="size-4" /></span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium text-foreground">{list.label}</p>
									<p class="text-[10px] text-muted-foreground/60 tabular-nums">
										{list.items} items
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- HOW IT WORKS                                                        -->
	<!-- ================================================================== -->
	<section class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-4xl">
			<div class="mb-14 text-center">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					How BacklogBox works
				</h2>
				<p class="mt-3 text-sm text-muted-foreground sm:text-base">
					Set up your media backlog in minutes. Three steps.
				</p>
			</div>

			<div class="grid gap-px overflow-hidden rounded-2xl border border-border/60 sm:grid-cols-3">
				{#each steps as step, i (step.num)}
					<div
						class="relative bg-card/30 p-8 backdrop-blur-sm {i < 2
							? 'border-b border-border/60 sm:border-r sm:border-b-0'
							: ''}"
					>
						<span
							class="mb-4 block text-[11px] font-bold tracking-widest text-muted-foreground/40 uppercase"
						>
							Step {step.num}
						</span>
						<h3 class="text-[15px] font-semibold text-foreground">{step.title}</h3>
						<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
							{step.description}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- PRICING                                                             -->
	<!-- ================================================================== -->
	<section id="pricing" class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-md">
			<div class="mb-10 text-center">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Simple pricing.
					<span class="hero-gradient bg-clip-text text-transparent">Full media tracker access.</span
					>
				</h2>
				<p class="mt-3 text-sm text-muted-foreground sm:text-base">
					Start with a 14-day free trial. No tiers, no feature gates.
				</p>
			</div>

			<!-- Billing toggle -->
			<div class="mb-6 flex justify-center">
				<div class="inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-1">
					<button
						class="rounded-full px-4 py-1.5 text-xs font-medium transition-all {billing ===
						'monthly'
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (billing = 'monthly')}
					>
						Monthly
					</button>
					<button
						class="rounded-full px-4 py-1.5 text-xs font-medium transition-all {billing === 'yearly'
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
			</div>

			<!-- Card -->
			<div class="landing-card p-7 sm:p-8">
				<div class="flex items-baseline gap-1">
					<span class="text-4xl font-bold tracking-tight text-foreground">
						{plans[billing].price}
					</span>
					<span class="text-sm text-muted-foreground">{plans[billing].period}</span>
				</div>

				{#if billing === 'yearly'}
					<p class="mt-1.5 text-xs font-medium text-green-500">That's $8.25/mo — 2 months free</p>
				{/if}

				<ul class="mt-7 space-y-3">
					{#each pricingFeatures as feature (feature)}
						<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
							<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
							{feature}
						</li>
					{/each}
				</ul>

				<Button class="mt-8 w-full" size="lg" href="/register">Start 14-Day Free Trial</Button>

				<p class="mt-3 text-center text-[11px] text-muted-foreground/40">
					No credit card required. Cancel anytime.
				</p>
			</div>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- FOOTER                                                              -->
	<!-- ================================================================== -->
	<footer class="relative z-10 border-t border-border/40">
		<div
			class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row lg:px-8"
		>
			<div class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="BacklogBox" class="size-4" />
				BacklogBox
			</div>
			<div class="flex items-center gap-5 text-xs text-muted-foreground/60">
				<a href="/login" class="transition-colors hover:text-foreground">Sign in</a>
				<a href="/register" class="transition-colors hover:text-foreground">Register</a>
				<button class="transition-colors hover:text-foreground" onclick={() => scrollTo('pricing')}>
					Pricing
				</button>
				<a href="/blog" class="transition-colors hover:text-foreground">Blog</a>
			</div>
			<p class="text-[11px] text-muted-foreground/30">
				&copy; {new Date().getFullYear()} BacklogBox
			</p>
		</div>
	</footer>
</div>

<style>
	/* ------------------------------------------------------------------ */
	/* Gradient accent                                                     */
	/* ------------------------------------------------------------------ */
	.hero-gradient {
		background-image: linear-gradient(135deg, #3b82f6 0%, #22c55e 50%, #f59e0b 100%);
	}

	/* ------------------------------------------------------------------ */
	/* Section rhythm — consistent horizontal padding + z-index            */
	/* ------------------------------------------------------------------ */
	.landing-section {
		position: relative;
		z-index: 10;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}
	@media (min-width: 1024px) {
		.landing-section {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Entrance animations                                                 */
	/* ------------------------------------------------------------------ */
	.landing-fade-in {
		animation: fadeUp 0.6s ease-out both;
	}
	.landing-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		border-radius: 9999px;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--background) 60%, transparent);
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--muted-foreground);
		backdrop-filter: blur(8px);
		animation: fadeUp 0.5s ease-out both;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ------------------------------------------------------------------ */
	/* Board preview — the hero visual                                     */
	/* ------------------------------------------------------------------ */
	.landing-board-preview {
		border-radius: 1rem;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 50%, transparent);
		backdrop-filter: blur(12px);
		box-shadow:
			0 0 0 1px color-mix(in oklch, var(--border) 30%, transparent),
			0 4px 24px -4px rgb(0 0 0 / 0.08),
			0 12px 48px -8px rgb(0 0 0 / 0.06);
	}
	:global(.dark) .landing-board-preview {
		box-shadow:
			0 0 0 1px color-mix(in oklch, var(--border) 40%, transparent),
			0 4px 24px -4px rgb(0 0 0 / 0.3),
			0 12px 48px -8px rgb(0 0 0 / 0.2);
	}

	.landing-board-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--background) 80%, transparent);
		padding: 0.5rem 0.625rem;
		transition: border-color 0.15s ease;
	}
	.landing-board-card:hover {
		border-color: color-mix(in oklch, var(--border) 100%, var(--foreground) 10%);
	}

	/* ------------------------------------------------------------------ */
	/* Cards — shared across features, pricing, custom lists               */
	/* ------------------------------------------------------------------ */
	.landing-card {
		border-radius: 1rem;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 40%, transparent);
		backdrop-filter: blur(12px);
	}

	.landing-feature-card {
		border-radius: 1rem;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--card) 30%, transparent);
		backdrop-filter: blur(8px);
		padding: 1.5rem;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}
	.landing-feature-card:hover {
		background: color-mix(in oklch, var(--card) 60%, transparent);
		border-color: color-mix(in oklch, var(--border) 100%, var(--foreground) 8%);
		transform: translateY(-2px);
	}

	.landing-list-example {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border);
		background: color-mix(in oklch, var(--background) 50%, transparent);
		padding: 0.625rem 0.75rem;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	.landing-list-example:hover {
		background: color-mix(in oklch, var(--background) 70%, transparent);
		border-color: color-mix(in oklch, var(--border) 100%, var(--foreground) 8%);
	}
</style>
