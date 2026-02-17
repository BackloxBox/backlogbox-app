<script lang="ts">
	import CustomCardBody from './CustomCardBody.svelte';
	import type { CustomListItemWithFields } from '$lib/server/db/custom-list-queries';

	type Props = {
		item: CustomListItemWithFields;
		onclick?: (item: CustomListItemWithFields) => void;
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
		<CustomCardBody {item} />
	</div>
{:else}
	<div class="rounded-lg border border-border bg-card p-2.5">
		<CustomCardBody {item} />
	</div>
{/if}
