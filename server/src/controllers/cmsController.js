import mongoose from 'mongoose';
import { CmsHomepage } from '../models/CmsHomepage.js';
import { CmsNavigation } from '../models/CmsNavigation.js';
import { CmsStaticPage } from '../models/CmsStaticPage.js';
import { CmsBanner } from '../models/CmsBanner.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listResponse, paginate } from '../utils/apiResponse.js';
import { sanitizeString } from '../utils/sanitize.js';
import { logAudit, auditFromRequest } from '../services/auditService.js';
import {
  applySeoFields,
  applyPublishFields,
  sanitizeHtml,
  sanitizeCmsSections,
  normalizeLocale,
  paginateQuery,
  publishedFilter,
} from '../utils/cmsHelpers.js';
import { applyResolvedSlug, slugErrorResponse } from '../utils/adminSlugHelpers.js';
import { onContentSaved, onContentDeleted, onContentPublished } from '../utils/contentIntegration.js';

function handleCmsError(err, res) {
  if (err.status === 403) return res.status(403).json({ error: err.message });
  throw err;
}

// ——— Homepage ———

export const getHomepageAdmin = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  let doc = await CmsHomepage.findOne({ locale }).lean();
  if (!doc) doc = { locale, status: 'draft', hero: {}, sections: {}, stats: [] };
  res.json(doc);
});

export const upsertHomepage = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const locale = normalizeLocale(body.locale || req.query.locale);
  let doc = await CmsHomepage.findOne({ locale });
  const isCreate = !doc;
  if (!doc) doc = new CmsHomepage({ locale });
  const before = doc.toObject ? { status: doc.status, locale: doc.locale } : null;

  if (body.hero) doc.hero = { ...doc.hero?.toObject?.() || doc.hero || {}, ...body.hero };
  if (body.stats !== undefined) doc.stats = body.stats;
  if (body.sections) doc.sections = { ...doc.sections?.toObject?.() || doc.sections || {}, ...body.sections };
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  applySeoFields(doc, body);
  doc.updatedBy = req.user?.userId;
  await doc.save();

  await logAudit({
    ...auditFromRequest(req),
    action: isCreate ? 'cms.homepage.create' : 'cms.homepage.update',
    targetType: 'cmsHomepage',
    targetId: doc._id,
    targetLabel: `homepage:${locale}`,
    before,
    after: { status: doc.status, locale: doc.locale },
    reason: body.reason,
  });
  res.json(doc);
});

export const publishHomepage = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.params.locale || req.body?.locale);
  const doc = await CmsHomepage.findOne({ locale });
  if (!doc) return res.status(404).json({ error: 'Homepage not found' });
  try {
    applyPublishFields(doc, { status: 'published' }, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'cms.homepage.publish', targetType: 'cmsHomepage', targetId: doc._id, targetLabel: `homepage:${locale}` });
  res.json(doc);
});

// ——— Navigation ———

export const getNavigationAdmin = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const placement = req.query.placement === 'footer' ? 'footer' : 'header';
  let doc = await CmsNavigation.findOne({ locale, placement }).lean();
  if (!doc) doc = { locale, placement, status: 'draft', items: [], columns: [], socialLinks: [] };
  res.json(doc);
});

export const upsertNavigation = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const locale = normalizeLocale(body.locale);
  const placement = body.placement === 'footer' ? 'footer' : 'header';
  let doc = await CmsNavigation.findOne({ locale, placement });
  const isCreate = !doc;
  if (!doc) doc = new CmsNavigation({ locale, placement });
  const before = { status: doc.status };

  if (body.items !== undefined) doc.items = body.items;
  if (body.columns !== undefined) doc.columns = body.columns;
  if (body.promoColumn !== undefined) doc.promoColumn = body.promoColumn;
  if (body.socialLinks !== undefined) doc.socialLinks = body.socialLinks;
  if (body.contact !== undefined) doc.contact = body.contact;
  if (body.newsletterText !== undefined) doc.newsletterText = sanitizeString(body.newsletterText);
  if (body.newsletterTextUr !== undefined) doc.newsletterTextUr = sanitizeString(body.newsletterTextUr);
  if (body.newsletterTextAr !== undefined) doc.newsletterTextAr = sanitizeString(body.newsletterTextAr);
  if (body.copyrightText !== undefined) doc.copyrightText = sanitizeString(body.copyrightText);
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  doc.updatedBy = req.user?.userId;
  await doc.save();

  await logAudit({
    ...auditFromRequest(req),
    action: isCreate ? 'cms.navigation.create' : 'cms.navigation.update',
    targetType: 'cmsNavigation',
    targetId: doc._id,
    targetLabel: `${placement}:${locale}`,
    before,
    after: { status: doc.status },
    reason: body.reason,
  });
  res.json(doc);
});

