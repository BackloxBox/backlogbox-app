/**
 * Preview all email templates — renders each to an HTML file in /tmp.
 * Run: npx tsx scripts/preview-emails.ts
 * Then open the printed URLs in your browser.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import {
	passwordResetTemplate,
	emailVerificationTemplate,
	welcomeTemplate,
	subscriptionConfirmedTemplate,
	subscriptionCancelledTemplate
} from '../src/lib/server/email-templates';

const dir = '/tmp/backlogbox-email-preview';
mkdirSync(dir, { recursive: true });

// ---------------------------------------------------------------------------
// Auth-triggered templates (from email-templates.ts)
// ---------------------------------------------------------------------------

const templates: Record<string, string> = {
	'01-email-verification': emailVerificationTemplate({
		url: 'https://backlogbox.com/verify?token=abc123',
		name: 'Yorick'
	}),
	'02-welcome': welcomeTemplate({
		name: 'Yorick',
		appUrl: 'https://backlogbox.com'
	}),
	'03-password-reset': passwordResetTemplate({
		url: 'https://backlogbox.com/reset?token=abc123',
		name: 'Yorick'
	}),
	'04-subscription-confirmed': subscriptionConfirmedTemplate({
		name: 'Yorick',
		appUrl: 'https://backlogbox.com'
	}),
	'05-subscription-cancelled': subscriptionCancelledTemplate({
		name: 'Yorick',
		subscribeUrl: 'https://backlogbox.com/subscribe'
	})
};

// ---------------------------------------------------------------------------
// Cron-triggered templates (from cleanup-expired-trials.mjs)
// Extract template functions by stripping comments and evaluating them.
// ---------------------------------------------------------------------------

const cleanupSrc = readFileSync(new URL('./cleanup-expired-trials.mjs', import.meta.url), 'utf-8');

// Extract constants + baseTemplate + template functions.
// Grab everything from the first `const BRAND_COLOR` to just before `// Shared query filter`.
const match = cleanupSrc.match(/(?=const BRAND_COLOR)[\s\S]+?(?=\/\/ Shared query filter)/);

if (match) {
	const moduleCode = `const appUrl = 'https://backlogbox.com';\n${match[0]}\nexport { trialEndingSoonTemplate, trialEndedTemplate, dayThreeCheckinTemplate, winBackTemplate, dataDeletionWarningTemplate };`;
	const tmpModule = `${dir}/_cron-templates.mjs`;
	writeFileSync(tmpModule, moduleCode);

	const c = await import(tmpModule);
	templates['06-day3-checkin'] = c.dayThreeCheckinTemplate({ name: 'Yorick' });
	templates['07-trial-ending-soon'] = c.trialEndingSoonTemplate({ name: 'Yorick' });
	templates['08-trial-ended'] = c.trialEndedTemplate({ name: 'Yorick' });
	templates['09-win-back'] = c.winBackTemplate({ name: 'Yorick' });
	templates['10-data-deletion-warning'] = c.dataDeletionWarningTemplate({ name: 'Yorick' });
}

// ---------------------------------------------------------------------------
// Write HTML files + index
// ---------------------------------------------------------------------------

const index = `<!DOCTYPE html>
<html><head><title>Email Preview</title>
<style>
  body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 0 20px; }
  a { display: block; padding: 12px 0; font-size: 16px; color: #18181b; }
  a:hover { color: #3b82f6; }
  hr { margin: 24px 0; border: none; border-top: 1px solid #e4e4e7; }
  h2 { margin: 24px 0 8px; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; }
</style></head>
<body>
<h1>Email Template Preview</h1>
<h2>Auth-triggered</h2>
${Object.keys(templates)
	.filter((n) => parseInt(n) <= 5)
	.map((name) => `<a href="${name}.html">${name.replace(/^\d+-/, '').replace(/-/g, ' ')}</a>`)
	.join('\n')}
<hr>
<h2>Cron-triggered (lifecycle)</h2>
${Object.keys(templates)
	.filter((n) => parseInt(n) > 5)
	.map((name) => `<a href="${name}.html">${name.replace(/^\d+-/, '').replace(/-/g, ' ')}</a>`)
	.join('\n')}
</body></html>`;

writeFileSync(`${dir}/index.html`, index);

for (const [name, html] of Object.entries(templates)) {
	writeFileSync(`${dir}/${name}.html`, html);
}

console.log(`\nPreviews written to: ${dir}/`);
console.log(`Open: file://${dir}/index.html\n`);

for (const name of Object.keys(templates)) {
	console.log(`  ${name.replace(/^\d+-/, '').replace(/-/g, ' ')}: file://${dir}/${name}.html`);
}
console.log();
