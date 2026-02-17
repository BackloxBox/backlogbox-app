<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Github from '@lucide/svelte/icons/github';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { page } from '$app/state';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const redirectTo = $derived(page.url.searchParams.get('redirect') ?? '');
	const passwordReset = $derived(page.url.searchParams.get('reset') === 'true');
	const emailVerified = $derived(page.url.searchParams.get('verified') === 'true');
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<img src="/backlogbox-logo.svg" alt="BacklogBox" class="mx-auto mb-4 size-10" />
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
			<p class="mt-1 text-sm text-muted-foreground">Welcome back to BacklogBox</p>
		</div>

		{#if passwordReset}
			<div
				class="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
			>
				<CircleCheck class="size-4 shrink-0" />
				Password reset successfully. Sign in with your new password.
			</div>
		{/if}

		{#if emailVerified}
			<div
				class="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
			>
				<CircleCheck class="size-4 shrink-0" />
				Email verified. You can now sign in.
			</div>
		{/if}

		<form method="post" action="?/signInEmail" use:enhance class="space-y-4">
			{#if redirectTo}<input type="hidden" name="redirect" value={redirectTo} />{/if}
			<div class="space-y-1.5">
				<Label for="email">Email</Label>
				<Input id="email" type="email" name="email" required />
			</div>
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-xs text-muted-foreground hover:text-foreground">
						Forgot password?
					</a>
				</div>
				<Input id="password" type="password" name="password" required />
			</div>

			<Button type="submit" class="w-full">Sign in</Button>
		</form>

		{#if form?.message}
			<p class="text-center text-sm text-destructive">{form.message}</p>
		{/if}

		<div class="relative">
			<Separator />
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="bg-background px-2 text-xs text-muted-foreground">or</span>
			</div>
		</div>

		<form method="post" action="?/signInSocial" use:enhance>
			{#if redirectTo}<input type="hidden" name="redirect" value={redirectTo} />{/if}
			<input type="hidden" name="provider" value="github" />
			<Button variant="outline" class="w-full gap-2">
				<Github class="size-4" />
				Sign in with GitHub
			</Button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Don't have an account?
			<a
				href="/register"
				class="text-foreground underline underline-offset-4 hover:text-foreground/80">Register</a
			>
		</p>
	</div>
</div>
