import pino from 'pino';
import type { TransportTargetOptions } from 'pino';
import { dev } from '$app/environment';

/**
 * Single structured logger for the entire server.
 *
 * - Dev:  pretty-printed to stdout via pino-pretty
 * - Prod: shipped to Axiom via @axiomhq/pino (when AXIOM_TOKEN is set),
 *         otherwise plain JSON to stdout
 *
 * Usage:
 *   import { log } from '$lib/server/logger';
 *   log.info({ userId, action: 'checkout', cartTotal: 4999 }, 'checkout completed');
 *   log.error({ err, userId, tmdbId }, 'tmdb fetch failed');
 */

function buildTransport(): pino.TransportMultiOptions | undefined {
	const targets: TransportTargetOptions[] = [];

	if (dev) {
		targets.push({
			target: 'pino-pretty',
			options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
			level: 'debug'
		});
	} else if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
		targets.push({
			target: '@axiomhq/pino',
			options: {
				dataset: process.env.AXIOM_DATASET,
				token: process.env.AXIOM_TOKEN
			},
			level: 'info'
		});
	}

	return targets.length > 0 ? { targets } : undefined;
}

const transport = buildTransport();

export const log = pino({
	level: dev ? 'debug' : 'info',
	...(transport ? { transport } : {})
});
