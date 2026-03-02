<script lang="ts">
	import { goto } from '$app/navigation';
	import { MEDIA_TYPE_LABELS, MEDIA_TYPE_COLORS, type MediaType } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import { trackEvent } from '$lib/analytics';
	import { saveChosenBoards } from './choose-boards.remote';
	import { SvelteSet } from 'svelte/reactivity';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import Check from '@lucide/svelte/icons/check';
	import Lock from '@lucide/svelte/icons/lock';
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
		book: 'Your reading list',
		movie: 'Films to watch',
		series: 'TV shows to follow',
		game: 'Games to play',
		podcast: 'Podcasts to listen'
	};

	let { data } = $props();

	const maxBoards = $derived(data.maxActiveBoards);

	let selected = new SvelteSet<MediaType>();
	let submitting = $state(false);

	const canSelectMore = $derived(selected.size < maxBoards);
	const canSubmit = $derived(selected.size > 0 && selected.size <= maxBoards);

	function toggle(type: MediaType) {
		if (selected.has(type)) {
			selected.delete(type);
		} else if (canSelectMore) {
			selected.add(type);
		}
	}

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		try {
			await saveChosenBoards({ boards: [...selected] });
			trackEvent('free_boards_chosen', { boards: [...selected] });
			toast.success('Boards saved! Your other boards are read-only.');
			await goto('/dashboard', { invalidateAll: true });
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4">
	<div class="flex w-full max-w-xl flex-col items-center">
		<!-- Logo -->
		<div class="choose-fade flex items-center gap-2.5" style="animation-delay: 0ms">
			<img src="/backlogbox-logo.svg" alt="" class="size-9" />
			<span class="text-xl font-semibold tracking-tight">BacklogBox</span>
		</div>

		<h1
			class="choose-fade choose-gradient mt-6 text-center text-2xl font-bold tracking-tight sm:text-3xl"
			style="animation-delay: 80ms"
		>
			Choose your free boards
		</h1>
		<p
			class="choose-fade mt-3 max-w-md text-center text-sm text-muted-foreground sm:text-base"
			style="animation-delay: 160ms"
		>
			Your trial has ended. Pick up to {maxBoards} boards to keep managing for free. The rest become read-only
			&mdash; your data is safe.
		</p>

		<p
			class="choose-fade mt-2 text-center text-xs text-muted-foreground/70"
			style="animation-delay: 200ms"
		>
			{selected.size} / {maxBoards} selected
		</p>

		<div class="mt-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
			{#each data.interests as type, i (type)}
				{@const Icon = TYPE_ICONS[type]}
				{@const isSelected = selected.has(type)}
				{@const color = MEDIA_TYPE_COLORS[type]}
				{@const disabled = !isSelected && !canSelectMore}
				<button
					class="choose-card group relative flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 px-5 py-7 transition-all duration-200
						{isSelected
						? 'scale-[1.02] border-[var(--accent-color)]'
						: disabled
							? 'cursor-not-allowed border-border bg-card opacity-50'
							: 'border-border bg-card hover:border-muted-foreground/30'}"
					style:--accent-color={color}
					style:animation-delay="{240 + i * 60}ms"
					style:background={isSelected
						? `linear-gradient(135deg, color-mix(in oklch, ${color} 12%, transparent), color-mix(in oklch, ${color} 6%, transparent))`
						: undefined}
					style:box-shadow={isSelected
						? `0 4px 20px color-mix(in oklch, ${color} 15%, transparent)`
						: undefined}
					{disabled}
					onclick={() => toggle(type)}
				>
					{#if isSelected}
						<div
							class="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full"
							style:background-color={color}
						>
							<Check class="size-3 text-white" />
						</div>
					{:else if disabled}
						<div class="absolute top-2.5 right-2.5">
							<Lock class="size-3.5 text-muted-foreground/50" />
						</div>
					{/if}
					<span class="transition-colors" style:color={isSelected ? color : undefined}>
						<Icon
							class="size-10 {isSelected
								? ''
								: 'text-muted-foreground group-hover:text-foreground'} transition-colors"
						/>
					</span>
					<span class="text-sm font-semibold">{MEDIA_TYPE_LABELS[type].plural}</span>
					<span class="text-center text-[11px] leading-tight text-muted-foreground">
						{TYPE_DESCRIPTIONS[type]}
					</span>
				</button>
			{/each}
		</div>

		<div
			class="choose-fade mt-10 flex flex-col items-center gap-3"
			style="animation-delay: {240 + data.interests.length * 60 + 60}ms"
		>
			<Button
				size="lg"
				class="gap-2 px-8"
				disabled={!canSubmit || submitting}
				onclick={handleSubmit}
			>
				{#if submitting}
					<LoaderCircle class="size-4 animate-spin" />
				{/if}
				Continue with {selected.size} board{selected.size === 1 ? '' : 's'}
			</Button>
			<a href="/subscribe" class="text-sm text-muted-foreground transition hover:text-foreground">
				Upgrade for unlimited boards
			</a>
		</div>
	</div>
</div>

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

	.choose-fade {
		animation: fadeUp 0.6s ease-out both;
	}

	.choose-card {
		animation: fadeUp 0.5s ease-out both;
	}

	.choose-gradient {
		background-image: linear-gradient(135deg, #3b82f6 0%, #22c55e 50%, #f59e0b 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>
