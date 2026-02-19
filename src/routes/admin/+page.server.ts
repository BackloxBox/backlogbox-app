import type { PageServerLoad } from './$types';
import { getAdminStats } from '$lib/server/db/admin-queries';
import { getApiMetrics } from '$lib/server/search/metrics';

/** Max hours of metrics data we fetch (Redis buckets expire after 30d, but 7d is enough) */
const METRICS_HOURS = 7 * 24;

export const load: PageServerLoad = async () => {
	const [stats, apiMetrics] = await Promise.all([getAdminStats(), getApiMetrics(METRICS_HOURS)]);

	return { stats, apiMetrics };
};
