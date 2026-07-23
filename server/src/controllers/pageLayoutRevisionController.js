import { CmsPageLayout } from '../models/CmsPageLayout.js';
import { CmsPageLayoutRevision } from '../models/CmsPageLayoutRevision.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listResponse, paginate } from '../utils/apiResponse.js';
import { auditFromRequest } from '../services/auditService.js';
import { normalizeLocale } from '../utils/cmsHelpers.js';
import { reindexBlocks } from '../../../shared/blockSchema.js';
import {
  compareRevisions,
  REVISION_ACTIONS,
  REVISION_TIMELINES,
} from '../../../shared/pageBuilderRevisionDiff.js';
import {
  createPageLayoutRevision,
  getPageLayoutRevisionById,
  listPageLayoutRevisions,
} from '../services/pageLayoutRevisionService.js';
import { validateBlocksOrThrow } from './pageLayoutController.js';

function revisionSummary(doc) {
  if (!doc) return null;
  return {
    _id: doc._id,
    pageKey: doc.pageKey,
    locale: doc.locale,
    version: doc.version,
    action: doc.action,
    timeline: doc.timeline,
    changeNote: doc.changeNote || '',
    reachedProduction: Boolean(doc.reachedProduction),
    isCurrentDraft: Boolean(doc.isCurrentDraft),
    isCurrentPublished: Boolean(doc.isCurrentPublished),
    restoredFromVersion: doc.restoredFromVersion,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    createdByEmail: doc.createdByEmail || '',
    blockCount: doc.snapshot?.draftBlocks?.length || doc.snapshot?.publishedBlocks?.length || 0,
    title: doc.snapshot?.title || '',
  };
}

export const listRevisions = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || '').trim();
  const locale = normalizeLocale(req.params.locale || req.query.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  const { items, total, page, limit } = await listPageLayoutRevisions(pageKey, locale, req.query);
  res.json(listResponse(items.map(revisionSummary), paginate(page, limit, total)));
});

export const getRevision = asyncHandler(async (req, res) => {
  const doc = await getPageLayoutRevisionById(req.params.revisionId);
  if (!doc) return res.status(404).json({ error: 'Revision not found' });
  res.json(doc);
});

export const compareRevisionPair = asyncHandler(async (req, res) => {
  const { fromId, toId, timeline = 'draft' } = req.query;
  if (!fromId || !toId) return res.status(400).json({ error: 'fromId and toId are required' });

  const [fromRev, toRev] = await Promise.all([
    getPageLayoutRevisionById(fromId),
    getPageLayoutRevisionById(toId),
  ]);
  if (!fromRev || !toRev) return res.status(404).json({ error: 'One or both revisions not found' });

  const diff = compareRevisions(fromRev, toRev, { timeline });
  res.json({
    from: revisionSummary(fromRev),
    to: revisionSummary(toRev),
    diff,
  });
});

export const previewRevision = asyncHandler(async (req, res) => {
  const doc = await getPageLayoutRevisionById(req.params.revisionId);
  if (!doc) return res.status(404).json({ error: 'Revision not found' });

  const timeline = req.query.timeline === 'published' ? 'published' : 'draft';
  const blocks = timeline === 'published'
    ? doc.snapshot?.publishedBlocks || []
    : doc.snapshot?.draftBlocks || [];

  res.json({
    pageKey: doc.pageKey,
    locale: doc.locale,
    title: doc.snapshot?.title || doc.pageKey,
    preview: true,
    revisionId: doc._id,
    version: doc.version,
    timeline,
    blocks,
    seo: doc.snapshot?.seo || {},
  });
});

export const restoreRevision = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || '').trim();
  const locale = normalizeLocale(req.params.locale);
  const revisionId = req.params.revisionId;
  const changeNote = String(req.body?.changeNote || '').trim();

  const revision = await getPageLayoutRevisionById(revisionId);
  if (!revision || revision.pageKey !== pageKey || revision.locale !== locale) {
    return res.status(404).json({ error: 'Revision not found for this page' });
  }

  let doc = await CmsPageLayout.findOne({ pageKey, locale });
  if (!doc) {
    doc = new CmsPageLayout({ pageKey, locale });
  }

  const snap = revision.snapshot || {};
  const restoredBlocks = reindexBlocks(snap.draftBlocks || []);
  await validateBlocksOrThrow(restoredBlocks);

  doc.title = snap.title || doc.title || pageKey;
  doc.draftBlocks = restoredBlocks;
  if (snap.seo) {
    doc.seoTitle = snap.seo.seoTitle;
    doc.metaDescription = snap.seo.metaDescription;
    doc.canonicalUrl = snap.seo.canonicalUrl;
    doc.ogImageUrl = snap.seo.ogImageUrl;
    doc.twitterCard = snap.seo.twitterCard;
  }
  if (doc.status !== 'published') doc.status = 'draft';
  doc.updatedBy = req.user?.userId;
  await doc.save();

  const newRevision = await createPageLayoutRevision(doc, {
    action: REVISION_ACTIONS.RESTORE,
    timeline: REVISION_TIMELINES.DRAFT,
    changeNote: changeNote || `Restored from version ${revision.version}`,
    restoredFromVersion: revision.version,
    actor: { userId: req.user?.userId, email: req.user?.email },
    audit: auditFromRequest(req),
  });

  res.json({
    layout: doc,
    revision: revisionSummary(newRevision),
  });
});

export const deleteRevision = asyncHandler(async (req, res) => {
  const doc = await CmsPageLayoutRevision.findById(req.params.revisionId);
  if (!doc) return res.status(404).json({ error: 'Revision not found' });

  if (doc.isCurrentDraft || doc.isCurrentPublished) {
    return res.status(400).json({ error: 'Cannot delete the current revision' });
  }

  const count = await CmsPageLayoutRevision.countDocuments({
    pageKey: doc.pageKey,
    locale: doc.locale,
  });
  if (count <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only revision for this page' });
  }

  await doc.deleteOne();
  res.json({ ok: true });
});
