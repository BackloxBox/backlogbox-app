<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Check from '@lucide/svelte/icons/check';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
	<!-- Background decoration -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #22C55E"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.05]"
			style="background: #3B82F6"
		></div>
	</div>

	<div
		class="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
	>
		<div
			class="mb-6 flex size-16 items-center justify-center rounded-full border-2 border-green-500/20 bg-green-500/10"
		>
			<Check class="size-8 text-green-500" />
		</div>

		<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			Welcome to
			<span class="success-gradient bg-clip-text text-transparent">BacklogBox!</span>
		</h1>

		<p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
			Your subscription is active. Time to organize your media backlog.
		</p>

		<Button size="lg" href="/dashboard" class="mt-8 gap-2">
			Go to Dashboard
			<ArrowRight class="size-4" />
		</Button>
	</div>
</div>

<style>
	.success-gradient {
		background-image: linear-gradient(135deg, #22c55e, #3b82f6);
	}
</style>
