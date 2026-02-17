/**
 * Dev-only debug state. Shared across components via module-level $state.
 * In prod builds, importing this is safe — the overlay guards on `dev`.
 */

let enabled = $state(false);

export const debugMode = {
	get enabled() {
		return enabled;
	},
	toggle() {
		enabled = !enabled;
	}
};
