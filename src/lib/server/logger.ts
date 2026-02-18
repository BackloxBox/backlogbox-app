import pino from 'pino';
import { dev } from '$app/environment';

/**
 * Single structured logger for the entire server.
 *
 * - Dev:  pretty-printed via pino-pretty transport
 * - Prod: JSON to stdout + Axiom via @axiomhq/pino transport (when configured)
 *
 * pino, pino-pretty, and @axiomhq/pino must be in `dependencies` (not
 * devDependencies) so adapter-node keeps them external. If bundled by Vite,
 * pino's worker threads crash with `__dirname is not defined` in ESM.
 * See https://github.com/sveltejs/kit/discussions/7663
 *
 * Usage:
 *   import { log } from '$lib/server/logger';
 *   log.info({ userId, action: 'checkout', cartTotal: 4999 }, 'checkout completed');
 *   log.error({ err, userId, tmdbId }, 'tmdb fetch failed');
 */

function createLogger(): pino.Logger {
	if (dev) {
		return pino({
			level: 'debug',
			transport: {
				target: 'pino-pretty',
				options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
			}
		});
	}

	// Production: always stdout. Axiom as additional destination when configured.
	const targets: pino.TransportTargetOptions[] = [
		{ target: 'pino/file', options: { destination: 1 } } // fd 1 = stdout
	];

	if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
		targets.push({
			target: '@axiomhq/pino',
			options: {
				dataset: process.env.AXIOM_DATASET,
				token: process.env.AXIOM_TOKEN,
				url: 'https://api.eu.axiom.co'
			}
		});
	}

	return pino({ level: 'info' }, pino.transport({ targets }));
}

export const log = createLogger();
