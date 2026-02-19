<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { onMount } from 'svelte';

	let { value = $bindable('') }: { value: string } = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let expanded = $state(false);

	/** Expand + focus; on mobile this is the only way to open the input */
	function open() {
		expanded = true;
		// Wait for the input to render before focusing
		queueMicrotask(() => inputEl?.focus());
	}

	/** Collapse if empty */
	function collapseIfEmpty() {
		if (!value) expanded = false;
	}

	function clear() {
		value = '';
		inputEl?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			value = '';
			expanded = false;
			inputEl?.blur();
		} else if (e.key === 'Enter') {
			inputEl?.blur();
		}
	}

	onMount(() => {
		function onGlobalKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				open();
			}
		}
		window.addEventListener('keydown', onGlobalKeydown);
		return () => window.removeEventListener('keydown', onGlobalKeydown);
	});
</script>

<div class="relative flex items-center">
	{#if expanded}
		<div class="relative flex items-center">
			<Search class="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
			<input
				bind:this={inputEl}
				bind:value
				type="search"
				enterkeyhint="search"
				placeholder="Search..."
				onblur={collapseIfEmpty}
				onkeydown={handleKeydown}
				class="h-8 w-44 rounded-md border border-input bg-background pr-8 pl-8
					text-sm shadow-xs transition-[width] outline-none
					placeholder:text-muted-foreground
					focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
					sm:w-56"
			/>
			{#if value}
				<button
					type="button"
					onclick={clear}
					class="absolute right-2 flex items-center text-muted-foreground hover:text-foreground"
				>
					<X class="size-3.5" />
				</button>
			{/if}
		</div>
	{:else}
		<button
			type="button"
			onclick={open}
			class="hidden items-center gap-1.5 rounded-md border border-input bg-background
				px-2.5 py-1.5 text-muted-foreground shadow-xs transition
				hover:bg-accent hover:text-foreground sm:flex"
			aria-label="Search board"
		>
			<Search class="size-3.5" />
			<span class="text-xs">Search</span>
			<kbd
				class="ml-1 flex h-5 items-center gap-0.5 rounded border border-border
					bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
			>
				<span class="text-xs">&#8984;</span>K
			</kbd>
		</button>
		<!-- Mobile: icon-only -->
		<button
			type="button"
			onclick={open}
			class="flex size-8 items-center justify-center rounded-md text-muted-foreground
				transition hover:bg-accent hover:text-foreground sm:hidden"
			aria-label="Search board"
		>
			<Search class="size-4" />
		</button>
	{/if}
</div>
