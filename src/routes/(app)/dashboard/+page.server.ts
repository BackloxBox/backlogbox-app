import type { PageServerLoad } from './$types';
import { getDashboardStats } from '$lib/server/db/queries';
import { getCustomListDashboardStats } from '$lib/server/db/custom-list-queries';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) redirect(302, '/login');

	const [stats, customListStats] = await Promise.all([
		getDashboardStats(user.id),
		getCustomListDashboardStats(user.id)
	]);
	return { stats, customListStats };
};