export const publishNavigation = asyncHandler(async (req, res) => {
  const { locale, placement } = req.params;
  const doc = await CmsNavigation.findOne({ locale: normalizeLocale(locale), placement });
  if (!doc) return res.status(404).json({ error: 'Navigation not found' });
  try {
    applyPublishFields(doc, { status: 'published' }, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'cms.navigation.publish', targetType: 'cmsNavigation', targetId: doc._id, targetLabel: `${placement}:${locale}` });
  res.json(doc);
});

// ——— Static pages ———

function buildPageQuery(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.locale) filter.locale = normalizeLocale(q.locale);
  if (q.pageType) filter.pageType = q.pageType;
  if (q.search) {
    const re = new RegExp(sanitizeString(q.search), 'i');
    filter.$or = [{ title: re }, { slug: re }, { heading: re }];
  }
  return filter;
}

export const listStaticPages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginateQuery(req);
  const query = buildPageQuery(req.query);
  const [data, total] = await Promise.all([
    CmsStaticPage.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    CmsStaticPage.countDocuments(query),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getStaticPage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = await CmsStaticPage.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  res.json(doc);
});

export const createStaticPage = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const doc = new CmsStaticPage({
    title: sanitizeString(body.title),
    locale: normalizeLocale(body.locale),
    heading: sanitizeString(body.heading),
    content: sanitizeHtml(body.content),
    sections: sanitizeCmsSections(body.sections),
    pageType: body.pageType || 'custom',
    lastUpdatedManually: body.lastUpdatedManually ? new Date(body.lastUpdatedManually) : new Date(),
    updatedBy: req.user?.userId,
  });
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  applySeoFields(doc, body);
  const slugErr = await applyResolvedSlug('cms-page', doc, body, true);
  if (slugErr) return slugErrorResponse(res, slugErr);
  await doc.save();
  onContentSaved('cms-page', doc, { locale: doc.locale });
  await logAudit({ ...auditFromRequest(req), action: 'cms.page.create', targetType: 'cmsStaticPage', targetId: doc._id, targetLabel: doc.slug });
  res.status(201).json(doc);
});

export const updateStaticPage = asyncHandler(async (req, res) => {
  const doc = await CmsStaticPage.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  const body = req.body || {};
  const before = { status: doc.status, slug: doc.slug };
  if (body.title !== undefined) doc.title = sanitizeString(body.title);
  if (body.heading !== undefined) doc.heading = sanitizeString(body.heading);
  if (body.content !== undefined) doc.content = sanitizeHtml(body.content);
  if (body.sections !== undefined) doc.sections = sanitizeCmsSections(body.sections);
  if (body.pageType !== undefined) doc.pageType = body.pageType;
  if (body.locale !== undefined) doc.locale = normalizeLocale(body.locale);
  if (body.lastUpdatedManually !== undefined) doc.lastUpdatedManually = body.lastUpdatedManually ? new Date(body.lastUpdatedManually) : doc.lastUpdatedManually;
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  applySeoFields(doc, body);
  doc.updatedBy = req.user?.userId;
  const slugErr = await applyResolvedSlug('cms-page', doc, body, false);
  if (slugErr) return slugErrorResponse(res, slugErr);
  await doc.save();
  onContentSaved('cms-page', doc, { locale: doc.locale });
  await logAudit({ ...auditFromRequest(req), action: 'cms.page.update', targetType: 'cmsStaticPage', targetId: doc._id, targetLabel: doc.slug, before, after: { status: doc.status }, reason: body.reason });
  res.json(doc);
});

export const deleteStaticPage = asyncHandler(async (req, res) => {
  const doc = await CmsStaticPage.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  onContentDeleted('cms-page', doc._id, { locale: doc.locale });
  await logAudit({ ...auditFromRequest(req), action: 'cms.page.delete', targetType: 'cmsStaticPage', targetId: doc._id, targetLabel: doc.slug });
  res.status(204).send();
});

export const publishStaticPage = asyncHandler(async (req, res) => {
  const doc = await CmsStaticPage.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  try {
    applyPublishFields(doc, { status: 'published' }, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  doc.lastUpdatedManually = new Date();
  await doc.save();
  const actor = { userId: req.user?.userId, role: req.user?.role, email: req.user?.email };
  await onContentPublished('cms-page', doc._id, actor, { locale: doc.locale, title: doc.title });
  await logAudit({ ...auditFromRequest(req), action: 'cms.page.publish', targetType: 'cmsStaticPage', targetId: doc._id, targetLabel: doc.slug });
  res.json(doc);
});

// ——— Banners ———

export const listBanners = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginateQuery(req);
  const filter = {};
  if (req.query.locale) filter.locale = normalizeLocale(req.query.locale);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.placement) filter.placement = sanitizeString(req.query.placement);
  const [data, total] = await Promise.all([
    CmsBanner.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    CmsBanner.countDocuments(filter),
  ]);
  res.json(listResponse(data, paginate(page, limit, total), req.query));
});

