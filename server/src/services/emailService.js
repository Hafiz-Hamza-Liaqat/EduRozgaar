import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user, pass },
  });
  return transporter;
}

function getFromAddress() {
  return process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@edurozgaar.pk';
}

/**
 * Send email via SMTP when MAIL_HOST/MAIL_USER/MAIL_PASS are set; otherwise log (dev).
 */
export async function sendEmail({ to, subject, body, text }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[Email dev placeholder]', { to, subject });
    if (text) console.log(text);
    return { sent: false, placeholder: true };
  }

  const info = await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text: text || undefined,
    html: body || undefined,
  });
  return { sent: true, messageId: info.messageId };
}

const RESET_SUBJECT = 'EduRozgaar – Reset your password';
const RESET_TEXT = (url) =>
  `You requested a password reset. Click the link below to set a new password (valid for 1 hour):\n\n${url}\n\nIf you didn't request this, you can ignore this email.`;

export async function sendPasswordResetEmail(to, resetUrl) {
  return sendEmail({
    to,
    subject: RESET_SUBJECT,
    text: RESET_TEXT(resetUrl),
    body: `<p>You requested a password reset. <a href="${resetUrl}">Click here to set a new password</a> (valid for 1 hour).</p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}
