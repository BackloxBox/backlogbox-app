import { isHttpError } from '@sveltejs/kit';
import { goto } from '$app/navigation';

/**
 * Check if an error is a 403 subscription-required response.
 * If so, redirect to /subscribe. Returns true if redirected.
 */
export function handleSubscriptionError(err: unknown): boolean {
	if (isHttpError(err, 403)) {
		goto('/subscribe');
		return true;
	}
	return false;
}
