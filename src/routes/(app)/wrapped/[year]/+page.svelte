<script lang="ts">
	import { browser } from '$app/environment';
	import { MEDIA_TYPES, MEDIA_TYPE_LABELS, MEDIA_TYPE_COLORS, type MediaType } from '$lib/types';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import MediaCover from '$lib/components/board/MediaCover.svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Star from '@lucide/svelte/icons/star';
	import Zap from '@lucide/svelte/icons/zap';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import type { Component } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const s = $derived(data.stats);
	const noMotion = $derived(prefersReducedMotion.current);

	const TYPE_ICONS: Record<MediaType, Component<{ class?: string }>> = {
		book: BookOpen,
		movie: Film,
		series: Tv,
		game: Gamepad2,
		podcast: Podcast
	};

	/** Top type by completed count */
	const topType = $derived.by(() => {
		let best: MediaType = 'movie';
		let max = 0;
		for (const t of MEDIA_TYPES) {
			if (s.completedByType[t] > max) {
				max = s.completedByType[t];
				best = t;
			}
		}
		return max > 0 ? best : null;
	});

	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function formatMonth(yyyymm: string): string {
		const [, m] = yyyymm.split('-');
		return MONTH_NAMES[parseInt(m, 10) - 1] ?? m;
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric'
		});
	}

	/** Active types with completions, sorted descending */
	const activeTypes = $derived(
		MEDIA_TYPES.filter((t) => s.completedByType[t] > 0).sort(
			(a, b) => s.completedByType[b] - s.completedByType[a]
		)
	);

	const maxTypeCount = $derived(Math.max(...MEDIA_TYPES.map((t) => s.completedByType[t]), 1));

	// ---------------------------------------------------------------------------
	// Animated counters (tweened from 0 to target)
	// ---------------------------------------------------------------------------

	// Capture motion preference at mount — Tween duration is set once, not reactive
	const tweenDuration = prefersReducedMotion.current ? 0 : 800;
	const heroCounter = new Tween(0, { duration: tweenDuration, easing: cubicOut });
	const hoursCounter = new Tween(0, { duration: tweenDuration, easing: cubicOut });
	const ratingCounter = new Tween(0, { duration: tweenDuration, easing: cubicOut });

	// Drive Tween targets from scroll-reveal state (card indices: 0=hero, 2=hours, 7=rating)
	$effect(() => {
		if (revealed.has(0)) heroCounter.set(s.totalCompleted);
	});
	$effect(() => {
		if (revealed.has(2)) hoursCounter.set(s.totalEstimatedHours);
	});
	$effect(() => {
		if (revealed.has(7) && s.averageRating !== null) ratingCounter.set(s.averageRating);
	});

	// ---------------------------------------------------------------------------
	// Scroll-triggered reveal via IntersectionObserver
	// ---------------------------------------------------------------------------

	/** Tracks which card indices have been revealed */
	let revealed = $state<Set<number>>(new Set());

	function observeReveal(node: HTMLElement, index: number) {
		if (!browser || noMotion) {
			revealed.add(index);
			revealed = new Set(revealed);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						revealed.add(index);
						revealed = new Set(revealed);
						observer.disconnect();
					}
				}
			},
			{ threshold: 0.15 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function cardStyle(index: number): string {
		if (noMotion || revealed.has(index)) return '';
		return `opacity: 0; transform: translateY(12px);`;
	}
</script>

<svelte:head>
	<title>Your {s.year} Wrapped | BacklogBox</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="mx-auto max-w-lg space-y-5 px-4 py-12 lg:py-16">
		<!-- Hero -->
		<div class="wrapped-card text-center" use:observeReveal={0} style={cardStyle(0)}>
			<p class="mb-2 text-sm font-bold tracking-[0.3em] text-muted-foreground uppercase">
				Your {s.year} Wrapped
			</p>
			<h1
				class="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl"
			>
				{Math.round(heroCounter.current)}
			</h1>
			<p class="mt-2 text-lg text-muted-foreground">
				{s.totalCompleted === 1 ? 'item' : 'items'} completed
			</p>
		</div>

		{#if s.totalCompleted === 0}
			<div
				class="wrapped-card rounded-2xl border border-border bg-card p-8 text-center"
				use:observeReveal={1}
				style={cardStyle(1)}
			>
				<p class="text-lg text-muted-foreground">No completed items this year yet. Keep going!</p>
			</div>
		{:else}
			<!-- Type breakdown -->
			<div
				class="wrapped-card space-y-4 rounded-2xl border border-border bg-card p-6"
				use:observeReveal={1}
				style={cardStyle(1)}
			>
				<h2 class="text-sm font-bold tracking-wider text-muted-foreground/60 uppercase">
					Your year in media
				</h2>
				<div class="space-y-3">
					{#each activeTypes as t (t)}
						{@const Icon = TYPE_ICONS[t]}
						{@const pct = Math.round((s.completedByType[t] / maxTypeCount) * 100)}
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span style:color={MEDIA_TYPE_COLORS[t]}>
										<Icon class="size-4" />
									</span>
									<span class="text-sm font-medium text-foreground/80">
										{MEDIA_TYPE_LABELS[t].plural}
									</span>
								</div>
								<span class="text-2xl font-black tabular-nums" style:color={MEDIA_TYPE_COLORS[t]}>
									{s.completedByType[t]}
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all duration-1000 ease-out"
									style:width={revealed.has(1) ? `${pct}%` : '0%'}
									style:background={MEDIA_TYPE_COLORS[t]}
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Estimated hours -->
			{#if s.totalEstimatedHours > 0}
				<div
					class="wrapped-card rounded-2xl border border-border bg-card p-6 text-center"
					use:observeReveal={2}
					style={cardStyle(2)}
				>
					<div
						class="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-purple-500/10"
					>
						<ClockIcon class="size-6 text-purple-400" />
					</div>
					<p class="text-4xl font-black text-foreground tabular-nums">
						~{Math.round(hoursCounter.current)}
					</p>
					<p class="mt-1 text-sm text-muted-foreground">estimated hours spent</p>
				</div>
			{/if}

			<!-- Top genre -->
			{#if s.topGenre}
				<div
					class="wrapped-card rounded-2xl border border-border bg-card p-6 text-center"
					use:observeReveal={3}
					style={cardStyle(3)}
				>
					<div
						class="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10"
					>
						<FlameIcon class="size-6 text-emerald-400" />
					</div>
					<p class="text-sm text-muted-foreground">Top genre</p>
					<p class="mt-1 text-3xl font-black text-foreground">{s.topGenre.genre}</p>
					<p class="mt-1 text-sm text-muted-foreground/60">
						{s.topGenre.count}
						{s.topGenre.count === 1 ? 'item' : 'items'}
					</p>
				</div>
			{/if}

			<!-- Highest rated -->
			{#if s.highestRated}
				<div
					class="wrapped-card overflow-hidden rounded-2xl border border-border bg-card"
					use:observeReveal={4}
					style={cardStyle(4)}
				>
					<div class="flex items-center gap-4 p-6">
						<div class="size-20 shrink-0 overflow-hidden rounded-xl">
							<MediaCover title={s.highestRated.title} coverUrl={s.highestRated.coverUrl} />
						</div>
						<div>
							<div class="flex items-center gap-1.5 text-amber-400">
								<Trophy class="size-4" />
								<span class="text-xs font-bold tracking-wider uppercase"> Highest rated </span>
							</div>
							<p class="mt-1 text-lg font-bold text-foreground">{s.highestRated.title}</p>
							<div class="mt-1 flex items-center gap-1">
								{#each Array(5) as _, i (i)}
									<Star
										class="size-4 {i < s.highestRated.rating
											? 'fill-amber-400 text-amber-400'
											: 'text-muted-foreground/20'}"
									/>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Fastest completion -->
			{#if s.fastestCompletion}
				<div
					class="wrapped-card overflow-hidden rounded-2xl border border-border bg-card"
					use:observeReveal={5}
					style={cardStyle(5)}
				>
					<div class="flex items-center gap-4 p-6">
						<div class="size-20 shrink-0 overflow-hidden rounded-xl">
							<MediaCover
								title={s.fastestCompletion.title}
								coverUrl={s.fastestCompletion.coverUrl}
							/>
						</div>
						<div>
							<div class="flex items-center gap-1.5 text-orange-400">
								<Zap class="size-4" />
								<span class="text-xs font-bold tracking-wider uppercase"> Speed run </span>
							</div>
							<p class="mt-1 text-lg font-bold text-foreground">
								{s.fastestCompletion.title}
							</p>
							<p class="mt-0.5 text-sm text-muted-foreground">
								Finished in {s.fastestCompletion.days === 0
									? 'less than a day'
									: `${s.fastestCompletion.days} day${s.fastestCompletion.days === 1 ? '' : 's'}`}
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Most active month -->
			{#if s.mostActiveMonth}
				<div
					class="wrapped-card rounded-2xl border border-border bg-card p-6 text-center"
					use:observeReveal={6}
					style={cardStyle(6)}
				>
					<div
						class="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-blue-500/10"
					>
						<CalendarIcon class="size-6 text-blue-400" />
					</div>
					<p class="text-sm text-muted-foreground">Most active month</p>
					<p class="mt-1 text-3xl font-black text-foreground">
						{formatMonth(s.mostActiveMonth.month)}
					</p>
					<p class="mt-1 text-sm text-muted-foreground/60">
						{s.mostActiveMonth.count} completed
					</p>
				</div>
			{/if}

			<!-- Average rating -->
			{#if s.averageRating !== null}
				<div
					class="wrapped-card rounded-2xl border border-border bg-card p-6 text-center"
					use:observeReveal={7}
					style={cardStyle(7)}
				>
					<Star class="mx-auto mb-2 size-8 fill-amber-400 text-amber-400" />
					<p class="text-sm text-muted-foreground">Average rating</p>
					<p class="mt-1 text-4xl font-black text-foreground tabular-nums">
						{ratingCounter.current.toFixed(1)}
					</p>
					<p class="mt-1 text-sm text-muted-foreground/60">out of 5</p>
				</div>
			{/if}

			<!-- First & last -->
			{#if s.firstCompleted && s.lastCompleted && s.totalCompleted > 1}
				<div
					class="wrapped-card space-y-4 rounded-2xl border border-border bg-card p-6"
					use:observeReveal={8}
					style={cardStyle(8)}
				>
					<h2 class="text-sm font-bold tracking-wider text-muted-foreground/60 uppercase">
						Bookends
					</h2>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<div class="size-12 shrink-0 overflow-hidden rounded-lg">
								<MediaCover title={s.firstCompleted.title} coverUrl={s.firstCompleted.coverUrl} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-muted-foreground/60">First completed</p>
								<p class="truncate font-medium text-foreground">
									{s.firstCompleted.title}
								</p>
								<p class="text-xs text-muted-foreground/60">
									{formatDate(s.firstCompleted.date)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-12 shrink-0 overflow-hidden rounded-lg">
								<MediaCover title={s.lastCompleted.title} coverUrl={s.lastCompleted.coverUrl} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-muted-foreground/60">Last completed</p>
								<p class="truncate font-medium text-foreground">
									{s.lastCompleted.title}
								</p>
								<p class="text-xs text-muted-foreground/60">
									{formatDate(s.lastCompleted.date)}
								</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Top type callout -->
			{#if topType}
				{@const Icon = TYPE_ICONS[topType]}
				<div
					class="wrapped-card rounded-2xl border border-border bg-card p-8 text-center"
					use:observeReveal={9}
					style={cardStyle(9)}
				>
					<div
						class="mx-auto mb-3 flex size-16 items-center justify-center rounded-full"
						style:background="{MEDIA_TYPE_COLORS[topType]}20"
						style:color={MEDIA_TYPE_COLORS[topType]}
					>
						<Icon class="size-8" />
					</div>
					<p class="text-sm text-muted-foreground">
						You were a {MEDIA_TYPE_LABELS[topType].singular.toLowerCase()} person this year
					</p>
					<p class="mt-1 text-2xl font-black text-foreground">
						{s.completedByType[topType]}
						{MEDIA_TYPE_LABELS[topType].plural.toLowerCase()} completed
					</p>
				</div>
			{/if}
		{/if}

		<!-- Footer -->
		<div class="pt-6 text-center">
			<a
				href="/dashboard"
				class="text-sm text-muted-foreground/50 transition hover:text-muted-foreground"
			>
				Back to dashboard
			</a>
		</div>
	</div>
</div>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.wrapped-card {
			transition:
				opacity 250ms ease-out,
				transform 250ms ease-out;
		}
	}
</style>
