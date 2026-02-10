import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserProfile, updateUserProfile } from '$lib/server/db/queries';
import { auth } from '$lib/server/auth';

const USERNAME_RE = /^[a-z0-9]{1,39}$/;

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
		const username = formData.get('username')?.toString().trim().toLowerCase() ?? '';
		const profilePublic = formData.get('profilePublic') === 'on';

		if (!name) {
			return fail(400, { profileMessage: 'Name is required' });
		}

		if (username && !USERNAME_RE.test(username)) {
			return fail(400, {
				profileMessage: 'Username must be lowercase alphanumeric, 1-39 characters'
			});
		}

		try {
			await updateUserProfile(user.id, {
				name,
				username: username || null,
				profilePublic: username ? profilePublic : false
			});
		} catch (err) {
			if (err instanceof Error && err.message.includes('unique')) {
				return fail(400, { profileMessage: 'Username is already taken' });
			}
			return fail(500, { profileMessage: 'Failed to update profile' });
		}

		// Also update name in BetterAuth's user record
		try {
			await auth.api.updateUser({ body: { name }, headers: event.request.headers });
		} catch {
			// Non-critical — BetterAuth name is secondary to our DB
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
		} catch {
			return fail(400, { passwordMessage: 'Current password is incorrect' });
		}

		return { passwordMessage: 'Password updated', passwordSuccess: true };
	}
};
