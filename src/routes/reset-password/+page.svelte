<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	const token = $derived(data.token);
	const urlError = $derived(data.error);

	const hasValidToken = $derived(!!token && !urlError);
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6">
		{#if !hasValidToken}
			<div class="text-center">
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Invalid link</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					This password reset link has expired or is invalid. Please request a new one.
				</p>
			</div>

			<Button href="/forgot-password" class="w-full">Request new link</Button>

			<p class="text-center text-sm text-muted-foreground">
				<a
					href="/login"
					class="text-foreground underline underline-offset-4 hover:text-foreground/80"
					>Back to sign in</a
				>
			</p>
		{:else}
			<div class="text-center">
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
				<p class="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
			</div>

			<form method="post" use:enhance class="space-y-4">
				<input type="hidden" name="token" value={token} />

				<div class="space-y-1.5">
					<Label for="password">New password</Label>
					<Input
						id="password"
						type="password"
						name="password"
						required
						minlength={8}
						placeholder="At least 8 characters"
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="confirmPassword">Confirm password</Label>
					<Input id="confirmPassword" type="password" name="confirmPassword" required />
				</div>

				<Button type="submit" class="w-full">Reset password</Button>
			</form>

			{#if form?.message}
				<p class="text-center text-sm text-destructive">{form.message}</p>
			{/if}

			<p class="text-center text-sm text-muted-foreground">
				<a
					href="/login"
					class="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:text-foreground/80"
				>
					<ArrowLeft class="size-3" />
					Back to sign in
				</a>
			</p>
		{/if}
	</div>
</div>
