<script lang="ts">
	import { onMount } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import Share from '@lucide/svelte/icons/share';

	const STORAGE_KEY = 'pwa-ios-hint-dismissed';

	let visible = $state(false);

	onMount(() => {
		const ua = navigator.userAgent;
		const isIos =
			/iPad|iPhone|iPod/.test(ua) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
		const isStandalone =
			'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true;
		const dismissed = localStorage.getItem(STORAGE_KEY) === '1';

		if (isIos && isSafari && !isStandalone && !dismissed) {
			visible = true;
			setTimeout(() => (visible = false), 15_000);
		}
	});

	function dismiss() {
		visible = false;
		localStorage.setItem(STORAGE_KEY, '1');
	}
</script>

{#if visible}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg"
	>
		<div class="flex-1 text-sm">
			<p class="font-medium">Install BacklogBox</p>
			<p class="mt-1 text-muted-foreground">
				Tap <Share class="mb-0.5 inline size-4" /> then
				<span class="font-medium">"Add to Home Screen"</span>
			</p>
		</div>
		<button onclick={dismiss} class="shrink-0 text-muted-foreground hover:text-foreground">
			<X class="size-4" />
		</button>
	</div>
{/if}
