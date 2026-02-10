import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getPublicUserByUsername } from '$lib/server/db/queries';

export const load: LayoutServerLoad = async ({ params }) => {
	const username = params.username.slice(1); // strip leading @
	const profileUser = await getPublicUserByUsername(username);
	if (!profileUser) {
		error(404, 'User not found');
	}
	return { profileUser };
};
