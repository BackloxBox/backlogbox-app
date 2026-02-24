import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserProfile, updateUserProfile } from '$lib/server/db/queries';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import { friendlyAuthError } from '$lib/server/auth-errors';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	const profile = await getUserProfile(user.id);
	return { profile };
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { profileMessage: 'Not authenticated' });

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const newUsername = formData.get('username')?.toString().trim() ?? '';
		const profilePublic = formData.get('profilePublic') === 'on';

		if (!name) {
			return fail(400, { profileMessage: 'Name is required' });
		}

		const profile = await getUserProfile(user.id);
		const hasUsername = !!profile?.username;

		// Only allow setting username if user doesn't have one yet
		const usernameToSet = !hasUsername && newUsername ? newUsername : undefined;

		if (usernameToSet !== undefined) {
			try {
				// Route through Better Auth so the username plugin validates
				await auth.api.updateUser({
					body: { name, username: usernameToSet },
					headers: event.request.headers
				});
			} catch (error) {
				const message =
					error instanceof APIError
						? friendlyAuthError(error, { action: 'updateProfile' })
						: 'Invalid username';
				return fail(400, { profileMessage: message });
			}
		} else {
			try {
				await auth.api.updateUser({ body: { name }, headers: event.request.headers });
			} catch {
				// Non-critical — BetterAuth name is secondary to our DB
			}
		}

		try {
			await updateUserProfile(user.id, {
				name,
				...(usernameToSet !== undefined ? { username: usernameToSet } : {}),
				profilePublic: hasUsername || usernameToSet !== undefined ? profilePublic : false
			});
		} catch {
			return fail(500, { profileMessage: 'Failed to update profile' });
		}

		return { profileMessage: 'Profile updated', profileSuccess: true };
	},

	changePassword: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { passwordMessage: 'Not authenticated' });

		const formData = await event.request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';

		if (!currentPassword || !newPassword) {
			return fail(400, { passwordMessage: 'Both fields are required' });
		}

		if (newPassword.length < 8) {
			return fail(400, { passwordMessage: 'New password must be at least 8 characters' });
		}

		try {
			await auth.api.changePassword({
				body: { currentPassword, newPassword },
				headers: event.request.headers
			});
		} catch (error) {
			const message =
				error instanceof APIError
					? friendlyAuthError(error, { action: 'changePassword' })
					: 'Failed to update password. Please try again.';
			return fail(400, { passwordMessage: message });
		}

		return { passwordMessage: 'Password updated', passwordSuccess: true };
	}
};
