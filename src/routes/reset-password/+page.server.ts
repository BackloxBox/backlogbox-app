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

	const token = event.url.searchParams.get('token');
	const error = event.url.searchParams.get('error');

	return { token, error };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';
		const token = formData.get('token')?.toString() ?? '';

		if (!token) {
			return fail(400, { message: 'Reset token is missing. Please request a new link.' });
		}

		if (!password || password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		try {
			await auth.api.resetPassword({
				body: { newPassword: password, token }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: friendlyAuthError(error, { action: 'resetPassword' })
				});
			}
			log.error({ err: error, action: 'resetPassword' }, 'reset-password failed (non-APIError)');
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		redirect(302, '/login?reset=true');
	}
};
