<script lang="ts">
	import { MEDIA_TYPE_SLUGS, MEDIA_TYPE_LABELS, slugToMediaType, STATUS_COLORS } from '$lib/types';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Film from '@lucide/svelte/icons/film';
	import Tv from '@lucide/svelte/icons/tv';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Podcast from '@lucide/svelte/icons/podcast';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const boards = MEDIA_TYPE_SLUGS.map((slug, i) => {
		const type = slugToMediaType(slug);
		const icons = [BookOpen, Film, Tv, Gamepad2, Podcast];
		const colors = [
			STATUS_COLORS.wishlist,
			STATUS_COLORS.completed,
			STATUS_COLORS.in_progress,
			STATUS_COLORS.on_hold,
			STATUS_COLORS.abandoned
		];
		return {
			href: `/@${data.profileUser.username}/${slug}`,
			label: type ? MEDIA_TYPE_LABELS[type].plural : slug,
			icon: icons[i],
			color: colors[i]
		};
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-md space-y-8 text-center">
		<!-- Profile header -->
		<div>
			{#if data.profileUser.image}
				<img
					src={data.profileUser.image}
					alt={data.profileUser.name}
					class="mx-auto size-16 rounded-full"
				/>
			{:else}
				<div
					class="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground"
				>
					{data.profileUser.name
						.split(' ')
						.map((w: string) => w[0])
						.join('')
						.slice(0, 2)
						.toUpperCase()}
				</div>
			{/if}
			<h1 class="mt-3 text-xl font-bold tracking-tight text-foreground">
				{data.profileUser.name}
			</h1>
			<p class="text-sm text-muted-foreground">@{data.profileUser.username}</p>
		</div>

		<!-- Board grid -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each boards as board, i (board.label)}
				<a
					href={board.href}
					class="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:border-transparent hover:shadow-md"
					style:--accent={board.color}
				>
					<div
						class="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-[0.08] dark:group-hover:opacity-[0.12]"
						style:background={board.color}
					></div>
					<div class="relative flex flex-col items-center gap-2">
						<span style:color={board.color}>
							<board.icon class="size-6" />
						</span>
						<span class="text-sm font-medium text-foreground">{board.label}</span>
					</div>
				</a>
			{/each}
		</div>

		<p class="text-xs text-muted-foreground/60">
			Powered by <a href="/" class="underline underline-offset-2 hover:text-muted-foreground"
				>BacklogBox</a
			>
		</p>
	</div>
</div>
