<script lang="ts">
	import { MEDIA_TYPE_SLUGS, MEDIA_TYPE_LABELS, slugToMediaType } from '$lib/types';

	const boards = MEDIA_TYPE_SLUGS.map((slug) => {
		const type = slugToMediaType(slug);
		return {
			href: `/${slug}`,
			label: type ? MEDIA_TYPE_LABELS[type].plural : slug
		};
	});
</script>

<div class="p-6 lg:p-8">
	<h1 class="text-2xl font-bold text-white">Dashboard</h1>
	<p class="mt-1 text-sm text-gray-400">Choose a board to get started.</p>

	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each boards as board}
			<a
				href={board.href}
				class="rounded-lg border border-gray-800 bg-gray-900 p-6 transition hover:border-indigo-500 hover:bg-gray-800"
			>
				<h2 class="text-lg font-semibold text-white">{board.label}</h2>
			</a>
		{/each}
	</div>
</div>
