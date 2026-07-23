import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { NewsletterLog } from '../../models/NewsletterLog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';
import { enqueueJob } from '../../services/jobQueueService.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const listSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.subscribed === 'true') filter.subscribed = true;
  if (req.query.subscribed === 'false') filter.subscribed = false;
  if (req.query.search) filter.email = new RegExp(sanitizeString(req.query.search), 'i');

  const [data, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NewsletterSubscriber.countDocuments(filter),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const doc = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Subscriber not found' });
  await logAudit({ ...auditFromRequest(req), action: 'newsletter.unsubscribe', targetType: 'newsletter_subscriber', targetId: req.params.id });
  res.status(204).send();
});

export const exportSubscribersCsv = asyncHandler(async (req, res) => {
  const filter = req.query.subscribed === 'false' ? { subscribed: false } : { subscribed: true };
  const rows = await NewsletterSubscriber.find(filter).sort({ email: 1 }).limit(10000).lean();
  const header = 'email,frequency,subscribed,createdAt';
  const lines = rows.map((r) =>
    [r.email, r.frequency, r.subscribed, r.createdAt?.toISOString()]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"');
  res.send([header, ...lines].join('\n'));
});

export const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    NewsletterLog.find().sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
    NewsletterLog.countDocuments(),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const sendNewsletter = asyncHandler(async (req, res) => {
  const subject = sanitizeString(req.body?.subject || '');
  const html = req.body?.html || req.body?.body || '';
  const text = req.body?.text || '';
  const scheduledAt = req.body?.scheduledAt ? new Date(req.body.scheduledAt) : null;

  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  if (!html && !text) return res.status(400).json({ error: 'Email body is required' });

  if (scheduledAt && scheduledAt > new Date()) {
    const log = await NewsletterLog.create({
      subject,
      summary: `Scheduled for ${scheduledAt.toISOString()}`,
      status: 'partial',
      subscriberCount: 0,
      sentCount: 0,
    });
    await enqueueJob({
      type: 'scheduled_newsletter',
      scheduledAt,
      dedupKey: `newsletter:scheduled:${log._id}`,
      payload: { subject, html, text, logId: log._id.toString() },
    });
    return res.json({ message: 'Newsletter scheduled for delivery.', logId: log._id, scheduledAt });
  }

  const log = await NewsletterLog.create({
    subject,
    summary: 'Queued for send',
    status: 'partial',
    subscriberCount: 0,
    sentCount: 0,
  });

  await enqueueJob({
    type: 'scheduled_newsletter',
    dedupKey: `newsletter:send:${log._id}`,
    payload: { subject, html, text, logId: log._id.toString() },
  });

  await logAudit({ ...auditFromRequest(req), action: 'newsletter.send', targetType: 'newsletter', targetId: log._id });

  res.json({
    message: 'Newsletter queued for delivery',
    logId: log._id,
  });
});
