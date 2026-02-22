import { awaitRedis, getRedis } from '$lib/server/redis';
import { log } from '$lib/server/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDERS = ['tmdb', 'igdb', 'openlibrary', 'apple'] as const;
export type Provider = (typeof PROVIDERS)[number];

/** Metrics keys auto-expire after 30 days */
const EXPIRE_SECONDS = 30 * 24 * 60 * 60;

/** Hash fields stored per hourly bucket */
type BucketFields = {
	cached: number;
	uncached: number;
	errors: number;
	latency_sum: number;
	latency_count: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Current hour bucket key, e.g. "metrics:tmdb:2026-02-19T14" */
function bucketKey(provider: string): string {
	const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
	return `metrics:${provider}:${hour}`;
}

/**
 * Fire-and-forget HINCRBY. Silently fails if Redis is unavailable.
 * Sets expiry on first write to a key.
 */
function incr(key: string, field: string, amount: number): void {
	const redis = getRedis();
	if (!redis) return;

	redis
		.pipeline()
		.hincrby(key, field, amount)
		.expire(key, EXPIRE_SECONDS)
		.exec()
		.catch((err) => {
			log.debug(
				{ err: err instanceof Error ? err.message : err, key, field },
				'metrics incr failed'
			);
		});
}

// ---------------------------------------------------------------------------
// Recording API (fire-and-forget — no await needed)
// ---------------------------------------------------------------------------

/** Record a cache hit (fresh or stale) for a provider */
export function recordCacheHit(provider: string): void {
	incr(bucketKey(provider), 'cached', 1);
}

/** Record an external API call with its latency */
export function recordApiCall(provider: string, latencyMs: number): void {
	const key = bucketKey(provider);
	const redis = getRedis();
	if (!redis) return;

	redis
		.pipeline()
		.hincrby(key, 'uncached', 1)
		.hincrby(key, 'latency_sum', Math.round(latencyMs))
		.hincrby(key, 'latency_count', 1)
		.expire(key, EXPIRE_SECONDS)
		.exec()
		.catch((err) => {
			log.debug({ err: err instanceof Error ? err.message : err, key }, 'metrics api call failed');
		});
}

/** Record a fetch error for a provider */
export function recordApiError(provider: string): void {
	incr(bucketKey(provider), 'errors', 1);
}

// ---------------------------------------------------------------------------
// Querying API (for admin dashboard)
// ---------------------------------------------------------------------------

export interface ProviderMetrics {
	cached: number;
	uncached: number;
	errors: number;
	avgLatencyMs: number;
	hitRate: string;
	/** Calls per hour / minute / second (based on query window) */
	callsPerHour: number;
	callsPerMinute: number;
	callsPerSecond: number;
}

export interface HourlyDataPoint {
	hour: string;
	tmdb: number;
	igdb: number;
	openlibrary: number;
	apple: number;
}

export interface ApiMetricsSummary {
	providers: Record<Provider, ProviderMetrics>;
	totals: ProviderMetrics & { totalCallsPerHour: number };
	/** Hourly uncached call counts, sorted chronologically */
	hourly: HourlyDataPoint[];
	/** Hourly cached hit counts, sorted chronologically */
	hourlyCached: HourlyDataPoint[];
	/** Hourly error counts, sorted chronologically */
	hourlyErrors: HourlyDataPoint[];
}

/** Generate hour keys for the last N hours */
function hourKeys(hours: number): string[] {
	const keys: string[] = [];
	const now = Date.now();
	for (let i = 0; i < hours; i++) {
		const d = new Date(now - i * 60 * 60 * 1000);
		keys.push(d.toISOString().slice(0, 13));
	}
	return keys;
}

function emptyBucket(): BucketFields {
	return { cached: 0, uncached: 0, errors: 0, latency_sum: 0, latency_count: 0 };
}

function toProviderMetrics(b: BucketFields, hours: number): ProviderMetrics {
	const total = b.cached + b.uncached;
	const totalSeconds = hours * 3600;
	return {
		cached: b.cached,
		uncached: b.uncached,
		errors: b.errors,
		avgLatencyMs: b.latency_count > 0 ? Math.round(b.latency_sum / b.latency_count) : 0,
		hitRate: total > 0 ? `${Math.round((b.cached / total) * 100)}%` : '0%',
		callsPerHour: hours > 0 ? Math.round((total / hours) * 10) / 10 : 0,
		callsPerMinute: hours > 0 ? Math.round((total / (hours * 60)) * 100) / 100 : 0,
		callsPerSecond: totalSeconds > 0 ? Math.round((total / totalSeconds) * 1000) / 1000 : 0
	};
}

/**
 * Fetch aggregated metrics for the last N hours.
 * Returns null if Redis is unavailable.
 */
export async function getApiMetrics(hours: number): Promise<ApiMetricsSummary | null> {
	const redis = await awaitRedis();
	if (!redis) return null;

	const hourSlots = hourKeys(hours);

	// Build pipeline: for each provider × hour, HGETALL the bucket
	const pipeline = redis.pipeline();
	for (const provider of PROVIDERS) {
		for (const hour of hourSlots) {
			pipeline.hgetall(`metrics:${provider}:${hour}`);
		}
	}

	const rawResults = await pipeline.exec();
	if (!rawResults) return null;

	// Parse results: grouped by provider, with per-hour breakdown
	const providerTotals: Record<Provider, BucketFields> = {
		tmdb: emptyBucket(),
		igdb: emptyBucket(),
		openlibrary: emptyBucket(),
		apple: emptyBucket()
	};

	// Per-hour counts for charts
	const emptyHourRow = (): Record<Provider, number> => ({
		tmdb: 0,
		igdb: 0,
		openlibrary: 0,
		apple: 0
	});
	const hourlyUncachedMap = new Map<string, Record<Provider, number>>();
	const hourlyCachedMap = new Map<string, Record<Provider, number>>();
	const hourlyErrorsMap = new Map<string, Record<Provider, number>>();
	for (const hour of hourSlots) {
		hourlyUncachedMap.set(hour, emptyHourRow());
		hourlyCachedMap.set(hour, emptyHourRow());
		hourlyErrorsMap.set(hour, emptyHourRow());
	}

	let idx = 0;
	for (const provider of PROVIDERS) {
		for (const hour of hourSlots) {
			const [err, data] = rawResults[idx] ?? [null, null];
			idx++;

			if (err || !data || typeof data !== 'object') continue;

			const d = data as Record<string, string>;
			const cached = parseInt(d.cached ?? '0', 10);
			const uncached = parseInt(d.uncached ?? '0', 10);
			const errors = parseInt(d.errors ?? '0', 10);
			const latencySum = parseInt(d.latency_sum ?? '0', 10);
			const latencyCount = parseInt(d.latency_count ?? '0', 10);

			const pt = providerTotals[provider];
			pt.cached += cached;
			pt.uncached += uncached;
			pt.errors += errors;
			pt.latency_sum += latencySum;
			pt.latency_count += latencyCount;

			const uncachedEntry = hourlyUncachedMap.get(hour);
			if (uncachedEntry) uncachedEntry[provider] = uncached;
			const cachedEntry = hourlyCachedMap.get(hour);
			if (cachedEntry) cachedEntry[provider] = cached;
			const errorsEntry = hourlyErrorsMap.get(hour);
			if (errorsEntry) errorsEntry[provider] = errors;
		}
	}

	// Compute totals
	const totalBucket = emptyBucket();
	for (const provider of PROVIDERS) {
		const pt = providerTotals[provider];
		totalBucket.cached += pt.cached;
		totalBucket.uncached += pt.uncached;
		totalBucket.errors += pt.errors;
		totalBucket.latency_sum += pt.latency_sum;
		totalBucket.latency_count += pt.latency_count;
	}

	const totals = {
		...toProviderMetrics(totalBucket, hours),
		totalCallsPerHour:
			hours > 0 ? Math.round(((totalBucket.cached + totalBucket.uncached) / hours) * 10) / 10 : 0
	};

	const defaultRow = { tmdb: 0, igdb: 0, openlibrary: 0, apple: 0 };

	// Build hourly arrays sorted chronologically (oldest first)
	const hourly: HourlyDataPoint[] = hourSlots
		.map((hour) => ({ hour, ...(hourlyUncachedMap.get(hour) ?? defaultRow) }))
		.reverse();

	const hourlyCached: HourlyDataPoint[] = hourSlots
		.map((hour) => ({ hour, ...(hourlyCachedMap.get(hour) ?? defaultRow) }))
		.reverse();

	const hourlyErrors: HourlyDataPoint[] = hourSlots
		.map((hour) => ({ hour, ...(hourlyErrorsMap.get(hour) ?? defaultRow) }))
		.reverse();

	return {
		providers: Object.fromEntries(
			PROVIDERS.map((p) => [p, toProviderMetrics(providerTotals[p], hours)])
		) as Record<Provider, ProviderMetrics>,
		totals,
		hourly,
		hourlyCached,
		hourlyErrors
	};
}
