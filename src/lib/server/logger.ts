import pino from 'pino';
import { dev } from '$app/environment';

/**
 * Single structured logger for the entire server.
 *
 * - Dev: pretty-printed to stdout via pino-pretty
 * - Prod: JSON to stdout (pipe to your log aggregator)
 *
 * Usage:
 *   import { log } from '$lib/server/logger';
 *   log.info({ userId, action: 'checkout', cartTotal: 4999 }, 'checkout completed');
 *   log.error({ err, userId, tmdbId }, 'tmdb fetch failed');
 */
export const log = pino({
	level: dev ? 'debug' : 'info',
	...(dev
		? {
				transport: {
					target: 'pino-pretty',
					options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
				}
			}
		: {})
});
