<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		MEDIA_TYPES,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		mediaTypeToSlug,
		type MediaType,
		type MediaTypeSlug
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { trackEvent } from '$lib/analytics';
	import { toast } from 'svelte-sonner';
	import { getOnboardingTrending, finishOnboarding, skipOnboarding } from './onboarding.remote';
	import type { SearchResult } from '$lib/server/search';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import Check from '@lucide/svelte/icons/check';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { Component } from 'svelte';

	const TYPE_ICONS: Record<MediaType, Component<{ class?: string }>> = {
		book: BookOpen,
		movie: Film,
		series: Tv,
		game: Gamepad2,
		podcast: Podcast
	};

	const TYPE_DESCRIPTIONS: Record<MediaType, string> = {
		book: 'Track your reading list',
		movie: 'Log films to watch',
		series: 'Follow TV shows',
		game: 'Manage your backlog',
		podcast: 'Queue up podcasts'
	};

	// ---------------------------------------------------------------------------
	// State
	// ---------------------------------------------------------------------------

	const TOTAL_STEPS = 2;
	let currentStep = $state(1);

	// Step 1: interest selection
	let selectedInterests = $state(new Set<MediaType>());

	// Step 2: item selection
	let trendingByType = $state<Record<string, SearchResult[]>>({});
	let selectedItems = $state(new Set<string>()); // "type:externalId" keys
	let loadingTrending = $state(false);

	// Submission
	let submitting = $state(false);

	const selectedCount = $derived(selectedItems.size);

	trackEvent('onboarding_started');

	// ---------------------------------------------------------------------------
	// Step 1 → Step 2 transition
	// ---------------------------------------------------------------------------

	function goToItems() {
		trackEvent('onboarding_interests_selected', { interests: [...selectedInterests] });
		currentStep = 2;
		loadingTrending = true;
	}

	// Fetch trending reactively when we move to step 2
	const trendingQuery = $derived(
		currentStep === 2 && selectedInterests.size > 0
			? getOnboardingTrending([...selectedInterests])
			: null
	);

	$effect(() => {
		const current = trendingQuery?.current;
		if (current) {
			trendingByType = current;
			loadingTrending = false;
		}
	});

	// ---------------------------------------------------------------------------
	// Item selection helpers
	// ---------------------------------------------------------------------------

	function itemKey(type: MediaType, result: SearchResult): string {
		return `${type}:${result.externalId}`;
	}

	function toggleItem(type: MediaType, result: SearchResult) {
		const key = itemKey(type, result);
		const next = new Set(selectedItems);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		selectedItems = next;
	}

	function isSelected(type: MediaType, result: SearchResult): boolean {
		return selectedItems.has(itemKey(type, result));
	}

	// ---------------------------------------------------------------------------
	// Finish / Skip
	// ---------------------------------------------------------------------------

	async function handleFinish() {
		submitting = true;
		const interests = [...selectedInterests];

		// Build items payload from selected items
		const items: Array<{
			slug: MediaTypeSlug;
			title: string;
			coverUrl: string | null | undefined;
			releaseYear: number | null | undefined;
			meta: Record<string, unknown>;
		}> = [];

		for (const type of interests) {
			const trending = trendingByType[type] ?? [];
			for (const result of trending) {
				if (selectedItems.has(itemKey(type, result))) {
					items.push({
						slug: mediaTypeToSlug(type),
						title: result.title,
						coverUrl: result.coverUrl,
						releaseYear: result.releaseYear,
						meta: result.meta
					});
				}
			}
		}

		try {
			const result = await finishOnboarding({ interests, items });
			trackEvent('onboarding_completed', {
				itemCount: result.addedCount,
				interests,
				skipped: false
			});

			if (result.addedCount > 0) {
				toast.success(
					`Added ${result.addedCount} item${result.addedCount === 1 ? '' : 's'} to your backlog`
				);
			}

			await invalidateAll();
			goto('/dashboard');
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			submitting = false;
		}
	}

	async function handleSkip() {
		submitting = true;
		try {
			await skipOnboarding();
			trackEvent('onboarding_skipped', { step: currentStep });
			await invalidateAll();
			goto('/dashboard');
		} catch {
			toast.error('Something went wrong');
		} finally {
			submitting = false;
		}
	}

	// ---------------------------------------------------------------------------
	// Cover placeholder
	// ---------------------------------------------------------------------------

	function titleToHue(t: string): number {
		let hash = 0;
		for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
		return ((hash % 360) + 360) % 360;
	}

	function subtitle(result: SearchResult): string {
		const meta = result.meta as Record<string, unknown>;
		return (
			(meta.author as string) ??
			(meta.director as string) ??
			(meta.developer as string) ??
			(meta.host as string) ??
			(result.releaseYear ? String(result.releaseYear) : '')
		);
	}
