import { CareerArticle } from '../../models/CareerArticle.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listResponse, paginate } from '../../utils/apiResponse.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { sanitizeHtml } from '../../utils/htmlSanitize.js';
import { parseStringArray } from '../../utils/adminContentHelpers.js';
import { careerArticleSlug } from '../../utils/slugify.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';
import { runBulkAction, duplicateDoc } from '../../utils/adminBulkHelper.js';
import { applyResolvedSlug, slugErrorResponse } from '../../utils/adminSlugHelpers.js';
import { onContentSaved, onContentDeleted, onContentBulkDeleted, onContentBulkUpdated } from '../../utils/contentIntegration.js';
import { validIds } from '../../utils/adminBulkHelper.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildQuery(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.category) filter.category = new RegExp(sanitizeString(q.category), 'i');
  if (q.featured === 'true') filter.isFeatured = true;
  if (q.search && sanitizeString(q.search)) {
    const re = new RegExp(sanitizeString(q.search), 'i');
    filter.$or = [{ title: re }, { content: re }, { excerpt: re }];
  }
  return filter;
}

function applyBody(doc, body, isCreate = false) {
  if (body.title !== undefined || isCreate) doc.title = sanitizeString(body.title);
  if (body.excerpt !== undefined) doc.excerpt = sanitizeString(body.excerpt);
  if (body.content !== undefined) doc.content = sanitizeHtml(body.content);
  if (body.category !== undefined) doc.category = sanitizeString(body.category);
  const tags = parseStringArray(body.tags);
  if (tags !== undefined) doc.tags = tags;
  if (body.status !== undefined) {
    doc.status = body.status;
    if (body.status === 'published' && !doc.publishedAt) doc.publishedAt = new Date();
  }
  if (body.publishedAt !== undefined) doc.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
  if (body.scheduledAt !== undefined) doc.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  if (body.imageUrl !== undefined) doc.imageUrl = sanitizeString(body.imageUrl);
  if (body.isFeatured !== undefined) doc.isFeatured = !!body.isFeatured;
  if (body.seoTitle !== undefined) doc.seoTitle = sanitizeString(body.seoTitle);
  if (body.metaDescription !== undefined) doc.metaDescription = sanitizeString(body.metaDescription);
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const query = buildQuery(req.query);
  const [data, total] = await Promise.all([
    CareerArticle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CareerArticle.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await CareerArticle.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Article not found' });
  res.json(doc);
});

export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const doc = new CareerArticle({});
  applyBody(doc, body, true);
  const slugErr = await applyResolvedSlug('career-article', doc, body, true);
  if (slugErr) return slugErrorResponse(res, slugErr);
  await doc.save();
  onContentSaved('career-guidance', doc);
  await logAudit({ ...auditFromRequest(req), action: 'career_article.create', targetType: 'career_article', targetId: doc._id, targetLabel: doc.title });
  res.status(201).json(doc);
});

export const update = asyncHandler(async (req, res) => {
  const doc = await CareerArticle.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Article not found' });
  applyBody(doc, req.body || {});
  const slugErr = await applyResolvedSlug('career-article', doc, req.body || {}, false);
  if (slugErr) return slugErrorResponse(res, slugErr);
  await doc.save();
  onContentSaved('career-guidance', doc);
  await logAudit({ ...auditFromRequest(req), action: 'career_article.update', targetType: 'career_article', targetId: doc._id, targetLabel: doc.title });
  res.json(doc);
});

export const duplicate = asyncHandler(async (req, res) => {
  const doc = await duplicateDoc(CareerArticle, req.params.id, (s) => {
    s.title = `${s.title} (Copy)`;
    s.slug = careerArticleSlug(s.title);
    s.status = 'draft';
    s.views = 0;
  });
  if (!doc) return res.status(404).json({ error: 'Article not found' });
  res.status(201).json(doc);
});

export const bulkAction = asyncHandler(async (req, res) => {
  const { action, ids } = req.body || {};
  const idsValid = validIds(ids);
  const result = await runBulkAction({ req, Model: CareerArticle, ids, action, auditType: 'career_article' });
  if (action === 'delete') onContentBulkDeleted('career-guidance', idsValid);
  if (action === 'publish') onContentBulkUpdated('career-guidance', idsValid);
  res.status(result.status).json(result.body);
});

export const remove = asyncHandler(async (req, res) => {
  const doc = await CareerArticle.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Article not found' });
  onContentDeleted('career-guidance', req.params.id);
  await logAudit({ ...auditFromRequest(req), action: 'career_article.delete', targetType: 'career_article', targetId: req.params.id, targetLabel: doc.title });
  res.status(204).send();
});
