const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

// In test mode, every "sent" email is captured here instead of (or in addition
// to) being logged, so tests can assert on what would have been emailed —
// e.g. that a password reset email contains a working reset link — without
// needing real Gmail credentials or making a real network call in CI.
const sentEmails = [];

function getTransporter() {
  if (!config.email.enabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.appPassword,
      },
    });
  }
  return transporter;
}

/**
 * Sends an email if Gmail credentials are configured; otherwise logs and
 * no-ops. This means the app runs fine without email configured at all —
 * useful for local dev, tests, and anyone who hasn't set up Gmail yet.
 * Never throws: a failed/unconfigured email should never break the request
 * that triggered it (e.g. a booking should succeed even if notification fails).
 */
async function sendEmail({ to, subject, html, text }) {
  if (config.env === 'test') {
    sentEmails.push({ to, subject, html, text });
    return { sent: true, test: true };
  }

  const t = getTransporter();
  if (!t) {
    if (config.env === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[email] Skipped (not configured): "${subject}" to ${to}`);
    }
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await t.sendMail({
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
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
