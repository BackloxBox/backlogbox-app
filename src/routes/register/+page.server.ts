import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import { friendlyAuthError } from '$lib/server/auth-errors';
import { log } from '$lib/server/logger';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(302, '/dashboard');
	}
};

export const actions: Actions = {
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const username = formData.get('username')?.toString().trim().toLowerCase() ?? '';

		if (!username) {
			return fail(400, { message: 'Username is required' });
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name, username, callbackURL: '/dashboard' }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: friendlyAuthError(error, { action: 'signUp', email, username })
				});
			}
			log.error({ err: error, action: 'signUp', email, username }, 'signup failed (non-APIError)');
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		// With requireEmailVerification, no session is created.
		// Return success so the page can show a "check your email" state.
		return { success: true, email };
	},
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() ?? 'github';

		const result = await auth.api.signInSocial({
			body: { provider: provider as 'github', callbackURL: '/dashboard' }
		});

		if (result.url) {
			redirect(302, result.url);
		}
		return fail(400, { message: 'Social sign-in failed' });
	}
};
