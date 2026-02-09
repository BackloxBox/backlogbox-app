import { MEDIA_TYPE_SLUGS } from '$lib/types';
import type { ParamMatcher } from '@sveltejs/kit';

const validSlugs: ReadonlySet<string> = new Set(MEDIA_TYPE_SLUGS);

export const match: ParamMatcher = (param) => validSlugs.has(param);
