<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950 px-4">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-white">BacklogBox</h1>
			<p class="mt-1 text-sm text-gray-400">Track your books, movies, series, games & podcasts</p>
		</div>

		<form method="post" action="?/signInEmail" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-300">Email</label>
				<input
					id="email"
					type="email"
					name="email"
					required
					class="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-300">Password</label>
				<input
					id="password"
					type="password"
					name="password"
					required
					class="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>
			<div>
				<label for="name" class="block text-sm font-medium text-gray-300"
					>Name <span class="text-gray-500">(registration only)</span></label
				>
				<input
					id="name"
					name="name"
					class="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				/>
			</div>

			<div class="flex gap-3">
				<button
					class="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
					>Sign in</button
				>
				<button
					formaction="?/signUpEmail"
					class="flex-1 rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
					>Register</button
				>
			</div>
		</form>

		{#if form?.message}
			<p class="text-center text-sm text-red-400">{form.message}</p>
		{/if}

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-700"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-gray-950 px-2 text-gray-500">or</span>
			</div>
		</div>

		<form method="post" action="?/signInSocial" use:enhance>
			<input type="hidden" name="provider" value="github" />
			<button
				class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
			>
				Sign in with GitHub
			</button>
		</form>
	</div>
</div>
