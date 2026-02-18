/**
 * Cleanup script for expired trial users.
 *
 * Run daily via cron on the manager node:
 *   0 3 * * * docker exec $(docker ps -q -f name=backlogbox_app -f status=running | head -1) node scripts/cleanup-expired-trials.mjs
 *
 * Two actions:
 * 1. Users 83 days post-trial-expiry: send warning email (data deleted in 7 days)
 * 2. Users 90 days post-trial-expiry: soft-delete (set deleted_at)
 *
 * Requires: DATABASE_URL, RESEND_API_KEY, EMAIL_FROM (from Docker secrets via entrypoint)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, isNull, lt, gte, isNotNull } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? 'BacklogBox <noreply@backlogbox.com>';
const appUrl = process.env.BETTER_AUTH_URL ?? 'https://backlogbox.com';

// ---------------------------------------------------------------------------
// Minimal schema (avoid importing SvelteKit modules)
// ---------------------------------------------------------------------------

const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	subscribed: boolean('subscribed').default(false).notNull(),
	freeAccess: boolean('free_access').default(false).notNull(),
	trialEndsAt: timestamp('trial_ends_at'),
	deletedAt: timestamp('deleted_at')
});

// ---------------------------------------------------------------------------
// DB + Resend
// ---------------------------------------------------------------------------

const client = postgres(url, { max: 1 });
const db = drizzle(client);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function daysAgo(days) {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
	const now = new Date();
	console.log(`[cleanup] starting at ${now.toISOString()}`);

	// Users whose trial expired ~83 days ago (warn: 7 days until deletion)
	// Window: trial_ends_at between (now - 84 days) and (now - 83 days)
	const warnWindowStart = daysAgo(84);
	const warnWindowEnd = daysAgo(83);

	const warnUsers = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				isNotNull(user.trialEndsAt),
				gte(user.trialEndsAt, warnWindowStart),
				lt(user.trialEndsAt, warnWindowEnd),
				isNull(user.deletedAt),
				eq(user.subscribed, false),
				eq(user.freeAccess, false)
			)
		);

	console.log(`[cleanup] ${warnUsers.length} users to warn`);

	if (resend && warnUsers.length > 0) {
		for (const u of warnUsers) {
			try {
				await resend.emails.send({
					from: emailFrom,
					to: [u.email],
					subject: 'Your BacklogBox data will be deleted in 7 days',
					html: `<p>Hey ${u.name},</p><p>Your free trial ended a while ago, and your BacklogBox data will be permanently deleted in <strong>7 days</strong>.</p><p><a href="${appUrl}/subscribe">Subscribe now</a> to keep everything.</p>`
				});
				console.log(`[cleanup] warned ${u.email}`);
			} catch (err) {
				console.error(`[cleanup] failed to warn ${u.email}:`, err);
			}
		}
	}

	// Users whose trial expired 90+ days ago — soft delete
	const deleteCutoff = daysAgo(90);

	const deleteResult = await db
		.update(user)
		.set({ deletedAt: now })
		.where(
			and(
				isNotNull(user.trialEndsAt),
				lt(user.trialEndsAt, deleteCutoff),
				isNull(user.deletedAt),
				eq(user.subscribed, false),
				eq(user.freeAccess, false)
			)
		)
		.returning({ id: user.id, email: user.email });

	console.log(`[cleanup] soft-deleted ${deleteResult.length} users`);
	for (const u of deleteResult) {
		console.log(`[cleanup]   - ${u.email} (${u.id})`);
	}

	console.log('[cleanup] done');
} finally {
	await client.end();
}
