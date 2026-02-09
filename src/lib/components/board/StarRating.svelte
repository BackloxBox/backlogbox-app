<script lang="ts">
	type Props = {
		value: number | null;
		onRate: (rating: number | null) => void;
		readonly?: boolean;
	};

	let { value, onRate, readonly = false }: Props = $props();

	let hovered = $state<number | null>(null);

	function handleClick(star: number) {
		if (readonly) return;
		// Clicking the same star clears the rating
		onRate(value === star ? null : star);
	}
</script>

<div class="flex gap-0.5" role="radiogroup" aria-label="Rating">
	{#each [1, 2, 3, 4, 5] as star}
		{@const filled = (hovered ?? value ?? 0) >= star}
		<button
			type="button"
			class="text-lg transition {readonly ? 'cursor-default' : 'cursor-pointer'}
			{filled ? 'text-amber-400' : 'text-muted-foreground/50'}"
			onclick={() => handleClick(star)}
			onmouseenter={() => {
				if (!readonly) hovered = star;
			}}
			onmouseleave={() => {
				if (!readonly) hovered = null;
			}}
			aria-label="{star} star{star !== 1 ? 's' : ''}"
			disabled={readonly}
		>
			{filled ? '\u2605' : '\u2606'}
		</button>
	{/each}
</div>
