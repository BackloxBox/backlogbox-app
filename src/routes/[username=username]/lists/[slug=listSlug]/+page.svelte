<script lang="ts">
	import CustomKanbanBoard from '$lib/components/custom-list/CustomKanbanBoard.svelte';
	import BoardSearch from '$lib/components/board/BoardSearch.svelte';
	import { getIconComponent } from '$lib/components/custom-list/icon-map';
	import {
		CUSTOM_LIST_STATUSES,
		CUSTOM_LIST_STATUS_LABELS,
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		slugToMediaType,
		type CustomListStatus
	} from '$lib/types';
	import type { CustomListItemWithFields } from '$lib/server/db/custom-list-queries';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	$effect(() => {
		void data.list;
		searchQuery = '';
	});

	function groupByStatus(
		items: CustomListItemWithFields[]
	): Record<CustomListStatus, CustomListItemWithFields[]> {
		const grouped: Record<CustomListStatus, CustomListItemWithFields[]> = {
			wishlist: [],
			planned: [],
			doing: [],
			completed: [],
			abandoned: []
		};
		for (const item of items) {
			grouped[item.status].push(item);
		}
		for (const status of CUSTOM_LIST_STATUSES) {
			grouped[status].sort((a, b) => a.sortOrder - b.sortOrder);
		}
		return grouped;
	}

	const filteredItems = $derived.by(() => {
		const needle = searchQuery.trim().toLowerCase();
		return needle
			? data.items.filter(
					(item) =>
						item.title.toLowerCase().includes(needle) ||
						(item.subtitle?.toLowerCase().includes(needle) ?? false)
				)
			: data.items;
	});
	const groupedItems = $derived(groupByStatus(filteredItems));

	const Icon = $derived(getIconComponent(data.list.icon));

	/** Nav links for media types + custom lists within this profile */
	const profileNav = $derived(
		MEDIA_TYPE_SLUGS.map((slug) => {
			const mt = slugToMediaType(slug);
			return {
				href: `/@${data.profileUser.username}/${slug}`,
				label: mt ? MEDIA_TYPE_LABELS[mt].plural : slug,
				active: false
			};
		})
	);

	const customListNav = $derived(
		data.publicCustomLists.map((l) => ({
			href: `/@${data.profileUser.username}/lists/${l.slug}`,
			label: l.name,
			active: l.slug === data.list.slug
		}))
	);
</script>

<svelte:head>
	<title>{data.list.name} — @{data.profileUser.username} — BacklogBox</title>
	<meta
		name="description"
		content="@{data.profileUser.username}'s {data.list.name} list on BacklogBox."
	/>
	<meta property="og:title" content="{data.list.name} — @{data.profileUser.username}" />
	<meta
		property="og:description"
		content="@{data.profileUser.username}'s {data.list.name} list on BacklogBox."
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

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
			<div class="flex items-center gap-1.5">
				<Icon class="size-4 text-muted-foreground" />
				<h1 class="text-sm font-medium text-foreground">{data.list.name}</h1>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<BoardSearch bind:value={searchQuery} />
			<a
				href="/"
				class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
			>
				<img src="/backlogbox-logo.svg" alt="" class="size-3.5" />
				BacklogBox
			</a>
		</div>
	</header>

	<!-- Nav tabs -->
	<nav class="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
		{#each profileNav as nav (nav.label)}
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
		{#each customListNav as nav (nav.label)}
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
		<CustomKanbanBoard
			{groupedItems}
			statusLabels={CUSTOM_LIST_STATUS_LABELS}
			boardId="list:{data.list.slug}"
			readonly
		/>
	</div>
</div>
