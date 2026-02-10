import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getItemsByTypeAndUser } from '$lib/server/db/queries';
import { slugToMediaType } from '$lib/types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { profileUser } = await parent();
	const type = slugToMediaType(params.type);
	if (!type) {
		error(404, 'Unknown media type');
	}
	const items = await getItemsByTypeAndUser(profileUser.id, type);
	return { items, slug: params.type };
};
