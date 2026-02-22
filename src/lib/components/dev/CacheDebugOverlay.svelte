<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { debugMode } from './debug-state.svelte';
	import { getDebugStats } from '../../../routes/(app)/discover/discover.remote';
	import Bug from '@lucide/svelte/icons/bug';
	import X from '@lucide/svelte/icons/x';

	const isDiscoverPage = $derived(page.url.pathname === '/discover');
	const statsQuery = $derived(debugMode.enabled ? getDebugStats() : undefined);
	const stats = $derived(statsQuery?.current);
</script>

{#if dev}
	<!-- Toggle button — always visible in dev -->
	<button
		class="fixed bottom-4 left-4 z-[9999] flex size-10 items-center justify-center rounded-full shadow-lg transition-colors
			{debugMode.enabled
			? 'bg-red-500 text-white hover:bg-red-600'
			: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}"
		onclick={() => debugMode.toggle()}
		title="Toggle cache debug overlay"
	>
		<Bug class="size-5" />
	</button>

	<!-- Debug panel -->
	{#if debugMode.enabled}
		<div
			class="fixed bottom-16 left-4 z-[9999] w-72 rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-zinc-300 shadow-xl"
		>
			<div class="mb-2 flex items-center justify-between">
				<span class="font-semibold text-zinc-100">Cache Debug</span>
				<button class="text-zinc-500 hover:text-zinc-300" onclick={() => debugMode.toggle()}>
					<X class="size-4" />
				</button>
			</div>

			{#if stats}
				<!-- Cache stats -->
				<div class="space-y-1.5">
					<div class="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Cache</div>
					<div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
						<span class="text-zinc-500">entries</span>
						<span>{stats.cache.size}</span>
						<span class="text-zinc-500">hit rate</span>
						<span class={stats.cache.hitRate === '0%' ? 'text-red-400' : 'text-green-400'}>
							{stats.cache.hitRate}
						</span>
						<span class="text-zinc-500">hits</span>
						<span class="text-green-400">{stats.cache.hits}</span>
						<span class="text-zinc-500">stale hits</span>
						<span class="text-yellow-400">{stats.cache.staleHits}</span>
						<span class="text-zinc-500">misses</span>
						<span class="text-red-400">{stats.cache.misses}</span>
						<span class="text-zinc-500">coalesced</span>
						<span class="text-blue-400">{stats.cache.coalescedRequests}</span>
						<span class="text-zinc-500">bg revalidations</span>
						<span class="text-purple-400">{stats.cache.backgroundRevalidations}</span>
						<span class="text-zinc-500">evictions</span>
						<span>{stats.cache.evictions}</span>
					</div>
				</div>

				<!-- Rate limiters -->
				<div class="mt-3 space-y-1.5">
					<div class="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
						Rate Limiters
					</div>
					{#each stats.rateLimiters as rl (rl.provider)}
						<div class="flex items-center gap-2">
							<span class="w-20 text-zinc-500">{rl.provider}</span>
							<div class="flex-1">
								<div class="h-1.5 rounded-full bg-zinc-700">
									<div
										class="h-full rounded-full transition-all {rl.available > rl.maxTokens * 0.5
											? 'bg-green-500'
											: rl.available > rl.maxTokens * 0.2
												? 'bg-yellow-500'
												: 'bg-red-500'}"
										style:width="{Math.min(100, (rl.available / rl.maxTokens) * 100)}%"
									></div>
								</div>
							</div>
							<span class="w-8 text-right text-[10px]">{rl.available}/{rl.maxTokens}</span>
							{#if rl.waiting > 0}
								<span class="text-[10px] text-yellow-400">({rl.waiting} waiting)</span>
							{/if}
						</div>
					{/each}
				</div>
			{:else if !isDiscoverPage}
				<p class="text-zinc-500">Navigate to /discover to see live stats</p>
			{:else}
				<p class="text-zinc-500">Loading stats...</p>
			{/if}

			<!-- Legend for section indicators -->
			<div class="mt-3 space-y-1 border-t border-zinc-700 pt-2">
				<div class="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
					Section Indicators
				</div>
				<div class="flex flex-wrap gap-2">
					<span
						class="rounded border border-green-500/50 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400"
					>
						CACHED
					</span>
					<span
						class="rounded border border-yellow-500/50 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-400"
					>
						STALE
					</span>
					<span
						class="rounded border border-red-500/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400"
					>
						FRESH
					</span>
					<span
						class="rounded border border-blue-500/50 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400"
					>
						COALESCED
					</span>
				</div>
			</div>
		</div>
	{/if}
{/if}
