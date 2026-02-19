import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger';

/**
 * Lazy-connecting Redis singleton.
 *
 * Returns `null` when REDIS_URL is not set (dev default) — callers
 * must handle the null case gracefully (fall back to in-memory).
 *
 * ioredis is imported dynamically to avoid bundling it in environments
 * where Redis is not used.
 */

type RedisClient = import('ioredis').default;

let client: RedisClient | null | undefined;
let connecting = false;

export function getRedis(): RedisClient | null {
	if (client !== undefined) return client;
	if (connecting) return null;

	const url = env.REDIS_URL;
	if (!url) {
		log.info('REDIS_URL not set — Redis disabled, using in-memory fallbacks');
		client = null;
		return null;
	}

	connecting = true;

	// Dynamic import keeps ioredis out of the bundle when unused
	import('ioredis')
		.then(({ default: Redis }) => {
			const redis = new Redis(url, {
				maxRetriesPerRequest: 3,
				retryStrategy(times) {
					// Exponential backoff: 50ms, 100ms, 200ms... capped at 2s
					return Math.min(times * 50, 2000);
				},
				lazyConnect: false
			});

			redis.on('connect', () => {
				log.info('Redis connected');
			});

			redis.on('error', (err) => {
				log.warn({ err: err.message }, 'Redis error');
			});

			client = redis;
			connecting = false;
		})
		.catch((err) => {
			log.warn({ err }, 'Failed to load ioredis — Redis disabled');
			client = null;
			connecting = false;
		});

	// Return null for the first call while connecting asynchronously.
	// Subsequent calls will return the connected client.
	return null;
}
