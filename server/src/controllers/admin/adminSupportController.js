import mongoose from 'mongoose';
import { SupportTicket } from '../../models/SupportTicket.js';
import { User } from '../../models/User.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';
import { onSupportTicketUpdate } from '../../services/automationService.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildQuery(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = q.category;
  if (q.assignedTo) filter.assignedTo = q.assignedTo;
  if (q.search && sanitizeString(q.search)) {
    const re = new RegExp(sanitizeString(q.search), 'i');
    filter.$or = [{ subject: re }, { ticketNumber: re }, { guestEmail: re }, { guestName: re }];
  }
  return filter;
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const query = buildQuery(req.query);
  const [data, total] = await Promise.all([
    SupportTicket.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate('assignedTo', 'name email').lean(),
    SupportTicket.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await SupportTicket.findById(req.params.id).populate('assignedTo', 'name email').lean();
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });
  res.json(doc);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await SupportTicket.findById(id);
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });

  const body = req.body || {};
  if (body.status !== undefined) {
    doc.status = body.status;
    if (body.status === 'closed' || body.status === 'resolved') doc.closedAt = new Date();
  }
  if (body.priority !== undefined) doc.priority = body.priority;
  if (body.category !== undefined) doc.category = body.category;
  if (body.assignedTo !== undefined) {
    if (body.assignedTo && !mongoose.Types.ObjectId.isValid(body.assignedTo)) {
      return res.status(400).json({ error: 'Invalid assignee' });
    }
    doc.assignedTo = body.assignedTo || undefined;
  }

  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'support.update', targetType: 'support_ticket', targetId: doc._id });
  res.json(doc);
});

export const reply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = sanitizeString(req.body?.message || req.body?.body || '').slice(0, 5000);
  if (!body) return res.status(400).json({ error: 'Message is required' });

  const doc = await SupportTicket.findById(id);
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });

  const staff = await User.findById(req.user.userId).select('name email').lean();
  doc.messages.push({
    authorType: 'staff',
    authorId: req.user.userId,
    authorName: staff?.name || staff?.email || 'Support',
    body,
  });
  if (doc.status === 'open') doc.status = 'in_progress';
  await doc.save();

  onSupportTicketUpdate({
    ticketId: doc._id,
    ticketNumber: doc.ticketNumber,
    userId: doc.userId,
    employerId: doc.employerId,
    subject: doc.subject,
    isReply: true,
  }).catch(() => {});

  await logAudit({ ...auditFromRequest(req), action: 'support.reply', targetType: 'support_ticket', targetId: doc._id });
  res.json(doc);
});

export const close = asyncHandler(async (req, res) => {
  const doc = await SupportTicket.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Ticket not found' });
  doc.status = 'closed';
  doc.closedAt = new Date();
  await doc.save();
  res.json(doc);
});
