<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import {
		MEDIA_TYPE_SLUGS,
		MEDIA_TYPE_LABELS,
		MEDIA_TYPE_COLORS,
		slugToMediaType,
		type MediaTypeSlug
	} from '$lib/types';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Menu from '@lucide/svelte/icons/menu';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Settings from '@lucide/svelte/icons/settings';
	import Link from '@lucide/svelte/icons/link';
	import Check from '@lucide/svelte/icons/check';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
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
			label: type ? MEDIA_TYPE_LABELS[type].plural : slug,
			icon: SLUG_ICONS[slug],
			color: type ? MEDIA_TYPE_COLORS[type] : undefined
		};
	});

	let sidebarOpen = $state(false);
	let copied = $state(false);

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

	/** User initials for avatar */
	const initials = $derived(
		(data.user.name ?? 'U')
			.split(' ')
			.map((w: string) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
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
		<div class="flex h-14 items-center gap-2 px-4">
			<a href="/dashboard" class="flex items-center gap-2 text-foreground">
				<LayoutDashboard class="size-4 text-muted-foreground" />
				<span class="text-sm font-semibold tracking-tight">BacklogBox</span>
			</a>
		</div>

		<Separator />

		<!-- Nav links -->
		<div class="flex-1 space-y-0.5 overflow-y-auto p-2">
			{#each navItems as item (item.slug)}
				{@const active = page.url.pathname === item.href}
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
				</a>
			{/each}
		</div>

		<!-- Bottom nav -->
		<div class="space-y-0.5 p-2">
			{#if shareUrl}
				<button
					class="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					onclick={copyShareLink}
				>
					{#if copied}
						<Check class="size-4 shrink-0 text-green-500" />
						<span class="text-green-500">Copied!</span>
					{:else}
						<Link class="size-4 shrink-0 text-muted-foreground" />
						Share profile
					{/if}
				</button>
			{/if}
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
