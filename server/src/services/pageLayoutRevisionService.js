import { CmsPageLayout } from '../models/CmsPageLayout.js';
import { CmsPageLayoutRevision } from '../models/CmsPageLayoutRevision.js';
import { logAudit } from './auditService.js';
import {
  REVISION_TIMELINES,
  buildRevisionSnapshot,
} from '../../../shared/pageBuilderRevisionDiff.js';

/**
 * @param {import('mongoose').Document} layoutDoc
 * @param {{
 *   action: string;
 *   timeline: string;
 *   changeNote?: string;
 *   reachedProduction?: boolean;
 *   restoredFromVersion?: number;
 *   actor?: { userId?: string; email?: string };
 *   audit?: object;
 * }} options
 */
export async function createPageLayoutRevision(layoutDoc, options) {
  const pageKey = layoutDoc.pageKey;
  const locale = layoutDoc.locale;

  const updated = await CmsPageLayout.findOneAndUpdate(
    { pageKey, locale },
    { $inc: { revisionCounter: 1 } },
    { new: true },
  );

  const version = updated?.revisionCounter || 1;
  const snapshot = buildRevisionSnapshot(layoutDoc.toObject ? layoutDoc.toObject() : layoutDoc);

  const isDraft = options.timeline === REVISION_TIMELINES.DRAFT;
  const isPublished = options.timeline === REVISION_TIMELINES.PUBLISHED;

  if (isDraft) {
    await CmsPageLayoutRevision.updateMany(
      { pageKey, locale, isCurrentDraft: true },
      { $set: { isCurrentDraft: false } },
    );
  }
  if (isPublished) {
    await CmsPageLayoutRevision.updateMany(
      { pageKey, locale, isCurrentPublished: true },
      { $set: { isCurrentPublished: false } },
    );
  }

  const revision = await CmsPageLayoutRevision.create({
    pageKey,
    locale,
    version,
    action: options.action,
    timeline: options.timeline,
    changeNote: options.changeNote || '',
    reachedProduction: Boolean(options.reachedProduction),
    isCurrentDraft: isDraft,
    isCurrentPublished: isPublished,
    restoredFromVersion: options.restoredFromVersion,
    snapshot,
    createdBy: options.actor?.userId,
    createdByEmail: options.actor?.email || '',
    layoutId: layoutDoc._id,
  });

  const layoutUpdate = {};
  if (isDraft) layoutUpdate.currentDraftRevisionId = revision._id;
  if (isPublished) layoutUpdate.currentPublishedRevisionId = revision._id;
  if (Object.keys(layoutUpdate).length) {
    await CmsPageLayout.updateOne({ pageKey, locale }, { $set: layoutUpdate });
  }

  if (options.audit) {
    await logAudit({
      ...options.audit,
      action: `cms.pageLayout.revision.${options.action}`,
      targetType: 'cmsPageLayoutRevision',
      targetId: revision._id,
      targetLabel: `${pageKey}:${locale} v${version}`,
      metadata: {
        pageKey,
        locale,
        version,
        revisionAction: options.action,
        timeline: options.timeline,
        changeNote: options.changeNote || '',
      },
    });
  }

  return revision;
}

/**
 * @param {string} pageKey
 * @param {string} locale
 * @param {{ timeline?: string; page?: number; limit?: number }} [query]
 */
export async function listPageLayoutRevisions(pageKey, locale, query = {}) {
  const filter = { pageKey, locale };
  if (query.timeline && query.timeline !== 'all') filter.timeline = query.timeline;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CmsPageLayoutRevision.find(filter)
      .sort({ version: -1 })
      .skip(skip)
      .limit(limit)
      .select('-snapshot.draftBlocks -snapshot.publishedBlocks')
      .lean(),
    CmsPageLayoutRevision.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getPageLayoutRevisionById(revisionId) {
  return CmsPageLayoutRevision.findById(revisionId).lean();
}
