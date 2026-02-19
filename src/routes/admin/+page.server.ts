import type { PageServerLoad } from './$types';
import { getAdminStats } from '$lib/server/db/admin-queries';

export const load: PageServerLoad = async () => {
	const stats = await getAdminStats();
	return { stats };
};
