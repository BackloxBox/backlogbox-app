import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import { friendlyAuthError } from '$lib/server/auth-errors';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(302, '/dashboard');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';

		if (!email) {
			return fail(400, { message: 'Email is required' });
		}

		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: '/reset-password' }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: friendlyAuthError(error, { action: 'forgotPassword', email })
				});
			}
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		// Always show success to prevent email enumeration
		return { success: true };
	}
};
