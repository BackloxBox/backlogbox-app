<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Github from '@lucide/svelte/icons/github';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import type { ActionData } from './$types';

	const USERNAME_RE = /^[a-z0-9]{3,39}$/;
	const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
	const MIN_PASSWORD_LENGTH = 8;

	let { form }: { form: ActionData } = $props();

	let username = $state('');
	let email = $state('');
	let password = $state('');
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
					text: 'Lowercase letters and numbers only, 3-39 chars',
					class: 'text-destructive'
				} as const;
			default:
				return null;
		}
	});

	const emailHint = $derived.by(() => {
		if (!email) return null;
		if (!EMAIL_RE.test(email)) {
			return { text: 'Enter a valid email address', class: 'text-destructive' } as const;
		}
		return null;
	});

	const passwordHint = $derived.by(() => {
		if (!password) return null;
		if (password.length < MIN_PASSWORD_LENGTH) {
			return {
				text: `${MIN_PASSWORD_LENGTH - password.length} more character${MIN_PASSWORD_LENGTH - password.length === 1 ? '' : 's'} needed`,
				class: 'text-destructive'
			} as const;
		}
		return null;
	});

	const usernameValid = $derived(usernameStatus === 'available' || usernameStatus === 'checking');
	const emailValid = $derived(email.length > 0 && EMAIL_RE.test(email));
	const passwordValid = $derived(password.length >= MIN_PASSWORD_LENGTH);
	const formValid = $derived(usernameValid && emailValid && passwordValid);
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
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">Start your free trial</h1>
				<p class="mt-1 text-sm text-muted-foreground">14 days free, no credit card required</p>
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
						<Tooltip.Root>
							<Tooltip.Trigger
								class="cursor-default text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
							>
								Lowercase letters and numbers only. Used for your public profile URL.
							</Tooltip.Trigger>
							<Tooltip.Content>
								3-39 characters, lowercase letters (a-z) and numbers (0-9)
							</Tooltip.Content>
						</Tooltip.Root>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" type="email" name="email" required bind:value={email} />
					{#if emailHint}
						<p class="text-xs {emailHint.class}">{emailHint.text}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						name="password"
						required
						minlength={8}
						placeholder="At least 8 characters"
						bind:value={password}
					/>
					{#if passwordHint}
						<p class="text-xs {passwordHint.class}">{passwordHint.text}</p>
					{/if}
				</div>

				<Button type="submit" class="w-full" disabled={!formValid}>Create account</Button>
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

			<div class="flex flex-col gap-2">
				<form method="post" action="?/signInSocial" use:enhance>
					<input type="hidden" name="provider" value="github" />
					<Button type="submit" variant="outline" class="w-full gap-2">
						<Github class="size-4" />
						Sign up with GitHub
					</Button>
				</form>
				<form method="post" action="?/signInSocial" use:enhance>
					<input type="hidden" name="provider" value="google" />
					<Button type="submit" variant="outline" class="w-full gap-2">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Sign up with Google
					</Button>
				</form>
			</div>

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
