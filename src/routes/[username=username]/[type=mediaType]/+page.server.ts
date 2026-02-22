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
	const raw = await getItemsByTypeAndUser(profileUser.id, type);
	// Strip private fields for public profiles.
	// The `notes` property is an intersection type (column `string | null` & relation `mediaNote[]`)
	// caused by a Drizzle column/relation name collision. Stripping via destructure + re-spread
	// produces an incompatible type, so we mutate in-place before serialization instead.
	for (const item of raw) {
		item.rating = null;
		// notes (relation): clear the array so note content is not leaked
		if (Array.isArray(item.notes)) {
			item.notes.length = 0;
		}
	}
	return { items: raw, slug: params.type };
};
