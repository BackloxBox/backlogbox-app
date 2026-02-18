import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUserProfile } from '$lib/server/db/queries';
import { getCustomListsByUser } from '$lib/server/db/custom-list-queries';
import { trialDaysRemaining } from '$lib/server/access';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(302, '/login');
	}
	if (!event.locals.subscribed) {
		redirect(302, '/subscribe');
	}
	const [profile, customLists] = await Promise.all([
		getUserProfile(event.locals.user.id),
		getCustomListsByUser(event.locals.user.id)
	]);
	return {
		user: event.locals.user,
		profile: profile ?? null,
		customLists,
		trialDaysLeft: trialDaysRemaining(event.locals.trialEndsAt)
	};
};
