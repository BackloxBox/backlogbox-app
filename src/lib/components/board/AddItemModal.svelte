<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { SearchResult } from '$lib/server/search';

	type Props = {
		slug: string;
		open: boolean;
		onClose: () => void;
		onSearch: (query: string) => Promise<SearchResult[]>;
		onAdd: (result: SearchResult) => Promise<void>;
		onManualAdd: (title: string) => Promise<void>;
	};

	let { slug, open, onClose, onSearch, onAdd, onManualAdd }: Props = $props();

	let searchQuery = $state('');
	let results = $state<SearchResult[]>([]);
	let searching = $state(false);
	let adding = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Manual add form state
	let showManualForm = $state(false);
	let manualTitle = $state('');

	function reset() {
		searchQuery = '';
		results = [];
		searching = false;
		adding = false;
		showManualForm = false;
		manualTitle = '';
	}

	function handleClose() {
		reset();
		onClose();
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		showManualForm = false;

		if (searchQuery.trim().length < 2) {
			results = [];
			return;
		}

		searching = true;
		debounceTimer = setTimeout(async () => {
			try {
				results = await onSearch(searchQuery.trim());
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 400);
	}

	async function handleSelect(result: SearchResult) {
		adding = true;
		try {
			await onAdd(result);
			handleClose();
		} catch (err) {
			console.error('Failed to add item:', err);
		} finally {
			adding = false;
		}
	}

	/** Build a subtitle string from search result metadata */
	function resultDetail(result: SearchResult): string {
		const detail = (result.meta.author ??
			result.meta.director ??
			result.meta.host ??
			result.meta.platform ??
			'') as string;
		const year = result.releaseYear ? String(result.releaseYear) : '';
		if (detail && year) return `${detail} \u00b7 ${year}`;
		return detail || year;
	}

	async function handleManualAdd() {
		if (!manualTitle.trim()) return;
		adding = true;
		try {
			await onManualAdd(manualTitle.trim());
			handleClose();
		} catch (err) {
			console.error('Failed to add item:', err);
		} finally {
			adding = false;
		}
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(v) => {
		if (!v) handleClose();
	}}
>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add item</Dialog.Title>
			<Dialog.Description class="sr-only">Search or manually add an item</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			<!-- Search input -->
			<Input
				type="text"
				placeholder="Search by title..."
				bind:value={searchQuery}
				oninput={handleInput}
			/>

			<!-- Results list -->
			<div class="max-h-72 overflow-y-auto">
				{#if searching}
					<p class="py-6 text-center text-sm text-muted-foreground">Searching...</p>
				{:else if results.length > 0}
					<div class="divide-y divide-border">
						{#each results as result (result.externalId)}
							<button
								class="flex w-full items-center gap-3 px-1 py-2.5 text-left transition hover:bg-accent disabled:opacity-50"
								onclick={() => handleSelect(result)}
								disabled={adding}
							>
								{#if result.coverUrl}
									<img
										src={result.coverUrl}
										alt=""
										class="h-12 w-9 shrink-0 rounded-sm object-cover"
									/>
								{:else}
									<div
										class="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-muted text-xs text-muted-foreground"
									>
										?
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-foreground">{result.title}</p>
									{#if resultDetail(result)}
										<p class="truncate text-xs text-muted-foreground">{resultDetail(result)}</p>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{:else if searchQuery.trim().length >= 2 && !searching}
					<p class="py-6 text-center text-sm text-muted-foreground">No results found</p>
				{/if}
			</div>

			<!-- Manual add toggle -->
			{#if !showManualForm}
				<button
					class="w-full rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
					onclick={() => (showManualForm = true)}
				>
					Add manually
				</button>
			{:else}
				<div class="flex gap-2">
					<Input
						type="text"
						placeholder="Title"
						bind:value={manualTitle}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter') handleManualAdd();
						}}
					/>
					<Button size="sm" onclick={handleManualAdd} disabled={adding || !manualTitle.trim()}>
						Add
					</Button>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
