<script lang="ts">
	import CardBody from './CardBody.svelte';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';

	type Props = {
		item: MediaItemWithMeta;
		onclick?: (item: MediaItemWithMeta) => void;
	};

	let { item, onclick }: Props = $props();
</script>

{#if onclick}
	<div
		role="button"
		tabindex="0"
		class="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition hover:bg-accent"
		onclick={() => onclick(item)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onclick(item);
		}}
	>
		<CardBody {item} />
	</div>
{:else}
	<div class="rounded-lg border border-border bg-card p-2.5">
		<CardBody {item} />
	</div>
{/if}
