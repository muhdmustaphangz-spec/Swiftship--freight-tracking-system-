const config = require('../config/env');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// In test mode, every "sent" email is captured here instead of making a real
// network call, so tests can assert on what would have been emailed.
const sentEmails = [];

/**
 * Sends an email via Brevo's transactional HTTP API if credentials are
 * configured; otherwise logs and no-ops. Never throws: a failed or
 * unconfigured email should never break the request that triggered it.
 *
 * Brevo's HTTPS API (port 443) is used instead of SMTP because Render's free
 * tier blocks outbound SMTP ports (25/465/587).
 */
async function sendEmail({ to, subject, html, text }) {
  if (config.env === 'test') {
    sentEmails.push({ to, subject, html, text });
    return { sent: true, test: true };
  }

  if (!config.email.enabled) {
    if (config.env === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[email] Skipped (not configured): "${subject}" to ${to}`);
    }
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': config.email.brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: config.email.fromName, email: config.email.fromAddress },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]+>/g, ''),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo API returned ${res.status}: ${body.slice(0, 300)}`);
    }

    return { sent: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] Failed to send:', err.message);
    return { sent: false, reason: 'send_error', error: err.message };
  }
}

/** Test-only helpers for inspecting/resetting captured emails. */
function _getSentEmails() {
  return sentEmails;
}
function _clearSentEmails() {
  sentEmails.length = 0;
}

module.exports = { sendEmail, _getSentEmails, _clearSentEmails };
