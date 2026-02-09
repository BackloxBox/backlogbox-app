<script lang="ts">
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

{#if open}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
		onclick={handleClose}
		aria-label="Close modal"
		tabindex="-1"
	></button>

	<!-- Modal -->
	<div
		class="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl sm:inset-x-auto"
	>
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-lg font-semibold text-white">Add item</h2>
			<button class="text-gray-400 hover:text-white" onclick={handleClose} aria-label="Close">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<div class="p-5">
			<!-- Search input -->
			<input
				type="text"
				placeholder="Search by title..."
				class="block w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				bind:value={searchQuery}
				oninput={handleInput}
			/>

			<!-- Results list -->
			<div class="mt-3 max-h-80 overflow-y-auto">
				{#if searching}
					<p class="py-6 text-center text-sm text-gray-500">Searching...</p>
				{:else if results.length > 0}
					<ul class="divide-y divide-gray-800">
						{#each results as result (result.externalId)}
							<li>
								<button
									class="flex w-full items-center gap-3 px-2 py-2.5 text-left transition hover:bg-gray-800 disabled:opacity-50"
									onclick={() => handleSelect(result)}
									disabled={adding}
								>
									{#if result.coverUrl}
										<img
											src={result.coverUrl}
											alt=""
											class="h-14 w-10 shrink-0 rounded-sm object-cover"
										/>
									{:else}
										<div
											class="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-gray-700 text-xs text-gray-500"
										>
											?
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-white">{result.title}</p>
										{#if resultDetail(result)}
											<p class="truncate text-xs text-gray-400">{resultDetail(result)}</p>
										{/if}
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{:else if searchQuery.trim().length >= 2 && !searching}
					<p class="py-6 text-center text-sm text-gray-500">No results found</p>
				{/if}
			</div>

			<!-- Manual add toggle -->
			{#if !showManualForm}
				<button
					class="mt-3 w-full rounded-md border border-dashed border-gray-700 px-4 py-2 text-sm text-gray-400 transition hover:border-gray-500 hover:text-gray-300"
					onclick={() => (showManualForm = true)}
				>
					Add manually
				</button>
			{:else}
				<div class="mt-3 flex gap-2">
					<input
						type="text"
						placeholder="Title"
						class="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
						bind:value={manualTitle}
						onkeydown={(e) => {
							if (e.key === 'Enter') handleManualAdd();
						}}
					/>
					<button
						class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
						onclick={handleManualAdd}
						disabled={adding || !manualTitle.trim()}
					>
						Add
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