</script>

{#if currentStep === 1}
	<!-- ===================================================================== -->
	<!-- STEP 1: Interest Selection                                            -->
	<!-- ===================================================================== -->
	<div class="flex min-h-screen flex-col items-center justify-center">
		<div class="flex flex-col items-center">
			<!-- Logo -->
			<div class="onboarding-fade flex items-center gap-2.5" style="animation-delay: 0ms">
				<img src="/backlogbox-logo.svg" alt="" class="size-9" />
				<span class="text-xl font-semibold tracking-tight">BacklogBox</span>
			</div>

			<h1
				class="onboarding-fade onboarding-gradient mt-6 text-center text-3xl font-bold tracking-tight sm:text-4xl"
				style="animation-delay: 80ms"
			>
				What do you want to track?
			</h1>
			<p
				class="onboarding-fade mt-3 text-center text-sm text-muted-foreground sm:text-base"
				style="animation-delay: 160ms"
			>
				Pick at least one. You can always change this later in settings.
			</p>

			<!-- Step indicator (above cards) -->
			<div
				class="onboarding-fade mt-10 mb-4 flex items-center justify-center"
				style="animation-delay: 200ms"
			>
				<span class="text-xs font-medium text-muted-foreground/70 tabular-nums">
					Step {currentStep} of {TOTAL_STEPS}
				</span>
			</div>

			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
				{#each MEDIA_TYPES as type, i (type)}
					{@const Icon = TYPE_ICONS[type]}
					{@const selected = selectedInterests.has(type)}
					{@const color = MEDIA_TYPE_COLORS[type]}
					<button
						data-testid="interest-{type}"
						class="onboarding-card group relative flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 px-5 py-7 transition-all duration-200
							{selected
							? 'scale-[1.02] border-[var(--accent-color)]'
							: 'border-border bg-card hover:border-muted-foreground/30'}"
						style:--accent-color={color}
						style:animation-delay="{240 + i * 60}ms"
						style:background={selected
							? `linear-gradient(135deg, color-mix(in oklch, ${color} 12%, transparent), color-mix(in oklch, ${color} 6%, transparent))`
							: undefined}
						style:box-shadow={selected
							? `0 4px 20px color-mix(in oklch, ${color} 15%, transparent)`
							: undefined}
						onclick={() => {
							const next = new Set(selectedInterests);
							if (next.has(type)) next.delete(type);
							else next.add(type);
							selectedInterests = next;
						}}
					>
						{#if selected}
							<div
								class="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full"
								style:background-color={color}
							>
								<Check class="size-3 text-white" />
							</div>
						{/if}
						<span class="transition-colors" style:color={selected ? color : undefined}>
							<Icon
								class="size-10 {selected
									? ''
									: 'text-muted-foreground group-hover:text-foreground'} transition-colors"
							/>
						</span>
						<span class="text-sm font-semibold">{MEDIA_TYPE_LABELS[type].plural}</span>
						<span class="text-center text-[11px] leading-tight text-muted-foreground"
							>{TYPE_DESCRIPTIONS[type]}</span
						>
					</button>
				{/each}
			</div>

			<div
				class="onboarding-fade mt-12 flex flex-col items-center gap-3"
				style="animation-delay: {240 + MEDIA_TYPES.length * 60 + 60}ms"
			>
				<Button
					size="lg"
					class="gap-2 px-8"
					disabled={selectedInterests.size === 0}
					onclick={goToItems}
				>
					Continue
					<ArrowRight class="size-4" />
				</Button>
				<button
					class="text-sm text-muted-foreground transition hover:text-foreground"
					onclick={handleSkip}
					disabled={submitting}
				>
					Skip for now
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- ===================================================================== -->
	<!-- STEP 2: Seed Your Backlog                                             -->
	<!-- ===================================================================== -->
	<div class="flex min-h-screen w-full flex-col justify-center py-6">
		<div class="onboarding-fade text-center" style="animation-delay: 0ms">
			<h1 class="onboarding-gradient text-2xl font-bold tracking-tight sm:text-3xl">
				Add some items to get started
			</h1>
			<p class="mt-2 text-sm text-muted-foreground sm:text-base">
				Tap to select items for your backlog. We'll add them for you.
			</p>
		</div>

		{#if loadingTrending}
			<div class="flex items-center justify-center py-20">
				<LoaderCircle class="size-8 animate-spin text-muted-foreground" />
			</div>
		{:else}
			<div class="mt-8 space-y-10">
				{#each [...selectedInterests] as type, sectionIdx (type)}
					{@const Icon = TYPE_ICONS[type]}
					{@const color = MEDIA_TYPE_COLORS[type]}
					{@const items = trendingByType[type] ?? []}

					{#if items.length > 0}
						<section class="onboarding-fade" style="animation-delay: {100 + sectionIdx * 120}ms">
							<div class="mb-4 flex items-center gap-2">
								<span style:color>
									<Icon class="size-5" />
								</span>
								<h2 class="text-lg font-semibold" style:color>
									Popular {MEDIA_TYPE_LABELS[type].plural}
								</h2>
							</div>

							<div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
								{#each items as result (result.externalId)}
									{@const selected = isSelected(type, result)}
									<button
										class="group cursor-pointer space-y-1.5 text-left"
										onclick={() => toggleItem(type, result)}
									>
										<div
											class="relative aspect-[2/3] overflow-hidden rounded-md ring-2 transition-all
												{selected
												? 'shadow-md ring-[var(--accent-color)]'
												: 'ring-transparent hover:ring-muted-foreground/30'}"
											style:--accent-color={color}
										>
											{#if result.coverUrl}
												<img
													src={result.coverUrl}
													alt={result.title}
													loading="lazy"
													class="h-full w-full object-cover transition-opacity
														{selected ? 'opacity-80' : ''}"
												/>
											{:else}
												<div
													class="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80 select-none"
													style:background-color="hsl({titleToHue(result.title)} 40% 30%)"
												>
													{result.title.trim().charAt(0).toUpperCase()}
												</div>
											{/if}

											<!-- Selected overlay -->
											{#if selected}
												<div class="absolute inset-0 flex items-center justify-center bg-black/30">
													<div
														class="flex size-8 items-center justify-center rounded-full"
														style:background-color={color}
													>
														<Check class="size-5 text-white" />
													</div>
												</div>
											{/if}
										</div>

										<p class="truncate text-xs font-medium">{result.title}</p>
										<p class="truncate text-[11px] text-muted-foreground">
											{subtitle(result)}
										</p>
									</button>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			</div>
		{/if}

		<div
			class="sticky bottom-0 mt-8 flex flex-col items-center gap-3 border-t border-border bg-background/80 py-4 backdrop-blur-sm"
		>
			<Button size="lg" class="gap-2 px-8" disabled={submitting} onclick={handleFinish}>
				{#if submitting}
					<LoaderCircle class="size-4 animate-spin" />
				{/if}
				{#if selectedCount > 0}
					Finish ({selectedCount} item{selectedCount === 1 ? '' : 's'})
				{:else}
					Finish without adding
				{/if}
			</Button>
			<button
				class="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
				onclick={() => {
					currentStep = 1;
					selectedItems = new Set();
				}}
				disabled={submitting}
			>
				<ArrowLeft class="size-3.5" />
				Back to interests
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.onboarding-fade {
		animation: fadeUp 0.6s ease-out both;
	}

	.onboarding-card {
		animation: fadeUp 0.5s ease-out both;
	}

	.onboarding-gradient {
		background-image: linear-gradient(135deg, #3b82f6 0%, #22c55e 50%, #f59e0b 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>
