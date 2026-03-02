<script lang="ts">
	import Lock from '@lucide/svelte/icons/lock';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	/**
	 * Inline upgrade CTA banner used across gated features on the free tier.
	 * Variants:
	 * - `inline` (default): subtle border box, fits within content flow
	 * - `overlay`: centered overlay with semi-transparent backdrop
	 */
	interface Props {
		message?: string;
		variant?: 'inline' | 'overlay';
	}

	let { message = 'Upgrade to unlock this feature', variant = 'inline' }: Props = $props();
</script>

{#if variant === 'overlay'}
	<div
		class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/60 px-6 py-10 text-center"
	>
		<Lock class="size-5 text-muted-foreground" />
		<p class="text-sm text-muted-foreground">{message}</p>
		<a
			href="/subscribe"
			class="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
		>
			Upgrade
			<ArrowRight class="size-3.5" />
		</a>
	</div>
{:else}
	<div
		class="flex items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10"
	>
		<Lock class="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
		<p class="flex-1 text-sm text-amber-700 dark:text-amber-300">{message}</p>
		<a
			href="/subscribe"
			class="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
		>
			Upgrade
			<ArrowRight class="size-3" />
		</a>
	</div>
{/if}
