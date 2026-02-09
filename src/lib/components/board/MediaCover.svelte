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

	const SIZE_CLASSES: Record<Size, string> = {
		sm: 'h-12 w-9 text-xs rounded-sm',
		md: 'h-14 w-10 text-sm rounded-sm',
		lg: 'h-36 w-24 text-2xl rounded-md'
	};
</script>

{#if coverUrl}
	<img src={coverUrl} alt="" class={cn('shrink-0 object-cover', SIZE_CLASSES[size], className)} />
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
