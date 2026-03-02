<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { toggleMode } from 'mode-watcher';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import Crown from '@lucide/svelte/icons/crown';

	let { data } = $props();

	let billing = $state<'monthly' | 'yearly'>('yearly');
	let loading = $state<'monthly' | 'yearly' | null>(null);

	/** null = no trial (never had one, or grandfathered), 0 = expired, >0 = active */
	const trialDaysLeft = $derived(data.trialDaysLeft);
	const trialExpired = $derived(trialDaysLeft !== null && trialDaysLeft <= 0);
	const trialActive = $derived(trialDaysLeft !== null && trialDaysLeft > 0);

	const plans = {
		monthly: { price: '$7.99', period: '/mo', slug: 'monthly' },
		yearly: { price: '$69', period: '/yr', slug: 'yearly', badge: 'Save $27' }
	} as const;

	const categories = [
		{ icon: BookOpen, label: 'Books', color: '#3B82F6' },
		{ icon: Film, label: 'Movies', color: '#22C55E' },
		{ icon: Tv, label: 'Series', color: '#F59E0B' },
		{ icon: Gamepad2, label: 'Games', color: '#F97316' },
		{ icon: Podcast, label: 'Podcasts', color: '#EF4444' }
	] as const;

	const comparisonRows = [
		{ feature: 'Media boards', free: '3 of 5', paid: 'All 5' },
		{ feature: 'Items per board', free: '20', paid: 'Unlimited' },
		{ feature: 'Drag & drop kanban', free: true, paid: true },
		{ feature: 'Auto-search & metadata', free: true, paid: true },
		{ feature: 'Dashboard & stats', free: true, paid: true },
		{ feature: 'Public profile & sharing', free: true, paid: true },
		{ feature: 'Notes on items', free: false, paid: true },
		{ feature: 'Custom lists', free: false, paid: 'Up to 5' },
		{ feature: 'Discover — For You recs', free: false, paid: true },
		{ feature: 'Year in Review (Wrapped)', free: false, paid: true }
	] as const;

	async function subscribe(slug: 'monthly' | 'yearly') {
		if (!page.data.user) {
			await goto(`/login?redirect=/subscribe`);
			return;
		}
		loading = slug;
		try {
			await authClient.checkout({ slug });
		} finally {
			loading = null;
		}
	}
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
	</div>

	<!-- Nav -->
	<nav class="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
		<a href="/" class="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
			<img src="/backlogbox-logo.svg" alt="" class="size-5" />
			BacklogBox
		</a>
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
	<div class="relative z-10 mx-auto max-w-3xl px-6 pt-12 pb-24 sm:pt-20">
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

		{#if trialExpired}
			<div class="mb-6 flex justify-center">
				<div
					class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
				>
					Your trial has ended — you're on the free plan
				</div>
			</div>
		{/if}

		<h1 class="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{#if trialExpired}
				Unlock the full experience.
			{:else}
				Free forever.
				<span class="subscribe-gradient bg-clip-text text-transparent">Upgrade for more.</span>
			{/if}
		</h1>

		<p
			class="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground sm:text-base"
		>
			{#if trialExpired}
				Your data is safe on the free plan. Upgrade to unlock all boards, unlimited items, and
				premium features.
			{:else if trialActive}
				You have {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left in your trial. After that, you'll
				keep free plan access.
			{:else}
				Track your media for free. Upgrade when you want the full experience.
			{/if}
		</p>

		<!-- Two-card pricing -->
		<div class="mt-10 grid gap-4 sm:grid-cols-2">
			<!-- Free plan card -->
			<div class="rounded-xl border border-border bg-card/40 p-6 text-left backdrop-blur-sm sm:p-7">
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Free</p>
				<div class="mt-2 flex items-baseline gap-1">
					<span class="text-3xl font-bold tracking-tight text-foreground">$0</span>
					<span class="text-sm text-muted-foreground">/forever</span>
				</div>
				<p class="mt-2 text-xs text-muted-foreground">3 boards, 20 items each</p>

				<ul class="mt-6 space-y-2.5">
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						3 media boards (your pick)
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						20 items per board
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Drag & drop kanban
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Auto-search & metadata
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Dashboard & stats
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Public profile & sharing
					</li>
				</ul>

				<Button class="mt-7 w-full" variant="outline" size="lg" href="/register">
					Get Started Free
				</Button>
			</div>

			<!-- Paid plan card -->
			<div
				class="relative rounded-xl border-2 border-primary/40 bg-card/60 p-6 text-left shadow-sm backdrop-blur-sm sm:p-7"
			>
				<div class="absolute -top-3 right-4">
					<span
						class="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground"
					>
						<Crown class="size-3" />
						Full Access
					</span>
				</div>

				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Pro</p>

				<!-- Billing toggle (inline) -->
				<div class="mt-2 flex items-baseline gap-2">
					<span class="text-3xl font-bold tracking-tight text-foreground">
						{plans[billing].price}
					</span>
					<span class="text-sm text-muted-foreground">{plans[billing].period}</span>
				</div>

				{#if billing === 'yearly'}
					<p class="mt-1 text-xs text-green-500">$5.75/mo — 3 months free</p>
				{/if}

				<!-- Billing toggle -->
				<div
					class="mt-3 inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5"
				>
					<button
						class="rounded-full px-3 py-1 text-[11px] font-medium transition-colors {billing ===
						'monthly'
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (billing = 'monthly')}
					>
						Monthly
					</button>
					<button
						class="rounded-full px-3 py-1 text-[11px] font-medium transition-colors {billing ===
						'yearly'
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (billing = 'yearly')}
					>
						Yearly
						{#if billing === 'yearly'}
							<span class="ml-1 text-[10px] font-semibold text-green-500">Save $27</span>
						{/if}
					</button>
				</div>

				<ul class="mt-5 space-y-2.5">
					<li class="flex items-start gap-2.5 text-sm font-medium text-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Everything in Free, plus:
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						All 5 media boards
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Unlimited items per board
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Notes on items
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Custom lists for anything
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Personalized recommendations
					</li>
					<li class="flex items-start gap-2.5 text-sm text-muted-foreground">
						<Check class="mt-0.5 size-3.5 shrink-0 text-green-500" />
						Year in Review (Wrapped)
					</li>
				</ul>

				<Button
					class="mt-7 w-full"
					size="lg"
					disabled={loading !== null}
					onclick={() => subscribe(billing)}
				>
					{#if loading}
						Redirecting...
					{:else if trialExpired}
						Upgrade to Pro
					{:else}
						Subscribe {billing === 'yearly' ? 'Yearly' : 'Monthly'}
					{/if}
				</Button>

				<p class="mt-2 text-center text-[11px] text-muted-foreground/60">
					Cancel anytime. Powered by Polar.
				</p>
			</div>
		</div>

		<!-- Comparison table -->
		<div class="mt-16">
			<h2 class="mb-6 text-center text-lg font-semibold text-foreground">Compare plans</h2>

			<div class="overflow-hidden rounded-xl border border-border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-muted/30">
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Feature</th>
							<th class="px-4 py-3 text-center font-medium text-muted-foreground">Free</th>
							<th class="px-4 py-3 text-center font-medium text-foreground">Pro</th>
						</tr>
					</thead>
					<tbody>
						{#each comparisonRows as row, i (row.feature)}
							<tr class={i < comparisonRows.length - 1 ? 'border-b border-border/60' : ''}>
								<td class="px-4 py-2.5 text-muted-foreground">{row.feature}</td>
								<td class="px-4 py-2.5 text-center">
									{#if typeof row.free === 'boolean'}
										{#if row.free}
											<Check class="mx-auto size-4 text-green-500" />
										{:else}
											<X class="mx-auto size-4 text-muted-foreground/40" />
										{/if}
									{:else}
										<span class="text-muted-foreground">{row.free}</span>
									{/if}
								</td>
								<td class="px-4 py-2.5 text-center">
									{#if typeof row.paid === 'boolean'}
										{#if row.paid}
											<Check class="mx-auto size-4 text-green-500" />
										{:else}
											<X class="mx-auto size-4 text-muted-foreground/40" />
										{/if}
									{:else}
										<span class="font-medium text-foreground">{row.paid}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<style>
	.subscribe-gradient {
		background-image: linear-gradient(135deg, #3b82f6, #22c55e, #f59e0b);
	}
</style>
