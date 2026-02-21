<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		MAX_CUSTOM_LISTS,
		slugToMediaType,
		type MediaTypeSlug
	} from '$lib/types';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { getIconComponent } from '$lib/components/custom-list/icon-map';
	import { addList } from './lists/lists.remote';
	import { trackEvent } from '$lib/analytics';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Menu from '@lucide/svelte/icons/menu';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Settings from '@lucide/svelte/icons/settings';
	import Check from '@lucide/svelte/icons/check';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import Compass from '@lucide/svelte/icons/compass';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import Clock from '@lucide/svelte/icons/clock';
	import Share2 from '@lucide/svelte/icons/share-2';
	import type { Component } from 'svelte';

	let { children, data } = $props();

	const SLUG_ICONS: Record<MediaTypeSlug, Component<{ class?: string }>> = {
		books: BookOpen,
		movies: Film,
		series: Tv,
		games: Gamepad2,
		podcasts: Podcast
	};

	const navItems = MEDIA_TYPE_SLUGS.map((slug) => {
		const type = slugToMediaType(slug);
		return {
			href: `/${slug}`,
			slug,
			type,
			label: type ? MEDIA_TYPE_LABELS[type].plural : slug,
			icon: SLUG_ICONS[slug],
			color: type ? MEDIA_TYPE_COLORS[type] : undefined
		};
	});

	let sidebarOpen = $state(false);
	const dashboardActive = $derived(page.url.pathname === '/dashboard');
	const discoverActive = $derived(page.url.pathname === '/discover');
	let copied = $state(false);

	// Custom list inline create
	let showNewListInput = $state(false);
	let newListName = $state('');
	let creatingList = $state(false);

	const canCreateList = $derived(data.customLists.length < MAX_CUSTOM_LISTS);

	async function handleCreateList() {
		const name = newListName.trim();
		if (!name || creatingList) return;
		creatingList = true;
		try {
			await addList({ name });
			trackEvent('custom_list_created');
			newListName = '';
			showNewListInput = false;
			await invalidateAll();
		} finally {
			creatingList = false;
		}
	}

	function handleNewListKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleCreateList();
		} else if (e.key === 'Escape') {
			showNewListInput = false;
			newListName = '';
		}
	}

	const shareUrl = $derived(
		data.profile?.username && data.profile.profilePublic
			? `${page.url.origin}/@${data.profile.username}`
			: null
	);

	function copyShareLink() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	/** Whether to show the "set up sharing" nudge (has username but profile not public) */
	const showSharingNudge = $derived(!shareUrl && data.profile?.username != null);

	/** User initials for avatar */
	const initials = $derived(
		(data.user.name ?? 'U')
			.split(' ')
			.map((w: string) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	/** Trial state — null means no active trial (subscribed or grandfathered) */
	const trialDaysLeft = $derived(data.trialDaysLeft);
	const trialUrgent = $derived(trialDaysLeft !== null && trialDaysLeft <= 3);
</script>

<div class="flex h-screen bg-background text-foreground">
	<!-- Mobile sidebar toggle -->
	<Button
		variant="outline"
		size="icon"
		class="fixed top-3 left-3 z-50 lg:hidden"
		onclick={() => (sidebarOpen = !sidebarOpen)}
		aria-label="Toggle sidebar"
	>
		<Menu class="size-4" />
	</Button>

	<!-- Sidebar backdrop (mobile) -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-30 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			onkeydown={() => {}}
			role="presentation"
		></div>
	{/if}

	<!-- Sidebar -->
	<nav
		class="fixed z-40 flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:relative lg:translate-x-0
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<!-- Logo -->
		<div class="flex h-14 items-center gap-2 px-4 pl-14 lg:pl-4">
			<a href="/dashboard" class="flex items-center gap-2 text-foreground">
				<img src="/backlogbox-logo.svg" alt="" class="size-5" />
				<span class="text-sm font-semibold tracking-tight">BacklogBox</span>
			</a>
		</div>

		<Separator />

		<!-- Nav links -->
		<div class="flex-1 space-y-0.5 overflow-y-auto p-2">
			<a
				href="/discover"
				class="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
				{discoverActive
					? 'bg-sidebar-accent text-sidebar-accent-foreground'
					: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
				onclick={() => (sidebarOpen = false)}
			>
				<span class="shrink-0" style:color="#8B5CF6">
					<Compass class="size-4" />
				</span>
				Discover
			</a>
			<a
				href="/dashboard"
				class="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
				{dashboardActive
					? 'bg-sidebar-accent text-sidebar-accent-foreground'
					: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
				onclick={() => (sidebarOpen = false)}
			>
				<span class="shrink-0" style:color="#f59e0b">
					<LayoutDashboard class="size-4" />
				</span>
				Dashboard
			</a>
			<Separator class="my-1.5" />
			{#each navItems as item (item.slug)}
				{@const active = page.url.pathname === item.href}
				{@const itemCount = item.type ? data.itemCounts[item.type] : undefined}
				<a
					href={item.href}
					class="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
			{active
						? 'bg-sidebar-accent text-sidebar-accent-foreground'
						: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
					onclick={() => (sidebarOpen = false)}
				>
					<span
						class="shrink-0 transition-colors {active
							? ''
							: 'text-muted-foreground group-hover:text-[var(--icon-color)]'}"
						style:color={active ? item.color : undefined}
						style:--icon-color={item.color}
					>
						<item.icon class="size-4" />
					</span>
					{item.label}
					{#if itemCount}
						<span class="ml-auto text-[11px] text-muted-foreground tabular-nums">{itemCount}</span>
					{/if}
				</a>
			{/each}

			<!-- Custom lists -->
			{#if data.customLists.length > 0 || canCreateList}
				<Separator class="my-1.5" />
				<span
					class="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-wider text-muted-foreground/60 uppercase"
					>Lists
					{#if data.customListItemCount > 0}
						<span class="text-[10px] text-muted-foreground/40 tabular-nums"
							>{data.customListItemCount}</span
						>
					{/if}
				</span>
				{#each data.customLists as list (list.id)}
					{@const listActive = page.url.pathname === `/lists/${list.slug}`}
					{@const Icon = getIconComponent(list.icon)}
					<a
						href="/lists/{list.slug}"
						class="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
						{listActive
							? 'bg-sidebar-accent text-sidebar-accent-foreground'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
						onclick={() => (sidebarOpen = false)}
					>
						<span class="shrink-0 text-muted-foreground">
							<Icon class="size-4" />
						</span>
						<span class="truncate">{list.name}</span>
					</a>
				{/each}
				{#if canCreateList}
					{#if showNewListInput}
						<div class="flex items-center gap-1 px-1.5 py-1">
							<Input
								type="text"
								bind:value={newListName}
								onkeydown={handleNewListKeydown}
								placeholder="List name…"
								disabled={creatingList}
								class="h-7 text-xs"
								autofocus
							/>
							<Button
								variant="ghost"
								size="icon"
								class="size-7 shrink-0 text-emerald-500 hover:text-emerald-600"
								disabled={!newListName.trim() || creatingList}
								onclick={handleCreateList}
								aria-label="Create list"
							>
								<Check class="size-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="size-7 shrink-0 text-muted-foreground hover:text-foreground"
								onclick={() => {
									showNewListInput = false;
									newListName = '';
								}}
								aria-label="Cancel"
							>
								<X class="size-3.5" />
							</Button>
						</div>
					{:else}
						<button
							class="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							onclick={() => (showNewListInput = true)}
						>
							<Plus class="size-4 shrink-0" />
							New list
						</button>
					{/if}
				{/if}
			{/if}
		</div>

		<!-- Trial banner -->
		{#if trialDaysLeft !== null}
			<div class="px-2">
				<a
					href="/subscribe"
					class="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition
				{trialUrgent
						? 'border-red-400 bg-red-100 text-red-700 hover:bg-red-200 dark:border-red-500 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25'
						: 'border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25'}"
				>
					<Clock class="size-3.5 shrink-0" />
					{#if trialDaysLeft === 0}
						Trial ends today
					{:else}
						{trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left in trial
					{/if}
				</a>
			</div>
		{/if}

		<!-- Share profile box -->
		{#if shareUrl}
			<div class="px-2">
				<button
					class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition
					{copied
						? 'border-emerald-500 bg-emerald-200 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-500/25 dark:text-emerald-300'
						: 'border-emerald-400 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25'}"
					onclick={copyShareLink}
				>
					{#if copied}
						<Check class="size-3.5 shrink-0" />
						Link copied!
					{:else}
						<Share2 class="size-3.5 shrink-0" />
						Share your profile
					{/if}
				</button>
			</div>
		{:else if showSharingNudge}
			<div class="px-2">
				<a
					href="/settings"
					class="flex items-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-50 px-3 py-2 text-xs text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
					onclick={() => (sidebarOpen = false)}
				>
					<Share2 class="size-3.5 shrink-0" />
					Set up profile sharing
				</a>
			</div>
		{/if}

		<!-- Bottom nav -->
		<div class="space-y-0.5 p-2">
			<a
				href="/settings"
				class="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition
				{page.url.pathname === '/settings'
					? 'bg-sidebar-accent text-sidebar-accent-foreground'
					: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
				onclick={() => (sidebarOpen = false)}
			>
				<Settings
					class="size-4 shrink-0 {page.url.pathname === '/settings'
						? 'text-foreground'
						: 'text-muted-foreground'}"
				/>
				Settings
			</a>
		</div>

		<Separator />

		<!-- User footer -->
		<div class="p-2">
			<div class="mb-1.5 flex items-center gap-2.5 px-2">
				<div
					class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground"
				>
					{initials}
				</div>
				<span class="truncate text-xs text-muted-foreground">{data.user.name}</span>
			</div>
			<div class="flex items-center gap-1">
				<form method="post" action="/signout" use:enhance class="flex-1">
					<button
						class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					>
						<LogOut class="size-3.5" />
						Sign out
					</button>
				</form>
				<Button
					variant="ghost"
					size="icon"
					class="size-8 shrink-0"
					onclick={toggleMode}
					aria-label="Toggle theme"
				>
					<Sun class="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon
						class="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
					/>
				</Button>
			</div>
		</div>
	</nav>

	<!-- Main content -->
	<main class="min-h-0 flex-1 overflow-auto">
		{@render children()}
	</main>
</div>
