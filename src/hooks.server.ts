import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { log } from '$lib/server/logger';
import { getUserProfile } from '$lib/server/db/queries';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.subscribed = false;

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		const profile = await getUserProfile(session.user.id);
		event.locals.subscribed = profile?.subscribed === true || profile?.freeAccess === true;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

// ---------------------------------------------------------------------------
// Wide event request logging — one structured log per request
// ---------------------------------------------------------------------------

/** Paths to skip (static assets, internal SvelteKit routes) */
const SKIP_PREFIXES = [
	'/_app/',
	'/favicon',
	'/@fs/',
	'/@vite/',
	'/@id/',
	'/__data',
	'/node_modules'
];

const handleRequestLog: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Skip static assets and internal paths
	if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
		return resolve(event);
	}

	const start = performance.now();
	const response = await resolve(event);
	const duration = Math.round(performance.now() - start);

	const wideEvent: Record<string, unknown> = {
		method: event.request.method,
		path: pathname,
		status: response.status,
		duration_ms: duration
	};

	// Add user context if authenticated
	const userId = event.locals.user?.id;
	if (userId) wideEvent.userId = userId;

	if (response.status >= 500) {
		log.error(wideEvent, 'request error');
	} else if (response.status >= 400) {
		log.warn(wideEvent, 'request client error');
	} else if (duration > 2000) {
		log.warn(wideEvent, 'slow request');
	} else {
		log.info(wideEvent, 'request');
	}

	return response;
};

export const handle: Handle = sequence(handleParaglide, handleBetterAuth, handleRequestLog);

// ---------------------------------------------------------------------------
// Unexpected error handler — logs unhandled server errors
// ---------------------------------------------------------------------------

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	log.error(
		{
			err: error,
			errorId,
			status,
			method: event.request.method,
			path: event.url.pathname,
			userId: event.locals.user?.id
		},
		message
	);

	return { message: 'Internal error', errorId };
};