export const getBanner = asyncHandler(async (req, res) => {
  const doc = await CmsBanner.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Banner not found' });
  res.json(doc);
});

export const createBanner = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const doc = new CmsBanner({
    title: sanitizeString(body.title),
    locale: normalizeLocale(body.locale),
    headline: sanitizeString(body.headline),
    subheadline: sanitizeString(body.subheadline),
    ctaLabel: sanitizeString(body.ctaLabel),
    ctaUrl: sanitizeString(body.ctaUrl),
    ctaExternal: !!body.ctaExternal,
    backgroundImageUrl: sanitizeString(body.backgroundImageUrl),
    mobileImageUrl: sanitizeString(body.mobileImageUrl),
    active: body.active !== false,
    order: Number(body.order) || 0,
    placement: sanitizeString(body.placement) || 'homepage',
    scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
    scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : undefined,
    updatedBy: req.user?.userId,
  });
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  applySeoFields(doc, body);
  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'cms.banner.create', targetType: 'cmsBanner', targetId: doc._id, targetLabel: doc.title });
  res.status(201).json(doc);
});

export const updateBanner = asyncHandler(async (req, res) => {
  const doc = await CmsBanner.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Banner not found' });
  const body = req.body || {};
  const fields = ['title', 'headline', 'subheadline', 'ctaLabel', 'ctaUrl', 'backgroundImageUrl', 'mobileImageUrl', 'placement'];
  for (const f of fields) {
    if (body[f] !== undefined) doc[f] = sanitizeString(body[f]);
  }
  if (body.ctaExternal !== undefined) doc.ctaExternal = !!body.ctaExternal;
  if (body.active !== undefined) doc.active = !!body.active;
  if (body.order !== undefined) doc.order = Number(body.order) || 0;
  if (body.locale !== undefined) doc.locale = normalizeLocale(body.locale);
  if (body.scheduledStart !== undefined) doc.scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : undefined;
  if (body.scheduledEnd !== undefined) doc.scheduledEnd = body.scheduledEnd ? new Date(body.scheduledEnd) : undefined;
  try {
    applyPublishFields(doc, body, req.user);
  } catch (e) {
    return handleCmsError(e, res);
  }
  applySeoFields(doc, body);
  doc.updatedBy = req.user?.userId;
  await doc.save();
  await logAudit({ ...auditFromRequest(req), action: 'cms.banner.update', targetType: 'cmsBanner', targetId: doc._id, targetLabel: doc.title, reason: body.reason });
  res.json(doc);
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const doc = await CmsBanner.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Banner not found' });
  await logAudit({ ...auditFromRequest(req), action: 'cms.banner.delete', targetType: 'cmsBanner', targetId: doc._id, targetLabel: doc.title });
  res.status(204).send();
});

// ——— Public ———

export const getPublicHomepage = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const doc = await CmsHomepage.findOne({ locale, ...publishedFilter() }).lean();
  res.json(doc || null);
});

export const getPublicNavigation = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const placement = req.query.placement === 'footer' ? 'footer' : 'header';
  const doc = await CmsNavigation.findOne({ locale, placement, ...publishedFilter() }).lean();
  res.json(doc || null);
});

export const getPublicPage = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const slug = sanitizeString(req.params.slug);
  let doc = await CmsStaticPage.findOne({ slug, locale, ...publishedFilter() }).lean();
  if (!doc && locale !== 'en') {
    doc = await CmsStaticPage.findOne({ slug, locale: 'en', ...publishedFilter() }).lean();
  }
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  res.json(doc);
});

export const listPublicBanners = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const placement = sanitizeString(req.query.placement) || 'homepage';
  const now = new Date();
  const data = await CmsBanner.find({
    locale,
    placement,
    active: true,
    status: 'published',
    $and: [
      { $or: [{ scheduledStart: { $exists: false } }, { scheduledStart: null }, { scheduledStart: { $lte: now } }] },
      { $or: [{ scheduledEnd: { $exists: false } }, { scheduledEnd: null }, { scheduledEnd: { $gte: now } }] },
    ],
  })
    .sort({ order: 1 })
    .lean();
  res.json({ data });
});

/** Admin preview — draft content by id/slug */
export const previewStaticPage = asyncHandler(async (req, res) => {
  const doc = await CmsStaticPage.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Page not found' });
  res.json(doc);
});

export const previewHomepage = asyncHandler(async (req, res) => {
  const locale = normalizeLocale(req.query.locale);
  const doc = await CmsHomepage.findOne({ locale }).lean();
  res.json(doc || null);
});
