import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import { friendlyAuthError } from '$lib/server/auth-errors';
import { log } from '$lib/server/logger';

/** Resolve post-login redirect, defaulting to /dashboard. Only allows relative paths. */
function safeRedirect(value: string | null | undefined): string {
	if (value && value.startsWith('/') && !value.startsWith('//')) return value;
	return '/dashboard';
}

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(302, safeRedirect(event.url.searchParams.get('redirect')));
	}
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const redirectTo = safeRedirect(formData.get('redirect')?.toString());
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInEmail({
				body: { email, password, callbackURL: redirectTo }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: friendlyAuthError(error, { action: 'signIn', email })
				});
			}
			log.error({ err: error, action: 'signIn', email }, 'login failed (non-APIError)');
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		redirect(302, redirectTo);
	},
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const redirectTo = safeRedirect(formData.get('redirect')?.toString());
		const provider = formData.get('provider')?.toString() ?? 'github';

		try {
			const result = await auth.api.signInSocial({
				body: { provider: provider as 'github', callbackURL: redirectTo }
			});

			if (result.url) {
				redirect(302, result.url);
			}
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: friendlyAuthError(error, { action: 'signInSocial', provider })
				});
			}
			throw error; // re-throw SvelteKit redirects
		}
		return fail(400, { message: 'Social sign-in failed' });
	}
};
