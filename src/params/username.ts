import type { ParamMatcher } from '@sveltejs/kit';

/** Matches `@lowercase-alphanumeric` usernames, 1-39 chars after the @ */
const USERNAME_RE = /^@[a-z0-9]{1,39}$/;

export const match: ParamMatcher = (param) => USERNAME_RE.test(param);
