/**
 * Lifecycle script for trial users and unverified accounts.
 *
 * Run daily via cron on the manager node:
 *   0 3 * * * docker exec $(docker ps -q -f name=backlogbox_app -f status=running | head -1) node scripts/cleanup-expired-trials.mjs
 *
 * Actions (in chronological order from signup):
 * 1. Unverified accounts 24h+ old: hard-delete (no data, never activated)
 * 2. Day-3 check-in: activation nudge (3 days into trial)
 * 3. Trial ending soon: 3 days before trial expires
 * 4. Trial ended: day trial expires
 * 5. Win-back: 7 days post-trial-expiry
 * 6. Data deletion warning: 83 days post-trial-expiry (7 days until deletion)
 * 7. Soft-delete: 90 days post-trial-expiry
 *
 * Requires: DATABASE_URL, RESEND_API_KEY, EMAIL_FROM (from Docker secrets via entrypoint)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, isNull, lt, gte, isNotNull, inArray } from 'drizzle-orm';
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
const replyTo = 'yorick@backlogbox.com';
const appUrl = process.env.BETTER_AUTH_URL ?? 'https://backlogbox.com';

// ---------------------------------------------------------------------------
// Minimal schema (avoid importing SvelteKit modules)
// ---------------------------------------------------------------------------

const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	subscribed: boolean('subscribed').default(false).notNull(),
	freeAccess: boolean('free_access').default(false).notNull(),
	trialEndsAt: timestamp('trial_ends_at'),
	deletedAt: timestamp('deleted_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull()
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

function daysFromNow(days) {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

// ---------------------------------------------------------------------------
// Email base template (mirrors src/lib/server/email-templates.ts)
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#18181b';
const BUTTON_COLOR = '#18181b';
const BUTTON_TEXT = '#ffffff';
const TEXT_COLOR = '#27272a';
const MUTED_COLOR = '#71717a';
const BG_COLOR = '#f4f4f5';
const CARD_BG = '#ffffff';
const FONT_STACK =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function baseTemplate({ preheader, heading, body, buttonText, buttonUrl, footer }) {
	const defaultFooter =
		'You received this email because you have an account on BacklogBox.<br>If you didn&rsquo;t request this, you can safely ignore it.';

	return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${heading}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #18181b !important; }
      .email-card { background-color: #27272a !important; }
      .email-text { color: #e4e4e7 !important; }
      .email-muted { color: #a1a1aa !important; }
      .email-heading { color: #fafafa !important; }
      .email-btn td { background-color: #fafafa !important; }
      .email-btn a { color: #18181b !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preheader (hidden inbox preview text) -->
  <div style="display:none;font-size:1px;color:${BG_COLOR};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}${'&#847; &zwnj; &nbsp; '.repeat(20)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <img src="https://backlogbox.com/backlogbox-logo.svg" alt="BacklogBox" width="28" height="28" style="display:inline-block;vertical-align:middle;border:0;" />
              <span class="email-heading" style="font-family:${FONT_STACK};font-size:20px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.5px;vertical-align:middle;padding-left:8px;">
                BacklogBox
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background-color:${CARD_BG};border-radius:12px;">
                <tr>
                  <td class="email-padding" style="padding:40px 48px;">
                    <h1 class="email-heading" style="margin:0 0 16px 0;font-family:${FONT_STACK};font-size:22px;font-weight:700;line-height:1.3;color:${TEXT_COLOR};">
                      ${heading}
                    </h1>
                    <div class="email-text" style="margin:0 0 32px 0;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
                      ${body}
                    </div>

                    <!-- Bulletproof button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-btn" style="margin:0 0 32px 0;">
                      <tr>
                        <td align="center" bgcolor="${BUTTON_COLOR}" style="background-color:${BUTTON_COLOR};border-radius:8px;">
                          <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:600;color:${BUTTON_TEXT};text-decoration:none;border-radius:8px;">
                            ${buttonText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p class="email-muted" style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:${MUTED_COLOR};word-break:break-all;">
                      If the button doesn&rsquo;t work, copy and paste this link:<br>
                      <a href="${buttonUrl}" style="color:${MUTED_COLOR};">${buttonUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 16px 0 16px;">
              <p class="email-muted" style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${MUTED_COLOR};">
                ${footer ?? defaultFooter}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Lifecycle email templates
// ---------------------------------------------------------------------------

function trialEndingSoonTemplate({ name }) {
	return baseTemplate({
		preheader: 'Quick heads up — your trial wraps up soon',
		heading: 'Your trial ends in 3 days',
		body: `<p style="margin:0 0 16px 0;">Hey ${name},</p>
<p style="margin:0 0 16px 0;">Just a friendly heads up &mdash; your free trial ends in 3 days.</p>
<p style="margin:0 0 16px 0;">If you've been enjoying BacklogBox, subscribing means you keep all your boards, tracking history, and everything you've built so far. Nothing changes, you just keep going.</p>
<p style="margin:0;">If it's not for you, no hard feelings at all. Your data stays safe for 90 days after your trial ends, so there's no rush.</p>`,
		buttonText: 'See Plans',
		buttonUrl: `${appUrl}/subscribe`,
		footer:
			'You received this email because your BacklogBox trial is ending soon.<br>This is a one-time reminder.'
	});
}

function trialEndedTemplate({ name }) {
	return baseTemplate({
		preheader: 'Your trial wrapped up, but your data is safe',
		heading: 'Your trial has ended',
		body: `<p style="margin:0 0 16px 0;">Hey ${name},</p>
<p style="margin:0 0 16px 0;">Your 14-day trial ended today. Your boards and tracking history are all still here &mdash; we'll keep everything safe for 90 days.</p>
<p style="margin:0 0 16px 0;">If you'd like to pick up where you left off, you can subscribe anytime and everything will be right where you left it.</p>
<p style="margin:0;">Thanks for giving BacklogBox a try.</p>`,
		buttonText: 'Subscribe Now',
		buttonUrl: `${appUrl}/subscribe`,
		footer:
			'You received this email because your BacklogBox trial has ended.<br>Your data will be kept for 90 days.'
	});
}

function dayThreeCheckinTemplate({ name }) {
	return baseTemplate({
		preheader: 'A few tips to get the most out of BacklogBox',
		heading: "How's it going?",
		body: `<p style="margin:0 0 16px 0;">Hey ${name},</p>
<p style="margin:0 0 16px 0;">You signed up a few days ago &mdash; how's it going so far?</p>
<p style="margin:0 0 16px 0;">If you haven't had a chance to explore yet, here are a couple things worth trying:</p>
<ul class="email-text" style="margin:0 0 16px 0;padding-left:20px;font-size:15px;line-height:1.6;">
  <li>Head to <strong>Discover</strong> to find new books, movies, games, and more based on your taste</li>
  <li>Drag items between columns to track your progress</li>
  <li>Add notes to remember your thoughts on what you're consuming</li>
</ul>
<p style="margin:0;">You've got 11 days left on your trial. No pressure, just making sure you know what's there.</p>`,
		buttonText: 'Open BacklogBox',
		buttonUrl: appUrl,
		footer:
			'You received this email because you recently signed up for BacklogBox.<br>This is a one-time check-in.'
	});
}

function winBackTemplate({ name }) {
	return baseTemplate({
		preheader: 'Everything you tracked is waiting for you',
		heading: 'Your data is still here',
		body: `<p style="margin:0 0 16px 0;">Hey ${name},</p>
<p style="margin:0 0 16px 0;">It's been about a week since your trial ended. Just wanted to let you know &mdash; all your boards, lists, and tracking history are still here, exactly as you left them.</p>
<p style="margin:0 0 16px 0;">If you've been meaning to come back, subscribing picks up right where you left off. No setup, no re-adding things.</p>
<p style="margin:0;">Your data is kept for 90 days after your trial ends, so there's still plenty of time.</p>`,
		buttonText: 'Come Back',
		buttonUrl: `${appUrl}/subscribe`,
		footer:
			'You received this email because your BacklogBox trial recently ended.<br>This is a one-time reminder.'
	});
}

function dataDeletionWarningTemplate({ name }) {
	return baseTemplate({
		preheader: 'Final reminder — your data will be permanently removed',
		heading: 'Your data will be deleted in 7 days',
		body: `<p style="margin:0 0 16px 0;">Hey ${name},</p>
<p style="margin:0 0 16px 0;">Your free trial ended a while ago, and your BacklogBox data &mdash; boards, lists, and tracking history &mdash; will be permanently deleted in <strong>7 days</strong>.</p>
<p style="margin:0 0 16px 0;">If you'd like to keep everything, subscribe before then and it'll all still be there.</p>
<p style="margin:0;">After deletion, your data can't be recovered.</p>`,
		buttonText: 'Subscribe Now',
		buttonUrl: `${appUrl}/subscribe`,
		footer:
			'You received this email because your BacklogBox trial has expired.<br>Subscribe to keep your data, or it will be removed after the retention period.'
	});
}

// ---------------------------------------------------------------------------
// Shared query filter: non-subscribed, non-free, non-deleted active users
// ---------------------------------------------------------------------------

const notSubscribedNotDeleted = and(
	isNull(user.deletedAt),
	eq(user.subscribed, false),
	eq(user.freeAccess, false)
);

// ---------------------------------------------------------------------------
// Email send helper
// ---------------------------------------------------------------------------

async function sendLifecycleEmail(u, subject, html, tag) {
	if (!resend) return;
	try {
		await resend.emails.send({
			from: emailFrom,
			to: [u.email],
			replyTo,
			subject,
			html
		});
		console.log(`[${tag}] emailed ${u.email}`);
	} catch (err) {
		console.error(`[${tag}] failed to email ${u.email}:`, err);
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
	const now = new Date();
	console.log(`[cleanup] starting at ${now.toISOString()}`);

	// -----------------------------------------------------------------------
	// 1. Hard-delete unverified accounts older than 24 hours
	// -----------------------------------------------------------------------
	const unverifiedCutoff = daysAgo(1);

	const staleUnverified = await db
		.select({ id: user.id, email: user.email })
		.from(user)
		.where(and(eq(user.emailVerified, false), lt(user.createdAt, unverifiedCutoff)));

	if (staleUnverified.length > 0) {
		// Clean up verification tokens for these emails
		const emails = staleUnverified.map((u) => u.email);
		await db.delete(verification).where(inArray(verification.identifier, emails));

		// Hard-delete the user rows (session/account cascade automatically)
		const ids = staleUnverified.map((u) => u.id);
		await db.delete(user).where(inArray(user.id, ids));
	}

	console.log(`[cleanup] hard-deleted ${staleUnverified.length} unverified accounts`);
	for (const u of staleUnverified) {
		console.log(`[cleanup]   - ${u.email} (${u.id})`);
	}

	// -----------------------------------------------------------------------
	// 2. Day-3 check-in: users whose trial started ~3 days ago
	//    trial_ends_at is 14 days after signup, so 3 days in = 11 days left
	//    Window: trial_ends_at between (now + 10 days) and (now + 11 days)
	// -----------------------------------------------------------------------
	const checkinWindowStart = daysFromNow(10);
	const checkinWindowEnd = daysFromNow(11);

	const checkinUsers = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				isNotNull(user.trialEndsAt),
				gte(user.trialEndsAt, checkinWindowStart),
				lt(user.trialEndsAt, checkinWindowEnd),
				eq(user.emailVerified, true),
				notSubscribedNotDeleted
			)
		);

	console.log(`[checkin] ${checkinUsers.length} users for day-3 check-in`);
	for (const u of checkinUsers) {
		await sendLifecycleEmail(
			u,
			"How's it going?",
			dayThreeCheckinTemplate({ name: u.name }),
			'checkin'
		);
	}

	// -----------------------------------------------------------------------
	// 3. Trial ending soon: 3 days before trial expires
	//    Window: trial_ends_at between (now + 2 days) and (now + 3 days)
	// -----------------------------------------------------------------------
	const endingSoonStart = daysFromNow(2);
	const endingSoonEnd = daysFromNow(3);

	const endingSoonUsers = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				isNotNull(user.trialEndsAt),
				gte(user.trialEndsAt, endingSoonStart),
				lt(user.trialEndsAt, endingSoonEnd),
				notSubscribedNotDeleted
			)
		);

	console.log(`[ending-soon] ${endingSoonUsers.length} users with trial ending in 3 days`);
	for (const u of endingSoonUsers) {
		await sendLifecycleEmail(
			u,
			'Your BacklogBox trial ends in 3 days',
			trialEndingSoonTemplate({ name: u.name }),
			'ending-soon'
		);
	}

	// -----------------------------------------------------------------------
	// 4. Trial ended: trial expired in the last 24 hours
	//    Window: trial_ends_at between (now - 1 day) and now
	// -----------------------------------------------------------------------
	const endedWindowStart = daysAgo(1);

	const endedUsers = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				isNotNull(user.trialEndsAt),
				gte(user.trialEndsAt, endedWindowStart),
				lt(user.trialEndsAt, now),
				notSubscribedNotDeleted
			)
		);

	console.log(`[ended] ${endedUsers.length} users whose trial just ended`);
	for (const u of endedUsers) {
		await sendLifecycleEmail(
			u,
			'Your BacklogBox trial has ended',
			trialEndedTemplate({ name: u.name }),
			'ended'
		);
	}

	// -----------------------------------------------------------------------
	// 5. Win-back: 7 days post-trial-expiry
	//    Window: trial_ends_at between (now - 8 days) and (now - 7 days)
	// -----------------------------------------------------------------------
	const winBackStart = daysAgo(8);
	const winBackEnd = daysAgo(7);

	const winBackUsers = await db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.where(
			and(
				isNotNull(user.trialEndsAt),
				gte(user.trialEndsAt, winBackStart),
				lt(user.trialEndsAt, winBackEnd),
				notSubscribedNotDeleted
			)
		);

	console.log(`[win-back] ${winBackUsers.length} users for win-back`);
	for (const u of winBackUsers) {
		await sendLifecycleEmail(
			u,
			'Your BacklogBox data is still here',
			winBackTemplate({ name: u.name }),
			'win-back'
		);
	}

	// -----------------------------------------------------------------------
	// 6. Data deletion warning: 83 days post-trial-expiry (7 days until deletion)
	//    Window: trial_ends_at between (now - 84 days) and (now - 83 days)
	// -----------------------------------------------------------------------
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
				notSubscribedNotDeleted
			)
		);

	console.log(`[deletion-warn] ${warnUsers.length} users to warn about data deletion`);
	for (const u of warnUsers) {
		await sendLifecycleEmail(
			u,
			'Your BacklogBox data will be deleted in 7 days',
			dataDeletionWarningTemplate({ name: u.name }),
			'deletion-warn'
		);
	}

	// -----------------------------------------------------------------------
	// 7. Soft-delete: 90+ days post-trial-expiry
	// -----------------------------------------------------------------------
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
