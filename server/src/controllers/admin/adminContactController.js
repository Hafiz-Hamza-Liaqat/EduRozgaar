import mongoose from 'mongoose';
import { ContactMessage } from '../../models/ContactMessage.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUSES = ['new', 'in_progress', 'resolved', 'closed'];

function buildQuery(q) {
  const filter = {};
  if (q.status && STATUSES.includes(q.status)) filter.status = q.status;
  if (q.search && sanitizeString(q.search)) {
    const re = new RegExp(sanitizeString(q.search), 'i');
    filter.$or = [{ name: re }, { email: re }, { subject: re }, { message: re }];
  }
  if (q.from) {
    const d = new Date(q.from);
    if (!isNaN(d.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $gte: d };
  }
  if (q.to) {
    const d = new Date(q.to);
    if (!isNaN(d.getTime())) filter.createdAt = { ...(filter.createdAt || {}), $lte: d };
  }
  return filter;
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const query = buildQuery(req.query);
  const [data, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await ContactMessage.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Contact message not found' });
  res.json(doc);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await ContactMessage.findById(id);
  if (!doc) return res.status(404).json({ error: 'Contact message not found' });

  const body = req.body || {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return res.status(400).json({ error: 'Invalid status' });
    doc.status = body.status;
    if (body.status === 'resolved' || body.status === 'closed') doc.resolvedAt = new Date();
  }
  if (body.adminNotes !== undefined) doc.adminNotes = sanitizeString(body.adminNotes).slice(0, 2000);

  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'contact.update', targetType: 'contact_message', targetId: doc._id });
  res.json(doc);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await ContactMessage.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ error: 'Contact message not found' });
  await logAudit({ ...auditFromRequest(req), action: 'contact.delete', targetType: 'contact_message', targetId: id });
  res.status(204).send();
});

export const exportCsv = asyncHandler(async (req, res) => {
  const query = buildQuery(req.query);
  const rows = await ContactMessage.find(query).sort({ createdAt: -1 }).limit(5000).lean();
  const header = 'id,name,email,subject,message,status,createdAt';
  const lines = rows.map((r) =>
    [r._id, r.name, r.email, r.subject, r.message, r.status, r.createdAt?.toISOString()]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contact-messages.csv"');
  res.send([header, ...lines].join('\n'));
});
