import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUserProfile } from '$lib/server/db/queries';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(302, '/login');
	}
	if (!event.locals.subscribed) {
		redirect(302, '/subscribe');
	}
	const profile = await getUserProfile(event.locals.user.id);
	return {
		user: event.locals.user,
		profile: profile ?? null
	};
};
