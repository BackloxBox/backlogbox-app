<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { authClient } from '$lib/auth-client';
	import Link from '@lucide/svelte/icons/link';
	import Check from '@lucide/svelte/icons/check';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let profilePublic = $state(false);

	$effect.pre(() => {
		profilePublic = data.profile?.profilePublic ?? false;
	});
	let copied = $state(false);
	let portalLoading = $state(false);

	const username = $derived(data.profile?.username ?? '');
	const shareUrl = $derived(username && profilePublic ? `${page.url.origin}/@${username}` : null);

	function copyShareLink() {
		if (!shareUrl) return;
		navigator.clipboard.writeText(shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function openPortal() {
		portalLoading = true;
		try {
			await authClient.customer.portal();
		} finally {
			portalLoading = false;
		}
	}
</script>

<div class="mx-auto max-w-lg p-6 lg:p-8">
	<h1 class="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
	<p class="mt-1 text-sm text-muted-foreground">Manage your profile and account</p>

	<!-- Profile section -->
	<form method="post" action="?/updateProfile" use:enhance class="mt-8 space-y-5">
		<h2 class="text-sm font-medium text-foreground">Profile</h2>

		<div class="space-y-1.5">
			<Label for="name">Name</Label>
			<Input id="name" name="name" value={data.profile?.name ?? ''} required />
		</div>

		{#if username}
			<div class="space-y-1.5">
				<Label>Username</Label>
				<p class="text-sm text-foreground">@{username}</p>
			</div>
		{/if}

		<div class="flex items-center justify-between">
			<div>
				<Label for="profilePublic">Public profile</Label>
				<p class="text-xs text-muted-foreground">Allow others to view your boards</p>
			</div>
			<Switch id="profilePublic" bind:checked={profilePublic} disabled={!username} />
			<input type="hidden" name="profilePublic" value={profilePublic ? 'on' : ''} />
		</div>

		{#if shareUrl}
			<div class="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
				<code class="flex-1 truncate text-xs text-muted-foreground">{shareUrl}</code>
				<Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={copyShareLink}>
					{#if copied}
						<Check class="size-3.5 text-green-500" />
					{:else}
						<Link class="size-3.5" />
					{/if}
				</Button>
			</div>
		{/if}

		{#if form?.profileMessage}
			<p class="text-sm {form?.profileSuccess ? 'text-green-500' : 'text-destructive'}">
				{form.profileMessage}
			</p>
		{/if}

		<Button type="submit">Save profile</Button>
	</form>

	<Separator class="my-8" />

	<!-- Subscription section -->
	<div class="space-y-4">
		<h2 class="text-sm font-medium text-foreground">Subscription</h2>
		<p class="text-xs text-muted-foreground">
			Manage your billing, update payment method, or cancel.
		</p>
		<Button variant="outline" class="gap-2" disabled={portalLoading} onclick={openPortal}>
			<CreditCard class="size-3.5" />
			{portalLoading ? 'Opening...' : 'Manage Subscription'}
		</Button>
	</div>

	<Separator class="my-8" />

	<!-- Password section -->
	<form method="post" action="?/changePassword" use:enhance class="space-y-5">
		<h2 class="text-sm font-medium text-foreground">Change password</h2>

		<div class="space-y-1.5">
			<Label for="currentPassword">Current password</Label>
			<Input id="currentPassword" type="password" name="currentPassword" required />
		</div>

		<div class="space-y-1.5">
			<Label for="newPassword">New password</Label>
			<Input id="newPassword" type="password" name="newPassword" required />
			<p class="text-xs text-muted-foreground">Minimum 8 characters</p>
		</div>

		{#if form?.passwordMessage}
			<p class="text-sm {form?.passwordSuccess ? 'text-green-500' : 'text-destructive'}">
				{form.passwordMessage}
			</p>
		{/if}

		<Button type="submit" variant="outline">Update password</Button>
	</form>
</div>
