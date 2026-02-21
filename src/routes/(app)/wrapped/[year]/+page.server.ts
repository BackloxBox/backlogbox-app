import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWrappedStats } from '$lib/server/db/queries';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) redirect(302, '/login');

	const yearParam = Number(event.params.year);
	if (!Number.isFinite(yearParam) || yearParam < 2020 || yearParam > 2100) {
		redirect(302, '/dashboard');
	}

	// Gate: only available Dec 1 – Jan 31 (or always in dev)
	const now = new Date();
	const month = now.getMonth(); // 0-indexed
	if (!dev) {
		const isDecember = month === 11;
		const isJanuary = month === 0;
		if (!isDecember && !isJanuary) {
			redirect(302, '/dashboard');
		}
		// In December, only allow current year. In January, only allow previous year.
		if (isDecember && yearParam !== now.getFullYear()) {
			redirect(302, `/wrapped/${now.getFullYear()}`);
		}
		if (isJanuary && yearParam !== now.getFullYear() - 1) {
			redirect(302, `/wrapped/${now.getFullYear() - 1}`);
		}
	}

	const stats = await getWrappedStats(user.id, yearParam);
	return { stats };
};
