import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { trialDaysRemaining } from '$lib/server/access';

export const load: PageServerLoad = async (event) => {
	const trialDaysLeft = trialDaysRemaining(event.locals.trialEndsAt);
	const trialActive = trialDaysLeft !== null && trialDaysLeft > 0;

	// Redirect paid subscribers, but let trial users see the page
	if (event.locals.subscribed && !trialActive) {
		redirect(302, '/dashboard');
	}

	return { trialDaysLeft };
};
