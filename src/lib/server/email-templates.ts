// ---------------------------------------------------------------------------
// Transactional email templates — table-based HTML with inline styles.
// Compatible with Gmail, Outlook, Apple Mail. Dark mode via progressive
// enhancement <style> block (stripped by Gmail, used by Apple Mail/Outlook apps).
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

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

interface BaseTemplateParams {
	preheader: string;
	heading: string;
	/** HTML body content */
	body: string;
	buttonText: string;
	buttonUrl: string;
	footer?: string;
}

function baseTemplate({
	preheader,
	heading,
	body,
	buttonText,
	buttonUrl,
	footer
}: BaseTemplateParams): string {
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
// Specific templates
// ---------------------------------------------------------------------------

export function passwordResetTemplate(params: { url: string; name: string }): string {
	return baseTemplate({
		preheader: 'Reset your BacklogBox password',
		heading: 'Reset your password',
		body: `<p style="margin:0 0 16px 0;">Hey ${params.name},</p>
<p style="margin:0;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>`,
		buttonText: 'Reset Password',
		buttonUrl: params.url,
		footer:
			'If you didn&rsquo;t request a password reset, you can safely ignore this email. Your password will remain unchanged.'
	});
}

export function emailVerificationTemplate(params: { url: string; name: string }): string {
	return baseTemplate({
		preheader: 'Verify your email to get started with BacklogBox',
		heading: 'Verify your email',
		body: `<p style="margin:0 0 16px 0;">Hey ${params.name},</p>
<p style="margin:0;">Click the button below to verify your email address and activate your account. This link expires in 24 hours.</p>`,
		buttonText: 'Verify Email',
		buttonUrl: params.url
	});
}
