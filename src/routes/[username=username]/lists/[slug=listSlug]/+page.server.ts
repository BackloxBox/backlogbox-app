import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublicCustomListBySlug, getItemsByList } from '$lib/server/db/custom-list-queries';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { profileUser } = await parent();
	const list = await getPublicCustomListBySlug(profileUser.id, params.slug);
	if (!list) {
		error(404, 'List not found');
	}
	const items = await getItemsByList(list.id);
	return { list, items };
};
