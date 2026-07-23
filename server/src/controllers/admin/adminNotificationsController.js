import { Notification } from '../../models/Notification.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';
import { User } from '../../models/User.js';
import { queueNotification, queueEmail } from '../../services/automationService.js';
import { isSmtpConfigured } from '../../services/emailService.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildQuery(q) {
  const filter = {};
  if (q.audience) filter.audience = q.audience;
  if (q.channel) filter.channel = q.channel;
  if (q.status) filter.status = q.status;
  if (q.target_province) filter.target_province = new RegExp(sanitizeString(q.target_province), 'i');
  if (q.target_interest) filter.target_interest = new RegExp(sanitizeString(q.target_interest), 'i');
  if (q.delivered !== undefined) filter.delivered = q.delivered === 'true' || q.delivered === true;
  if (q.search && sanitizeString(q.search)) {
    const re = new RegExp(sanitizeString(q.search), 'i');
    filter.$or = [{ title: re }, { message: re }];
  }
  return filter;
}

function applyBody(doc, body) {
  if (body.title !== undefined) doc.title = sanitizeString(body.title);
  if (body.message !== undefined) doc.message = sanitizeString(body.message);
  if (body.target_province !== undefined) doc.target_province = body.target_province ? sanitizeString(body.target_province) : undefined;
  if (body.target_interest !== undefined) doc.target_interest = body.target_interest ? sanitizeString(body.target_interest) : undefined;
  if (body.delivered !== undefined) doc.delivered = !!body.delivered;
  if (body.link !== undefined) doc.link = body.link ? sanitizeString(body.link) : undefined;
  if (body.audience !== undefined) doc.audience = sanitizeString(body.audience);
  if (body.channel !== undefined) doc.channel = body.channel;
  if (body.scheduledAt !== undefined) doc.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  if (body.status !== undefined) doc.status = body.status;
}

function audienceUserFilter(audience) {
  if (audience === 'students') return { role: 'User' };
  if (audience === 'editors') return { role: 'Editor' };
  if (audience === 'moderators') return { role: 'Moderator' };
  if (audience === 'employers') return null;
  return {};
}

async function dispatchBroadcastNotification(doc) {
  const filter = audienceUserFilter(doc.audience);
  const emailMeta = {
    emailQueued: false,
    emailMode: isSmtpConfigured() ? 'live' : 'placeholder',
  };
  if (!isSmtpConfigured()) emailMeta.emailNotice = 'Email queued (SMTP not configured)';

  if (filter && (doc.channel === 'in_app' || doc.channel === 'push')) {
    const users = await User.find(filter).select('_id').limit(5000).lean();
    for (const u of users) {
      await queueNotification({
        dedupKey: `broadcast:${doc._id}:${u._id}`,
        recipientType: doc.audience === 'editors' || doc.audience === 'moderators' ? 'staff' : 'user',
        userId: u._id,
        category: 'announcement',
        type: 'admin.broadcast',
        title: doc.title,
        body: doc.message,
        link: doc.link || '/notifications',
      });
    }
    emailMeta.inAppQueued = users.length;
  }

  if (filter && doc.channel === 'email') {
    const users = await User.find({ ...filter, 'notifications.email': { $ne: false } }).select('email').limit(5000).lean();
    for (const u of users) {
      if (!u.email) continue;
      await queueEmail({
        to: u.email,
        subject: doc.title,
        body: doc.message,
        text: doc.message,
        dedupKey: `broadcast_email:${doc._id}:${u.email}`,
      });
    }
    emailMeta.emailQueued = users.length > 0;
  }

  return emailMeta;
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const query = buildQuery(req.query);
  const [data, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim()) return res.status(400).json({ error: 'Validation failed', details: { title: 'Title is required' } });
  if (!body.message?.trim()) return res.status(400).json({ error: 'Validation failed', details: { message: 'Message is required' } });
  const status = body.scheduledAt ? 'scheduled' : (body.status || 'sent');
  const doc = await Notification.create({
    title: sanitizeString(body.title),
    message: sanitizeString(body.message),
    audience: body.audience || 'all',
    channel: body.channel || 'in_app',
    status,
    delivered: status === 'sent',
  });
  applyBody(doc, body);
  await doc.save();
  let delivery = {};
  if (doc.status === 'sent') {
    delivery = await dispatchBroadcastNotification(doc);
  }
  await logAudit({ ...auditFromRequest(req), action: 'notification.create', targetType: 'notification', targetId: doc._id, targetLabel: doc.title, metadata: delivery });
  res.status(201).json({ ...doc.toObject(), ...delivery });
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Notification.findById(id);
  if (!doc) return res.status(404).json({ error: 'Notification not found' });
  const before = { title: doc.title, status: doc.status };
  applyBody(doc, req.body || {});
  let delivery = {};
  if (req.body?.sendNow) {
    doc.status = 'sent';
    doc.delivered = true;
    doc.scheduledAt = undefined;
    delivery = await dispatchBroadcastNotification(doc);
  }
  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'notification.update', targetType: 'notification', targetId: id, targetLabel: doc.title, before, after: { title: doc.title, status: doc.status }, metadata: delivery });
  res.json({ ...doc.toObject(), ...delivery });
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Notification.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ error: 'Notification not found' });
  await logAudit({ ...auditFromRequest(req), action: 'notification.delete', targetType: 'notification', targetId: id, targetLabel: doc.title });
  res.status(204).send();
});
