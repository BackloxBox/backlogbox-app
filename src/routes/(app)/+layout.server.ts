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
	return {
		user: event.locals.user,
		profile: profile ?? null,
		customLists,
		itemCounts,
		customListItemCount,
		trialDaysLeft: trialDaysRemaining(event.locals.trialEndsAt)
	};
};
