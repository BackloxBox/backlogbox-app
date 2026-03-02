import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUserProfile, getItemCountsByType } from '$lib/server/db/queries';
import {
	getCustomListsByUser,
	getTotalCustomListItemCount
} from '$lib/server/db/custom-list-queries';
import { trialDaysRemaining } from '$lib/server/access';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(302, '/login');
	}
	if (!event.locals.subscribed) {
		redirect(302, '/subscribe');
	}
	const userId = event.locals.user.id;
	const [profile, customLists, itemCounts, customListItemCount] = await Promise.all([
		getUserProfile(userId),
		getCustomListsByUser(userId),
		getItemCountsByType(userId),
		getTotalCustomListItemCount(userId)
	]);

	// Redirect to onboarding if not completed (but don't redirect-loop on /onboarding itself)
	const needsOnboarding = !profile?.onboardingCompletedAt;
	if (needsOnboarding && !event.url.pathname.startsWith('/onboarding')) {
		redirect(302, '/onboarding');
	}

	return {
		user: event.locals.user,
		profile: profile ?? null,
		customLists,
		itemCounts,
		customListItemCount,
		interests: profile?.interests ?? [],
		trialDaysLeft: trialDaysRemaining(event.locals.trialEndsAt)
	};
};
