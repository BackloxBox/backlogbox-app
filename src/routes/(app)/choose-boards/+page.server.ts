import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserProfile } from '$lib/server/db/queries';
import { FREE_LIMITS } from '$lib/server/limits';
import type { MediaType } from '$lib/types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) redirect(302, '/login');

	const profile = await getUserProfile(event.locals.user.id);

	// Already has freeBoards set — go to dashboard
	if (profile?.freeBoards && profile.freeBoards.length > 0) {
		redirect(302, '/dashboard');
	}

	const interests = (profile?.interests as MediaType[] | null) ?? [];

	// If interests fit within the free limit, no interstitial needed
	if (interests.length <= FREE_LIMITS.maxActiveBoards) {
		redirect(302, '/dashboard');
	}

	return { interests, maxActiveBoards: FREE_LIMITS.maxActiveBoards };
};
