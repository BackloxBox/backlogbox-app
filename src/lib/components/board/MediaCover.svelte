<script lang="ts">
	import { cn } from '$lib/utils';

	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		title: string;
		coverUrl: string | null;
		size?: Size;
		class?: string;
	};

	let { title, coverUrl, size = 'md', class: className }: Props = $props();

	/** Track the URL that failed so we auto-reset when coverUrl changes */
	let failedUrl = $state<string | null>(null);
	/** Track the URL that finished loading — auto-resets when coverUrl changes */
	let loadedUrl = $state<string | null>(null);

	/** Deterministic hue from title string for consistent placeholder colors */
	function titleToHue(t: string): number {
		let hash = 0;
		for (let i = 0; i < t.length; i++) {
			hash = t.charCodeAt(i) + ((hash << 5) - hash);
		}
		return ((hash % 360) + 360) % 360;
	}

	const initial = $derived(title.trim().charAt(0).toUpperCase() || '?');
	const hue = $derived(titleToHue(title));
	const showImage = $derived(coverUrl && coverUrl !== failedUrl);
	const imageLoaded = $derived(coverUrl !== null && coverUrl === loadedUrl);

	const SIZE_CLASSES: Record<Size, string> = {
		sm: 'h-12 w-9 text-xs rounded-sm',
		md: 'h-18 w-12 text-sm rounded',
		lg: 'h-36 w-24 text-2xl rounded-md'
	};
</script>

{#if showImage}
	<div class={cn('relative shrink-0', SIZE_CLASSES[size], className)}>
		<img
			src={coverUrl}
			alt={title}
			loading="lazy"
			onload={() => (loadedUrl = coverUrl)}
			onerror={() => (failedUrl = coverUrl)}
			class={cn(
				'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
				SIZE_CLASSES[size],
				imageLoaded ? 'opacity-100' : 'opacity-0'
			)}
		/>
		{#if !imageLoaded}
			<div class={cn('absolute inset-0 animate-pulse bg-muted', SIZE_CLASSES[size])}></div>
		{/if}
	</div>
{:else}
	<div
		class={cn(
			'flex shrink-0 items-center justify-center font-semibold text-white/80 select-none',
			SIZE_CLASSES[size],
			className
		)}
		style="background-color: hsl({hue} 40% 30%)"
	>
		{initial}
	</div>
{/if}
