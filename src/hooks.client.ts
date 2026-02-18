import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';

if (env.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: env.PUBLIC_SENTRY_DSN,
		tracesSampleRate: 0,
		beforeSend(event) {
			// Don't report stale chunk errors — they self-heal via reload
			if (event.exception?.values?.some((v) => isStaleChunkError(v.value ?? ''))) {
				return null;
			}
			return event;
		}
	});
}

const RELOAD_KEY = 'sveltekit:stale-chunk-reload';

/** Matches module/chunk load failures caused by stale deploys */
function isStaleChunkError(message: string): boolean {
	return (
		message.includes('Failed to fetch dynamically imported module') ||
		message.includes('Importing a module script failed') ||
		message.includes('error loading dynamically imported module')
	);
}

/**
 * On stale-deploy chunk failures: reload once to get fresh HTML with
 * current chunk hashes. SessionStorage flag prevents infinite loops.
 */
function handleStaleChunk(): void {
	const lastReload = sessionStorage.getItem(RELOAD_KEY);
	const now = Date.now();

	// Allow one reload per 10 seconds to prevent loops
	if (lastReload && now - Number(lastReload) < 10_000) return;

	sessionStorage.setItem(RELOAD_KEY, String(now));
	location.reload();
}

const handleStaleChunkError: HandleClientError = ({ error }) => {
	const message = error instanceof Error ? error.message : String(error);
	if (isStaleChunkError(message)) {
		handleStaleChunk();
	}
};

export const handleError = Sentry.handleErrorWithSentry(handleStaleChunkError);
