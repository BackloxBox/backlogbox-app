import type { ParamMatcher } from '@sveltejs/kit';

/** Matches URL-safe list slugs: lowercase alphanumeric + hyphens, 1-64 chars */
const LIST_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const match: ParamMatcher = (param) => LIST_SLUG_RE.test(param);
