<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-br from-background via-background to-background text-foreground dark:from-[#080810] dark:via-[#0a0a16] dark:to-[#080810]"
>
	<!-- Ambient background blobs -->
	<div
		class="pointer-events-none fixed top-[-200px] right-[-100px] size-[600px] rounded-full opacity-[0.05] blur-[140px] dark:opacity-[0.04]"
		style="background-color: #3B82F6"
	></div>
	<div
		class="pointer-events-none fixed bottom-[-150px] left-[-100px] size-[500px] rounded-full opacity-[0.05] blur-[140px] dark:opacity-[0.04]"
		style="background-color: #22C55E"
	></div>

	<div class="relative w-full max-w-3xl flex-1 px-4 pb-12">
		{@render children()}
	</div>
</div>
