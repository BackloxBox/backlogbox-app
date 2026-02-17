<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let sent = $derived(form?.success === true);
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6">
		{#if sent}
			<div class="text-center">
				<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
					<Mail class="size-5 text-muted-foreground" />
				</div>
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Check your email</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					If an account exists with that email, we've sent a password reset link. Check your inbox
					and spam folder.
				</p>
			</div>

			<a
				href="/login"
				class="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="size-4" />
				Back to sign in
			</a>
		{:else}
			<div class="text-center">
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Forgot password?</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Enter your email and we'll send you a reset link.
				</p>
			</div>

			<form method="post" use:enhance class="space-y-4">
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" name="email" required />
				</div>

				<Button type="submit" class="w-full">Send reset link</Button>
			</form>

			{#if form?.message}
				<p class="text-center text-sm text-destructive">{form.message}</p>
			{/if}

			<p class="text-center text-sm text-muted-foreground">
				<a
					href="/login"
					class="text-foreground underline underline-offset-4 hover:text-foreground/80"
					>Back to sign in</a
				>
			</p>
		{/if}
	</div>
</div>
