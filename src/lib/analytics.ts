import posthog from 'posthog-js';
import { browser } from '$app/environment';

let initialized = false;

/**
 * Initialize PostHog web analytics. No-ops if not in browser or key is unset.
 *
 * Uses `defaults: '2026-01-30'` which enables:
 * - `capture_pageview: 'history_change'` (auto SPA pageview tracking)
 * - `capture_pageleave: true`
 * - `external_scripts_inject_target: 'head'` (avoids SSR hydration errors)
 */
export function initPostHog(key: string | undefined, host: string | undefined): void {
	if (!browser || !key || initialized) return;

	posthog.init(key, {
		api_host: host ?? 'https://eu.i.posthog.com',
		defaults: '2026-01-30',
		disable_session_recording: true,
		persistence: 'localStorage+cookie'
	});

	initialized = true;
}

/** Identify an authenticated user. */
export function identifyUser(id: string, props: { name?: string; email?: string }): void {
	if (!initialized) return;
	posthog.identify(id, props);
}

/** Reset identity on sign-out. */
export function resetUser(): void {
	if (!initialized) return;
	posthog.reset();
}
