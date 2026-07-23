import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sanitizeString } from '../utils/sanitize.js';
import { notifyStaff } from '../services/notificationService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitTicket = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (body.website && String(body.website).trim()) {
    return res.status(201).json({ message: 'Support ticket submitted.' });
  }

  const subject = sanitizeString(body.subject || '').slice(0, 200);
  const message = sanitizeString(body.message || body.body || '').slice(0, 5000);
  const category = body.category || 'other';
  const priority = body.priority || 'medium';

  if (!subject || subject.length < 3) return res.status(400).json({ error: 'Subject is required' });
  if (!message || message.length < 10) return res.status(400).json({ error: 'Message is required (min 10 characters)' });

  let submitterType = 'guest';
  let userId;
  let employerId;
  let guestName;
  let guestEmail;
  let authorType = 'user';
  let authorName;

  if (req.user?.userId) {
    submitterType = 'user';
    userId = req.user.userId;
    authorType = 'user';
    authorName = req.user.name || req.user.email;
  } else if (req.employer) {
    submitterType = 'employer';
    employerId = req.employer.employerId || req.employer._id;
    authorType = 'employer';
    authorName = req.employer.companyName;
  } else {
    guestName = sanitizeString(body.name || '').slice(0, 120);
    guestEmail = sanitizeString(body.email || '').toLowerCase().slice(0, 254);
    if (!guestName || !guestEmail || !EMAIL_REGEX.test(guestEmail)) {
      return res.status(400).json({ error: 'Name and valid email are required for guest tickets' });
    }
    authorType = 'user';
    authorName = guestName;
  }

  const doc = await SupportTicket.create({
    subject,
    category,
    priority,
    submitterType,
    userId,
    employerId,
    guestName,
    guestEmail,
    messages: [{
      authorType,
      authorId: userId || employerId,
      authorName,
      body: message,
    }],
  });

  notifyStaff({
    category: 'support',
    type: 'support.new',
    title: `New support ticket: ${subject}`,
    body: authorName ? `${authorName} opened a ticket.` : 'New support ticket.',
    link: '/admin/support',
    metadata: { ticketId: doc._id, ticketNumber: doc.ticketNumber },
  }).catch(() => {});

  res.status(201).json({ message: 'Support ticket submitted.', ticketNumber: doc.ticketNumber, id: doc._id });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user?.userId) {
    filter.userId = req.user.userId;
  } else if (req.employer) {
    filter.employerId = req.employer.employerId || req.employer._id;
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 }).limit(50).lean();
  res.json({ data: tickets });
});

export const getMyTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const filter = { _id: id };
  if (req.user?.userId) filter.userId = req.user.userId;
  else if (req.employer) filter.employerId = req.employer.employerId || req.employer._id;
  else return res.status(401).json({ error: 'Authentication required' });

  const doc = await SupportTicket.findOne(filter).lean();
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });
  res.json(doc);
});

export const replyToMyTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = sanitizeString(req.body?.message || req.body?.body || '').slice(0, 5000);
  if (!body || body.length < 2) return res.status(400).json({ error: 'Message is required' });

  const filter = { _id: id };
  let authorType = 'user';
  let authorId;
  let authorName;

  if (req.user?.userId) {
    filter.userId = req.user.userId;
    authorId = req.user.userId;
    authorName = req.user.name || req.user.email;
  } else if (req.employer) {
    filter.employerId = req.employer.employerId || req.employer._id;
    authorType = 'employer';
    authorId = req.employer.employerId || req.employer._id;
    authorName = req.employer.companyName;
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const doc = await SupportTicket.findOne(filter);
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });
  if (doc.status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });

  doc.messages.push({ authorType, authorId, authorName, body });
  if (doc.status === 'resolved') doc.status = 'open';
  await doc.save();
  res.json(doc);
});
