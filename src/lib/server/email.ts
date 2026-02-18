import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { log } from '$lib/server/logger';

/** Lazy-initialised Resend client — avoids crashing during SvelteKit postbuild analysis. */
let _resend: Resend | undefined;
function resend(): Resend {
	return (_resend ??= new Resend(env.RESEND_API_KEY));
}

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
}

/**
 * Send a transactional email via Resend.
 * Logs errors but never throws — callers should fire-and-forget with `void`.
 * No-ops during SvelteKit build.
 * Logs to console when RESEND_API_KEY is unset (local dev).
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
	if (building) return;

	if (!env.RESEND_API_KEY) {
		log.info({ to, subject }, 'email (dev mode, not sent)');
		log.debug({ html }, 'email html body');
		return;
	}

	const from = env.EMAIL_FROM ?? 'BacklogBox <noreply@backlogbox.com>';

	const { error } = await resend().emails.send({ from, to: [to], subject, html });

	if (error) {
		log.error({ error, to, subject }, 'email send failed');
	}
}
