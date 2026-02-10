<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Github from '@lucide/svelte/icons/github';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
			<p class="mt-1 text-sm text-muted-foreground">Start tracking your media backlog</p>
		</div>

		<form method="post" action="?/signUpEmail" use:enhance class="space-y-4">
			<div class="space-y-1.5">
				<Label for="name">Name</Label>
				<Input id="name" name="name" required />
			</div>
			<div class="space-y-1.5">
				<Label for="email">Email</Label>
				<Input id="email" type="email" name="email" required />
			</div>
			<div class="space-y-1.5">
				<Label for="password">Password</Label>
				<Input id="password" type="password" name="password" required />
			</div>

			<Button type="submit" class="w-full">Create account</Button>
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
			<a href="/login" class="text-foreground underline underline-offset-4 hover:text-foreground/80"
				>Sign in</a
			>
		</p>
	</div>
</div>
