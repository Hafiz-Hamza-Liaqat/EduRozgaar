import { sanitizeString } from './sanitize.js';
import { hasPermission, PERMISSIONS } from '../config/rbac.js';
import { sanitizeHtml as sanitizeHtmlCore, sanitizeCmsSections } from './htmlSanitize.js';

export { sanitizeCmsSections };

export function sanitizeHtml(html) {
  return sanitizeHtmlCore(html);
}

export const CMS_STATUSES = ['draft', 'published', 'archived'];
export { SUPPORTED_LOCALES as CMS_LOCALES, DEFAULT_LOCALE } from '../../../shared/localization/localeConfig.js';
export { normalizeLocale, resolveContentLocale } from '../../../shared/localization/localeResolver.js';

export function applySeoFields(doc, body) {
  if (body.seoTitle !== undefined) doc.seoTitle = sanitizeString(body.seoTitle);
  if (body.metaDescription !== undefined) doc.metaDescription = sanitizeString(body.metaDescription);
  if (body.canonicalUrl !== undefined) doc.canonicalUrl = sanitizeString(body.canonicalUrl);
  if (body.ogImageUrl !== undefined) doc.ogImageUrl = sanitizeString(body.ogImageUrl);
  if (body.twitterCard !== undefined) doc.twitterCard = sanitizeString(body.twitterCard) || 'summary_large_image';
  if (body.schemaType !== undefined) doc.schemaType = sanitizeString(body.schemaType);
}

export function applyPublishFields(doc, body, user) {
  const canPublish = user && hasPermission(user.role, PERMISSIONS.CONTENT_CMS_PUBLISH);
  if (body.status !== undefined) {
    const next = body.status;
    if (next === 'published' && !canPublish && doc.status !== 'published') {
      const err = new Error('Publish permission required');
      err.status = 403;
      throw err;
    }
    doc.status = next;
    if (next === 'published' && !doc.publishedAt) doc.publishedAt = new Date();
    if (next === 'draft') doc.publishedAt = undefined;
  }
  if (body.scheduledAt !== undefined) {
    doc.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
  }
  if (body.publishedAt !== undefined && canPublish) {
    doc.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
  }
}

/** Public query: published and schedule elapsed. */
export function publishedFilter(now = new Date()) {
  return {
    status: 'published',
    $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: now } }],
  };
}

export const NAV_PLACEMENTS = ['header', 'footer'];

export function paginateQuery(req, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
