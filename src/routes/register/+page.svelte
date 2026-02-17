<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Github from '@lucide/svelte/icons/github';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import type { ActionData } from './$types';

	const USERNAME_RE = /^[a-z0-9]{1,39}$/;

	let { form }: { form: ActionData } = $props();

	let username = $state('');
	let usernameStatus = $state<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const signupSuccess = $derived(form?.success === true);

	function onUsernameInput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9]/g, '');
		e.currentTarget.value = raw;
		username = raw;

		clearTimeout(debounceTimer);

		if (!raw) {
			usernameStatus = 'idle';
			return;
		}

		if (!USERNAME_RE.test(raw)) {
			usernameStatus = 'invalid';
			return;
		}

		usernameStatus = 'checking';
		debounceTimer = setTimeout(() => void checkAvailability(raw), 400);
	}

	async function checkAvailability(value: string) {
		// bail if username changed since we scheduled
		if (value !== username) return;
		try {
			const { data } = await authClient.isUsernameAvailable({ username: value });
			// bail if username changed during fetch
			if (value !== username) return;
			usernameStatus = data?.available ? 'available' : 'taken';
		} catch {
			if (value !== username) return;
			usernameStatus = 'idle';
		}
	}

	const usernameHint = $derived.by(() => {
		switch (usernameStatus) {
			case 'checking':
				return { text: 'Checking availability...', class: 'text-muted-foreground' } as const;
			case 'available':
				return { text: 'Username is available', class: 'text-green-500' } as const;
			case 'taken':
				return { text: 'Username is already taken', class: 'text-destructive' } as const;
			case 'invalid':
				return {
					text: 'Lowercase letters and numbers only, 1-39 chars',
					class: 'text-destructive'
				} as const;
			default:
				return null;
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6">
		{#if signupSuccess}
			<div class="text-center">
				<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
					<Mail class="size-5 text-muted-foreground" />
				</div>
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Check your email</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					We've sent a verification link to <span class="font-medium text-foreground"
						>{form?.email}</span
					>. Click the link to activate your account.
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
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
				<p class="mt-1 text-sm text-muted-foreground">Start tracking your media backlog</p>
			</div>

			<form
				method="post"
				action="?/signUpEmail"
				use:enhance={() =>
					({ result, update }) => {
						if (result.type === 'failure' && typeof result.data?.message === 'string') {
							toast.error(result.data.message);
						}
						update();
					}}
				class="space-y-4"
			>
				<div class="space-y-1.5">
					<Label for="name">Name</Label>
					<Input id="name" name="name" required />
				</div>
				<div class="space-y-1.5">
					<Label for="username">Username</Label>
					<div class="relative">
						<span
							class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
							>@</span
						>
						<Input
							id="username"
							name="username"
							value={username}
							oninput={onUsernameInput}
							required
							autocomplete="username"
							class="pl-7"
							placeholder="yourname"
						/>
						{#if usernameStatus === 'checking'}
							<LoaderCircle
								class="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
							/>
						{:else if usernameStatus === 'available'}
							<CircleCheck
								class="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-green-500"
							/>
						{:else if usernameStatus === 'taken'}
							<CircleX class="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-destructive" />
						{/if}
					</div>
					{#if usernameHint}
						<p class="text-xs {usernameHint.class}">{usernameHint.text}</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							Lowercase letters and numbers only. Used for your public profile URL.
						</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" name="email" required />
				</div>
				<div class="space-y-1.5">
					<Label for="password">Password</Label>
					<Input id="password" type="password" name="password" required />
				</div>

				<Button type="submit" class="w-full" disabled={usernameStatus === 'taken'}>
					Create account
				</Button>
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
				<input type="hidden" name="provider" value="github" />
				<Button variant="outline" class="w-full gap-2">
					<Github class="size-4" />
					Sign up with GitHub
				</Button>
			</form>

			<p class="text-center text-sm text-muted-foreground">
				Already have an account?
				<a
					href="/login"
					class="text-foreground underline underline-offset-4 hover:text-foreground/80">Sign in</a
				>
			</p>
		{/if}
	</div>
</div>
