// Plain, functional HTML email templates. Kept deliberately simple (inline
// styles, no external assets) since many email clients strip <style> blocks
// and block remote images by default.

function welcomeEmail(user) {
  const roleLabel = user.role === 'driver' ? 'driver' : 'customer';
  return {
    subject: 'Welcome to SwiftShip Logistics',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #16212e;">
        <h2 style="color: #16212e;">Welcome to SwiftShip, ${escapeHtml(user.name)}</h2>
        <p>Your ${roleLabel} account has been created successfully with the email <strong>${escapeHtml(user.email)}</strong>.</p>
        ${roleLabel === 'customer'
          ? '<p>You can now book shipments, get instant price estimates, and track your parcels in real time.</p>'
          : '<p>You can now view deliveries assigned to you, update shipment status, and capture proof of delivery.</p>'}
        <p style="margin-top: 24px; color: #5b7590; font-size: 13px;">If you did not create this account, please disregard this email.</p>
      </div>
    `,
  };
}

function statusUpdateEmail({ trackingId, origin, destination, status, recipientName }) {
  const statusMessages = {
    'Order Placed': 'has been placed and is being prepared for pickup.',
    'Picked Up': 'has been picked up by our courier.',
    'In Transit': 'is now in transit to its destination.',
    'Out for Delivery': 'is out for delivery and should arrive shortly.',
    'Delivered': 'has been delivered successfully.',
    'Cancelled': 'has been cancelled.',
  };
  const message = statusMessages[status] || `status has been updated to "${status}".`;

  return {
    subject: `Shipment ${trackingId}: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #16212e;">
        <h2 style="color: #16212e;">Shipment Update</h2>
        <p>Your shipment <strong style="font-family: monospace;">${escapeHtml(trackingId)}</strong> ${message}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 4px 0; color: #5b7590;">Route</td><td style="padding: 4px 0;">${escapeHtml(origin)} &rarr; ${escapeHtml(destination)}</td></tr>
          <tr><td style="padding: 4px 0; color: #5b7590;">Status</td><td style="padding: 4px 0;"><strong>${escapeHtml(status)}</strong></td></tr>
          ${recipientName ? `<tr><td style="padding: 4px 0; color: #5b7590;">Recipient</td><td style="padding: 4px 0;">${escapeHtml(recipientName)}</td></tr>` : ''}
        </table>
        <p style="margin-top: 24px; color: #5b7590; font-size: 13px;">Track this shipment anytime using tracking ID ${escapeHtml(trackingId)}.</p>
      </div>
    `,
  };
}

function passwordResetEmail({ name, resetUrl, ttlMinutes }) {
  return {
    subject: 'Reset your SwiftShip password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #16212e;">
        <h2 style="color: #16212e;">Password reset request</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your SwiftShip password. Click the button below to choose a new one. This link expires in ${ttlMinutes} minutes and can only be used once.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #e08a1e; color: #0f1720; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset password</a>
        </p>
        <p style="font-size: 13px; color: #5b7590;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
        <p style="margin-top: 24px; color: #5b7590; font-size: 13px;">If you did not request this, you can safely ignore this email — your password will not be changed.</p>
      </div>
    `,
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { welcomeEmail, statusUpdateEmail, passwordResetEmail };
