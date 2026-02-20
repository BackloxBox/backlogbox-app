<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
</script>

<svelte:head>
	<title>{page.status} — BacklogBox</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6 text-center">
		<div class="flex justify-center">
			<LayoutDashboard class="size-8 text-muted-foreground" />
		</div>

		<div>
			<p class="text-5xl font-bold tracking-tight text-foreground">{page.status}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{page.error?.message ?? 'Something went wrong'}
			</p>
		</div>

		{#if page.status >= 500 && page.error?.errorId}
			<p class="text-xs text-muted-foreground/60">
				Error ID: <code class="font-mono">{page.error.errorId}</code>
			</p>
		{/if}

		<div class="flex justify-center gap-3">
			<Button variant="outline" href="/login">Go to login</Button>
			<Button href="/dashboard">Home</Button>
		</div>
	</div>
</div>
