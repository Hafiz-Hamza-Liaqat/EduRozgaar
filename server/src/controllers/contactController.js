import crypto from 'crypto';
import { ContactMessage } from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sanitizeString } from '../utils/sanitize.js';
import { notifyStaff } from '../services/notificationService.js';
import { queueEmail } from '../services/automationService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashIp(ip) {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);
}

export const submitContact = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (body.website && String(body.website).trim()) {
    return res.status(201).json({ message: 'Thank you for contacting us.' });
  }

  const name = sanitizeString(body.name || '').slice(0, 120);
  const email = sanitizeString(body.email || '').toLowerCase().slice(0, 254);
  const subject = sanitizeString(body.subject || '').slice(0, 200);
  const message = sanitizeString(body.message || '').slice(0, 5000);

  const errors = {};
  if (!name || name.length < 2) errors.name = 'Name is required (min 2 characters)';
  if (!email || !EMAIL_REGEX.test(email)) errors.email = 'Valid email is required';
  if (!subject || subject.length < 3) errors.subject = 'Subject is required (min 3 characters)';
  if (!message || message.length < 10) errors.message = 'Message is required (min 10 characters)';

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const doc = await ContactMessage.create({
    name,
    email,
    subject,
    message,
    ipHash: hashIp(req.ip),
    userAgent: sanitizeString(req.get('user-agent') || '').slice(0, 500),
  });

  queueEmail({
    to: email,
    templateKey: 'contactConfirmation',
    vars: { name, subject },
    dedupKey: `contact:confirm:${doc._id}`,
  }).catch(() => {});
  const { sendContactAdminAlertEmail } = await import('../services/emailService.js');
  sendContactAdminAlertEmail({ name, email, subject, message, id: doc._id }).catch(() => {});
  notifyStaff({
    category: 'contact',
    type: 'contact.new',
    title: `New contact message: ${subject}`,
    body: `${name} (${email}) submitted a contact form.`,
    link: '/admin/contact-messages',
    metadata: { contactMessageId: doc._id },
  }).catch(() => {});

  res.status(201).json({ message: 'Thank you for contacting us. We will respond soon.', id: doc._id });
});
