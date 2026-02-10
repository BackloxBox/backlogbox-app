<script lang="ts">
	import KanbanBoard from '$lib/components/board/KanbanBoard.svelte';
	import BoardSearch from '$lib/components/board/BoardSearch.svelte';
	import { getSearchableText } from '$lib/components/board/card-utils';
	import {
		MEDIA_STATUSES,
		STATUS_LABELS,
		slugToMediaType,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_SLUGS,
		type MediaStatus
	} from '$lib/types';
	import type { MediaItemWithMeta } from '$lib/server/db/queries';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const type = $derived(slugToMediaType(data.slug));
	const statusLabels = $derived(type ? STATUS_LABELS[type] : STATUS_LABELS.book);
	const typeLabel = $derived(type ? MEDIA_TYPE_LABELS[type].plural : data.slug);

	let searchQuery = $state('');

	// Reset search when switching media types
	$effect(() => {
		data.slug;
		searchQuery = '';
	});

	function groupByStatus(items: MediaItemWithMeta[]): Record<MediaStatus, MediaItemWithMeta[]> {
		const grouped = Object.fromEntries(
			MEDIA_STATUSES.map((s) => [s, [] as MediaItemWithMeta[]])
		) as Record<MediaStatus, MediaItemWithMeta[]>;
		for (const item of items) {
			grouped[item.status].push(item);
		}
		for (const status of MEDIA_STATUSES) {
			grouped[status].sort(
				(a, b) => Number(b.pinned) - Number(a.pinned) || a.sortOrder - b.sortOrder
			);
		}
		return grouped;
	}

	const filteredItems = $derived.by(() => {
		const needle = searchQuery.trim().toLowerCase();
		return needle
			? data.items.filter((item) => getSearchableText(item).includes(needle))
			: data.items;
	});
	const groupedItems = $derived(groupByStatus(filteredItems));

	/** Nav links for switching media types within this profile */
	const profileNav = $derived(
		MEDIA_TYPE_SLUGS.map((slug) => {
			const mt = slugToMediaType(slug);
			return {
				href: `/@${data.profileUser.username}/${slug}`,
				slug,
				label: mt ? MEDIA_TYPE_LABELS[mt].plural : slug,
				active: slug === data.slug
			};
		})
	);
</script>

<div class="flex h-screen flex-col bg-background text-foreground">
	<!-- Header -->
	<header class="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
		<div class="flex items-center gap-3">
			<a
				href="/@{data.profileUser.username}"
				class="text-sm font-bold tracking-tight text-foreground hover:text-foreground/80"
			>
				@{data.profileUser.username}
			</a>
			<span class="text-muted-foreground">/</span>
			<h1 class="text-sm font-medium text-foreground">{typeLabel}</h1>
		</div>
		<div class="flex items-center gap-2">
			<BoardSearch bind:value={searchQuery} />
			<a href="/" class="text-xs text-muted-foreground hover:text-foreground">BacklogBox</a>
		</div>
	</header>

	<!-- Media type tabs -->
	<nav class="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
		{#each profileNav as nav (nav.slug)}
			<a
				href={nav.href}
				class="shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition
				{nav.active
					? 'border-foreground text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				{nav.label}
			</a>
		{/each}
	</nav>

	<!-- Board -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<KanbanBoard {groupedItems} {statusLabels} slug={data.slug} readonly />
	</div>
</div>
