<script lang="ts">
	import { MEDIA_TYPES, MEDIA_TYPE_LABELS, MEDIA_TYPE_COLORS, type MediaType } from '$lib/types';
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
</script>

<svelte:head>
	<title>Your {s.year} Wrapped | BacklogBox</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23]">
	<div class="mx-auto max-w-lg space-y-6 px-4 py-12 lg:py-16">
		<!-- Hero -->
		<div class="text-center">
			<p class="mb-2 text-sm font-bold tracking-[0.3em] uppercase" style:color="#8B5CF6">
				Your {s.year} Wrapped
			</p>
			<h1
				class="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl"
			>
				{s.totalCompleted}
			</h1>
			<p class="mt-2 text-lg text-white/60">
				{s.totalCompleted === 1 ? 'item' : 'items'} completed
			</p>
		</div>

		{#if s.totalCompleted === 0}
			<div class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
				<p class="text-lg text-white/50">No completed items this year yet. Keep going!</p>
			</div>
		{:else}
			<!-- Type breakdown -->
			<div class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
				<h2 class="text-sm font-bold tracking-wider text-white/40 uppercase">Your year in media</h2>
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
									<span class="text-sm font-medium text-white/80">
										{MEDIA_TYPE_LABELS[t].plural}
									</span>
								</div>
								<span class="text-2xl font-black tabular-nums" style:color={MEDIA_TYPE_COLORS[t]}>
									{s.completedByType[t]}
								</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-white/5">
								<div
									class="h-full rounded-full transition-all duration-1000 ease-out"
									style:width="{pct}%"
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
					class="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-6 text-center backdrop-blur-sm"
				>
					<ClockIcon class="mx-auto mb-2 size-8 text-purple-400" />
					<p class="text-4xl font-black text-white tabular-nums">
						~{s.totalEstimatedHours}
					</p>
					<p class="mt-1 text-sm text-white/50">estimated hours spent</p>
				</div>
			{/if}

			<!-- Top genre -->
			{#if s.topGenre}
				<div
					class="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-6 text-center backdrop-blur-sm"
				>
					<FlameIcon class="mx-auto mb-2 size-8 text-emerald-400" />
					<p class="text-sm text-white/50">Top genre</p>
					<p class="mt-1 text-3xl font-black text-white">{s.topGenre.genre}</p>
					<p class="mt-1 text-sm text-white/40">
						{s.topGenre.count}
						{s.topGenre.count === 1 ? 'item' : 'items'}
					</p>
				</div>
			{/if}

			<!-- Highest rated -->
			{#if s.highestRated}
				<div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
					<div class="flex items-center gap-4 p-6">
						<div class="size-20 shrink-0 overflow-hidden rounded-xl">
							<MediaCover title={s.highestRated.title} coverUrl={s.highestRated.coverUrl} />
						</div>
						<div>
							<div class="flex items-center gap-1.5 text-amber-400">
								<Trophy class="size-4" />
								<span class="text-xs font-bold tracking-wider uppercase"> Highest rated </span>
							</div>
							<p class="mt-1 text-lg font-bold text-white">{s.highestRated.title}</p>
							<div class="mt-1 flex items-center gap-1">
								{#each Array(5) as _, i (i)}
									<Star
										class="size-4 {i < s.highestRated.rating
											? 'fill-amber-400 text-amber-400'
											: 'text-white/20'}"
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
					class="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm"
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
							<p class="mt-1 text-lg font-bold text-white">
								{s.fastestCompletion.title}
							</p>
							<p class="mt-0.5 text-sm text-white/50">
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
					class="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 text-center backdrop-blur-sm"
				>
					<CalendarIcon class="mx-auto mb-2 size-8 text-blue-400" />
					<p class="text-sm text-white/50">Most active month</p>
					<p class="mt-1 text-3xl font-black text-white">
						{formatMonth(s.mostActiveMonth.month)}
					</p>
					<p class="mt-1 text-sm text-white/40">
						{s.mostActiveMonth.count} completed
					</p>
				</div>
			{/if}

			<!-- Average rating -->
			{#if s.averageRating !== null}
				<div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
					<Star class="mx-auto mb-2 size-8 fill-amber-400 text-amber-400" />
					<p class="text-sm text-white/50">Average rating</p>
					<p class="mt-1 text-4xl font-black text-white tabular-nums">
						{s.averageRating}
					</p>
					<p class="mt-1 text-sm text-white/40">out of 5</p>
				</div>
			{/if}

			<!-- First & last -->
			{#if s.firstCompleted && s.lastCompleted && s.totalCompleted > 1}
				<div class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
					<h2 class="text-sm font-bold tracking-wider text-white/40 uppercase">Bookends</h2>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<div class="size-12 shrink-0 overflow-hidden rounded-lg">
								<MediaCover title={s.firstCompleted.title} coverUrl={s.firstCompleted.coverUrl} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-white/40">First completed</p>
								<p class="truncate font-medium text-white">
									{s.firstCompleted.title}
								</p>
								<p class="text-xs text-white/40">
									{formatDate(s.firstCompleted.date)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-12 shrink-0 overflow-hidden rounded-lg">
								<MediaCover title={s.lastCompleted.title} coverUrl={s.lastCompleted.coverUrl} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-white/40">Last completed</p>
								<p class="truncate font-medium text-white">
									{s.lastCompleted.title}
								</p>
								<p class="text-xs text-white/40">
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
					class="rounded-2xl border border-white/10 p-8 text-center backdrop-blur-sm"
					style:background="linear-gradient(135deg, {MEDIA_TYPE_COLORS[topType]}15, {MEDIA_TYPE_COLORS[
						topType
					]}05)"
				>
					<div
						class="mx-auto mb-3 flex size-16 items-center justify-center rounded-full"
						style:background="{MEDIA_TYPE_COLORS[topType]}20"
						style:color={MEDIA_TYPE_COLORS[topType]}
					>
						<Icon class="size-8" />
					</div>
					<p class="text-sm text-white/50">
						You were a {MEDIA_TYPE_LABELS[topType].singular.toLowerCase()} person this year
					</p>
					<p class="mt-1 text-2xl font-black text-white">
						{s.completedByType[topType]}
						{MEDIA_TYPE_LABELS[topType].plural.toLowerCase()} completed
					</p>
				</div>
			{/if}
		{/if}

		<!-- Footer -->
		<div class="pt-6 text-center">
			<a href="/dashboard" class="text-sm text-white/30 transition hover:text-white/60">
				Back to dashboard
			</a>
		</div>
	</div>
</div>
