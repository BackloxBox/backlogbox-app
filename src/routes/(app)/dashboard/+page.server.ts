import type { PageServerLoad } from './$types';
import { getDashboardStats } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) redirect(302, '/login');

	const stats = await getDashboardStats(user.id);
	return { stats };
};
