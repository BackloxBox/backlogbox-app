<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { MEDIA_TYPE_SLUGS, MEDIA_TYPE_LABELS, slugToMediaType } from '$lib/types';

	let { children, data } = $props();

	const navItems = MEDIA_TYPE_SLUGS.map((slug) => {
		const type = slugToMediaType(slug);
		return {
			href: `/${slug}`,
			label: type ? MEDIA_TYPE_LABELS[type].plural : slug
		};
	});

	let sidebarOpen = $state(false);
</script>

<div class="flex h-screen bg-gray-950 text-gray-100">
	<!-- Mobile sidebar toggle -->
	<button
		aria-label="Toggle sidebar"
		class="fixed top-3 left-3 z-50 rounded-md bg-gray-800 p-2 lg:hidden"
		onclick={() => (sidebarOpen = !sidebarOpen)}
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16M4 18h16"
			/>
		</svg>
	</button>

	<!-- Sidebar backdrop (mobile) -->
	{#if sidebarOpen}
		<button
			aria-label="Close sidebar"
			class="fixed inset-0 z-30 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			tabindex="-1"
		></button>
	{/if}

	<!-- Sidebar -->
	<nav
		class="fixed z-40 flex h-full w-56 flex-col border-r border-gray-800 bg-gray-900 transition-transform lg:relative lg:translate-x-0
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="flex h-14 items-center border-b border-gray-800 px-4">
			<a href="/" class="text-lg font-bold text-white">BacklogBox</a>
		</div>

		<div class="flex-1 space-y-1 overflow-y-auto p-3">
			{#each navItems as item}
				{@const active = page.url.pathname === item.href}
				<a
					href={item.href}
					class="block rounded-md px-3 py-2 text-sm font-medium transition
					{active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
					onclick={() => (sidebarOpen = false)}
				>
					{item.label}
				</a>
			{/each}
		</div>

		<div class="border-t border-gray-800 p-3">
			<div class="mb-2 truncate px-3 text-xs text-gray-500">
				{data.user.name}
			</div>
			<form method="post" action="/signout" use:enhance>
				<button
					class="w-full rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
				>
					Sign out
				</button>
			</form>
		</div>
	</nav>

	<!-- Main content -->
	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>
