<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
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

	const siteUrl = 'https://backlogbox.com';

	const faqItems = [
		{
			question: 'Is there a free trial?',
			answer:
				'Yes — every new account starts with a 14-day free trial with full access to all features. No credit card required.'
		},
		{
			question: 'What media types can I track?',
			answer:
				'BacklogBox has dedicated boards for books, movies, TV series, games, and podcasts. You can also create custom lists for anything else — wines, restaurants, travel destinations, and more.'
		},
		{
			question: 'How is BacklogBox different from Goodreads or Letterboxd?',
			answer:
				'Goodreads is books-only and Letterboxd is movies-only. BacklogBox tracks all your media in one place with a unified kanban workflow, plus custom lists for non-media items. One app instead of five.'
		},
		{
			question: 'Can I share my boards with friends?',
			answer:
				"Yes. You can enable a public profile and share any board via a simple link. Others can see what you're tracking, reading, or playing — no account required to view."
		},
		{
			question: 'Can I cancel anytime?',
			answer:
				'Absolutely. You can cancel your subscription at any time from your account settings. Your data stays accessible until the end of your billing period.'
		}
	] as const;

	function scrollTo(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
		mobileMenuOpen = false;
	}
</script>

<svelte:head>
	<link
		rel="preload"
		as="image"
		href="/hero.webp"
		type="image/webp"
		imagesrcset="/hero-640w.webp 640w, /hero-1024w.webp 1024w, /hero-1536w.webp 1536w, /hero-2048w.webp 2048w, /hero.webp 3436w"
		imagesizes="(max-width: 1024px) 100vw, 1024px"
		fetchpriority="high"
	/>
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

	<!-- BreadcrumbList — Home (single item for homepage) -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: siteUrl
			}
		]
	})}</${'script'}>`}

	<!-- FAQPage -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	})}</${'script'}>`}

	<!-- HowTo — "How BacklogBox works" -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'How BacklogBox works',
		description: 'Set up your media backlog in minutes. Three steps.',
		step: steps.map((s, i) => ({
			'@type': 'HowToStep',
			position: i + 1,
			name: s.title,
			text: s.description
		}))
	})}</${'script'}>`}
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
	<nav class="sticky top-0 z-50 border-b border-border/40 bg-background">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 lg:px-8">
			<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
				<img src="/backlogbox-logo.svg" alt="BacklogBox" class="size-5" />
				BacklogBox
			</a>

			<!-- Desktop -->
			<div class="hidden items-center gap-1 md:flex">
				<Button variant="ghost" size="sm" onclick={() => scrollTo('features')}>Features</Button>
				<Button variant="ghost" size="sm" onclick={() => scrollTo('pricing')}>Pricing</Button>
				<Button variant="ghost" size="sm" onclick={() => scrollTo('faq')}>FAQ</Button>
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
			<div class="border-t border-border/40 bg-background px-6 py-4 md:hidden">
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
					<button
						class="rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={() => scrollTo('faq')}
					>
						FAQ
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
		<div class="mx-auto max-w-5xl">
			<!-- Gradient backdrop -->
			<div
				class="landing-hero-backdrop relative flex justify-center overflow-hidden rounded-xl"
				style="
					aspect-ratio: 5/3;
					background:
						radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15), transparent 50%),
						radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.12), transparent 50%),
						radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.08), transparent 60%),
						linear-gradient(135deg, var(--color-muted), color-mix(in oklch, var(--color-muted) 50%, transparent));
				"
			>
				<!-- Blur overlay — diffuses the radial gradients into a soft glow -->
				<div
					class="pointer-events-none absolute inset-0 z-10 size-full rounded-xl"
					style="backdrop-filter: blur(100px); -webkit-backdrop-filter: blur(100px)"
				></div>

				<!-- Inset ring overlay -->
				<div
					class="pointer-events-none absolute inset-0 z-30 size-full rounded-xl ring-1 ring-foreground/5 ring-inset"
				></div>

				<!-- Browser chrome — overflows bottom for clipped peek effect -->
				<div
					class="absolute inset-x-0 top-0 -bottom-20 z-20 flex w-full justify-center p-4 sm:p-6 md:p-8"
				>
					<div
						class="shadow-macos h-full w-full overflow-hidden rounded-xl px-1.5 pb-1.5 ring-1 ring-border/20 backdrop-blur-xl"
						style="background: color-mix(in oklch, var(--color-background) 50%, transparent)"
					>
						<!-- macOS traffic lights -->
						<div class="flex items-center gap-1.5 px-2 py-2.5">
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-red-500"
							></div>
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-yellow-500"
							></div>
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-green-500"
							></div>
						</div>

						<!-- Hero screenshot -->
						<img
							src="/hero.webp"
							srcset="/hero-640w.webp 640w, /hero-1024w.webp 1024w, /hero-1536w.webp 1536w, /hero-2048w.webp 2048w, /hero.webp 3436w"
							sizes="(max-width: 1024px) 100vw, 1024px"
							alt="BacklogBox kanban board showing games organized across Wishlist, Backlog, Playing, and Completed columns with cover art"
							width="3436"
							height="1806"
							class="h-auto w-full rounded-lg ring-1 ring-border/10"
							loading="eager"
							decoding="async"
							fetchpriority="high"
						/>
					</div>
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
	<!-- DISCOVER                                                            -->
	<!-- ================================================================== -->
	<section class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-4xl">
			<div class="mb-14 max-w-lg">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Find your next
					<span class="hero-gradient bg-clip-text text-transparent">favorite</span>
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
					Personalized recommendations, trending titles, and upcoming releases — all in one place.
					No more tab-hopping to find what to watch, read, or play next.
				</p>
			</div>
		</div>

		<div class="mx-auto max-w-5xl">
			<!-- Gradient backdrop -->
			<div
				class="landing-hero-backdrop relative flex justify-center overflow-hidden rounded-xl"
				style="
					aspect-ratio: 5/3;
					background:
						radial-gradient(circle at 25% 75%, rgba(168, 85, 247, 0.15), transparent 50%),
						radial-gradient(circle at 75% 25%, rgba(59, 130, 246, 0.12), transparent 50%),
						radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.08), transparent 60%),
						linear-gradient(135deg, var(--color-muted), color-mix(in oklch, var(--color-muted) 50%, transparent));
				"
			>
				<!-- Blur overlay -->
				<div
					class="pointer-events-none absolute inset-0 z-10 size-full rounded-xl"
					style="backdrop-filter: blur(100px); -webkit-backdrop-filter: blur(100px)"
				></div>

				<!-- Inset ring overlay -->
				<div
					class="pointer-events-none absolute inset-0 z-30 size-full rounded-xl ring-1 ring-foreground/5 ring-inset"
				></div>

				<!-- Browser chrome -->
				<div
					class="absolute inset-x-0 top-0 -bottom-20 z-20 flex w-full justify-center p-4 sm:p-6 md:p-8"
				>
					<div
						class="shadow-macos h-full w-full overflow-hidden rounded-xl px-1.5 pb-1.5 ring-1 ring-border/20 backdrop-blur-xl"
						style="background: color-mix(in oklch, var(--color-background) 50%, transparent)"
					>
						<!-- macOS traffic lights -->
						<div class="flex items-center gap-1.5 px-2 py-2.5">
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-red-500"
							></div>
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-yellow-500"
							></div>
							<div
								class="size-[9px] rounded-full border border-foreground/10 bg-muted-foreground/15 transition-colors hover:bg-green-500"
							></div>
						</div>

						<!-- Discover screenshot -->
						<img
							src="/discover.webp"
							srcset="/discover-640w.webp 640w, /discover-1024w.webp 1024w, /discover-1536w.webp 1536w, /discover-2048w.webp 2048w, /discover.webp 3064w"
							sizes="(max-width: 1024px) 100vw, 1024px"
							alt="BacklogBox discover page showing personalized recommendations, trending titles, and upcoming releases with cover art"
							width="3064"
							height="1800"
							class="h-auto w-full rounded-lg ring-1 ring-border/10"
							loading="lazy"
							decoding="async"
						/>
					</div>
				</div>
			</div>
			<p class="mt-5 text-center text-[11px] tracking-wide text-muted-foreground/40 uppercase">
				Recommendations powered by your backlog — trending, anticipated & personalized picks
			</p>
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
	<!-- FAQ                                                                 -->
	<!-- ================================================================== -->
	<section id="faq" class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-2xl">
			<div class="mb-14 text-center">
				<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Frequently asked questions
				</h2>
				<p class="mt-3 text-sm text-muted-foreground sm:text-base">
					Everything you need to know before getting started.
				</p>
			</div>

			<Accordion.Root type="multiple" class="space-y-2">
				{#each faqItems as item, i (item.question)}
					<Accordion.Item value="faq-{i}" class="landing-card px-6">
						<Accordion.Trigger
							class="py-5 text-[15px] font-medium text-foreground hover:no-underline"
						>
							{item.question}
						</Accordion.Trigger>
						<Accordion.Content
							class="overflow-hidden text-sm leading-relaxed text-muted-foreground"
						>
							<div class="pb-5">{item.answer}</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
	</section>

	<!-- ================================================================== -->
	<!-- CTA                                                                 -->
	<!-- ================================================================== -->
	<section class="landing-section pb-28 sm:pb-32">
		<div class="mx-auto max-w-2xl text-center">
			<h2
				class="text-3xl leading-[1.15] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
			>
				Ready to organize your
				<span class="hero-gradient bg-clip-text text-transparent">media backlog</span>?
			</h2>
			<p class="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
				Start your 14-day free trial today. No credit card required. Track books, movies, games, and
				more in one place.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button size="lg" href="/register" class="w-full gap-2 sm:w-auto">
					Start Free Trial
					<ArrowRight class="size-4" />
				</Button>
				<Button
					variant="outline"
					size="lg"
					onclick={() => scrollTo('pricing')}
					class="w-full sm:w-auto"
				>
					View Pricing
				</Button>
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
			<div
				class="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground/60"
			>
				<a href="/login" class="transition-colors hover:text-foreground">Sign in</a>
				<a href="/register" class="transition-colors hover:text-foreground">Register</a>
				<button class="transition-colors hover:text-foreground" onclick={() => scrollTo('pricing')}>
					Pricing
				</button>
				<a href="/blog" class="transition-colors hover:text-foreground">Blog</a>
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
	/* Hero screenshot — macOS-style window shadow                         */
	/* ------------------------------------------------------------------ */
	.shadow-macos {
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 20px 25px -5px rgb(0 0 0 / 0.1),
			0 25px 50px -12px rgb(0 0 0 / 0.25);
	}
	:global(.dark) .shadow-macos {
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.06),
			0 4px 6px -1px rgb(0 0 0 / 0.2),
			0 10px 15px -3px rgb(0 0 0 / 0.2),
			0 20px 25px -5px rgb(0 0 0 / 0.25),
			0 25px 50px -12px rgb(0 0 0 / 0.5);
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
