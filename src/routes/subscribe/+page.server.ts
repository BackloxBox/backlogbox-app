import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { trialDaysRemaining } from '$lib/server/access';

export const load: PageServerLoad = async (event) => {
	if (event.locals.subscribed) {
		redirect(302, '/dashboard');
	}

	return {
		trialDaysLeft: trialDaysRemaining(event.locals.trialEndsAt)
	};
};
