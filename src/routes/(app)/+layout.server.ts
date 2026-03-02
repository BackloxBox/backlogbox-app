import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUserProfile, getItemCountsByType } from '$lib/server/db/queries';
import {
	getCustomListsByUser,
	getTotalCustomListItemCount
} from '$lib/server/db/custom-list-queries';
import { trialDaysRemaining, needsBoardSelection } from '$lib/server/access';
import { FREE_LIMITS } from '$lib/server/limits';
import type { MediaType } from '$lib/types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(302, '/login');
	}

	// Soft-deleted users have accessLevel 'none' — redirect to /subscribe
	if (event.locals.accessLevel === 'none') {
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

	const accessLevel = event.locals.accessLevel;

	// Free users with >N interests who haven't picked their free boards yet → interstitial
	if (
		needsBoardSelection(
			accessLevel,
			profile?.freeBoards ?? null,
			profile?.interests ?? null,
			FREE_LIMITS.maxActiveBoards
		) &&
		!event.url.pathname.startsWith('/choose-boards')
	) {
		redirect(302, '/choose-boards');
	}

	const freeBoards =
		(profile?.freeBoards as MediaType[] | null) ?? (profile?.interests as MediaType[] | null);

	return {
		user: event.locals.user,
		profile: profile ?? null,
		customLists,
		itemCounts,
		customListItemCount,
		interests: profile?.interests ?? [],
		accessLevel,
		freeBoards: freeBoards ?? [],
		trialDaysLeft: trialDaysRemaining(event.locals.trialEndsAt)
	};
};
