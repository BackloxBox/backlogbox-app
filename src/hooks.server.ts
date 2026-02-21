import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { log } from '$lib/server/logger';
import { getUserProfile } from '$lib/server/db/queries';
import { hasAccess } from '$lib/server/access';

// ---------------------------------------------------------------------------
// Sentry — errors only, no performance tracing. No-op when DSN is unset.
// ---------------------------------------------------------------------------

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		tracesSampleRate: 0
	});
}

// ---------------------------------------------------------------------------
// Admin — HTTP Basic Auth for /admin routes (skipped in dev)
// ---------------------------------------------------------------------------

const handleAdminAuth: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/admin')) return resolve(event);
	if (dev) return resolve(event);

	const adminUser = env.ADMIN_USER;
	const adminPass = env.ADMIN_PASS;
	if (!adminUser || !adminPass) {
		return new Response('Admin credentials not configured', { status: 503 });
	}

	const authHeader = event.request.headers.get('authorization');
	if (authHeader) {
		const [scheme, encoded] = authHeader.split(' ');
		if (scheme === 'Basic' && encoded) {
			const decoded = atob(encoded);
			const [u, p] = decoded.split(':');
			if (u === adminUser && p === adminPass) {
				return resolve(event);
			}
		}
	}

	return new Response('Unauthorized', {
		status: 401,
		headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
	});
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (building) {
		event.locals.subscribed = false;
		event.locals.trialEndsAt = null;
		return resolve(event);
	}

	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.subscribed = false;
	event.locals.trialEndsAt = null;

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		const profile = await getUserProfile(session.user.id);
		if (profile) {
			event.locals.subscribed = hasAccess(profile);
			event.locals.trialEndsAt =
				profile.subscribed || profile.freeAccess ? null : profile.trialEndsAt;
		}
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
	'/node_modules',
	'/healthz'
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

export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	handleAdminAuth,
	handleBetterAuth,
	handleRequestLog
);

// ---------------------------------------------------------------------------
// Unexpected error handler — Sentry captures first, then Pino logs + errorId
// ---------------------------------------------------------------------------

const pinoErrorHandler: HandleServerError = ({ error, event, status, message }) => {
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

export const handleError = Sentry.handleErrorWithSentry(pinoErrorHandler);
