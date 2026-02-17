import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
}

/**
 * Send a transactional email via Resend.
 * Logs errors but never throws — callers should fire-and-forget with `void`.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
	const from = env.EMAIL_FROM ?? 'BacklogBox <noreply@backlogbox.com>';

	const { error } = await resend.emails.send({ from, to: [to], subject, html });

	if (error) {
		log.error({ error, to, subject }, 'email send failed');
	}
}
