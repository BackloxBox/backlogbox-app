<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
</script>

<div class="flex h-full flex-col items-center justify-center gap-4 px-4">
	<TriangleAlert class="size-10 text-muted-foreground" />

	<div class="text-center">
		<p class="text-4xl font-bold tracking-tight text-foreground">{page.status}</p>
		<p class="mt-1 text-sm text-muted-foreground">
			{page.error?.message ?? 'Something went wrong'}
		</p>
	</div>

	{#if page.status >= 500 && page.error?.errorId}
		<p class="text-xs text-muted-foreground/60">
			Error ID: <code class="font-mono">{page.error.errorId}</code>
		</p>
	{/if}

	<div class="flex gap-3">
		<Button variant="outline" onclick={() => history.back()}>Go back</Button>
		<Button href="/books">Home</Button>
	</div>
</div>
