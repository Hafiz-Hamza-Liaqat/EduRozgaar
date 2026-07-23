import { Webinar } from '../../models/Webinar.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { onWebinarPublished } from '../../services/automationService.js';
import { applyResolvedSlug, slugErrorResponse } from '../../utils/adminSlugHelpers.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUSES = ['draft', 'scheduled', 'live', 'recorded', 'cancelled'];

function applyBody(doc, body) {
  if (body.title !== undefined) doc.title = sanitizeString(body.title);
  if (body.slug !== undefined) doc.slug = sanitizeString(body.slug);
  if (body.description !== undefined) doc.description = body.description ? sanitizeString(body.description) : undefined;
  if (body.scheduledAt !== undefined) doc.scheduledAt = new Date(body.scheduledAt);
  if (body.durationMinutes !== undefined) doc.durationMinutes = body.durationMinutes;
  if (body.meetingUrl !== undefined) doc.meetingUrl = body.meetingUrl ? sanitizeString(body.meetingUrl) : undefined;
  if (body.recordingUrl !== undefined) doc.recordingUrl = body.recordingUrl ? sanitizeString(body.recordingUrl) : undefined;
  if (body.registrationUrl !== undefined) doc.registrationUrl = body.registrationUrl ? sanitizeString(body.registrationUrl) : undefined;
  if (body.status !== undefined && STATUSES.includes(body.status)) doc.status = body.status;
  if (body.isSponsored !== undefined) doc.isSponsored = !!body.isSponsored;
  if (body.speakerName !== undefined) doc.speakerName = body.speakerName ? sanitizeString(body.speakerName) : undefined;
  if (body.speakerTitle !== undefined) doc.speakerTitle = body.speakerTitle ? sanitizeString(body.speakerTitle) : undefined;
  if (body.speakerBio !== undefined) doc.speakerBio = body.speakerBio ? sanitizeString(body.speakerBio) : undefined;
  if (body.speakerImageUrl !== undefined) doc.speakerImageUrl = sanitizeString(body.speakerImageUrl);
  if (body.bannerUrl !== undefined) doc.bannerUrl = sanitizeString(body.bannerUrl);
  if (body.seoTitle !== undefined) doc.seoTitle = body.seoTitle ? sanitizeString(body.seoTitle) : undefined;
  if (body.metaDescription !== undefined) doc.metaDescription = body.metaDescription ? sanitizeString(body.metaDescription) : undefined;
  if (body.publishedAt !== undefined) doc.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const status = req.query.status;
  const query = status ? { status } : {};
  const [data, total] = await Promise.all([
    Webinar.find(query).sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean(),
    Webinar.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Webinar.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Webinar not found' });
  res.json(doc);
});

export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title || !String(body.title).trim()) return res.status(400).json({ error: 'Validation failed', details: { title: 'Title is required' } });
  if (!body.scheduledAt) return res.status(400).json({ error: 'Validation failed', details: { scheduledAt: 'Scheduled date is required' } });
  const doc = new Webinar({
    title: sanitizeString(body.title),
    scheduledAt: new Date(body.scheduledAt),
    durationMinutes: body.durationMinutes || 60,
    status: body.status || 'draft',
  });
  applyBody(doc, body);
  const slugErr = await applyResolvedSlug('webinar', doc, body, true);
  if (slugErr) return slugErrorResponse(res, slugErr);
  if (body.status === 'scheduled' && !doc.publishedAt) doc.publishedAt = new Date();
  await doc.save();
  if (body.status === 'scheduled') {
    onWebinarPublished({ webinarId: doc._id, title: doc.title }).catch(() => {});
  }
  res.status(201).json(doc);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Webinar.findById(id);
  if (!doc) return res.status(404).json({ error: 'Webinar not found' });
  const prevStatus = doc.status;
  applyBody(doc, req.body || {});
  const slugErr = await applyResolvedSlug('webinar', doc, req.body || {}, false);
  if (slugErr) return slugErrorResponse(res, slugErr);
  if (req.body?.status === 'scheduled' && prevStatus === 'draft') doc.publishedAt = new Date();
  await doc.save();
  if (req.body?.status === 'scheduled' && prevStatus === 'draft') {
    onWebinarPublished({ webinarId: doc._id, title: doc.title }).catch(() => {});
  }
  res.json(doc);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await Webinar.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ error: 'Webinar not found' });
  res.status(204).send();
});
