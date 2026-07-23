import { CmsPageLayout } from '../models/CmsPageLayout.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listResponse, paginate } from '../utils/apiResponse.js';
import { logAudit, auditFromRequest } from '../services/auditService.js';
import { normalizeLocale, paginateQuery } from '../utils/cmsHelpers.js';
import {
  getBlockDefinitionMap,
  REQUIRED_BLOCK_TYPES,
} from '../../../shared/blockRegistry.js';
import {
  reindexBlocks,
} from '../../../shared/blockSchema.js';
import {
  collectGlobalBlockIds,
  validatePageBlocksWithGlobals,
  globalBlockMapFromList,
} from '../../../shared/pageBuilderGlobalBlocks.js';
import { CmsGlobalBlock } from '../models/CmsGlobalBlock.js';
import { isRenderablePageLayout } from '../../../shared/pageBuilderRuntime.js';
import { syncWorkflowAfterSave } from '../services/workflow/workflowIntegration.js';
import { onContentPublished, onContentSaved } from '../utils/contentIntegration.js';
import {
  REVISION_ACTIONS,
  REVISION_TIMELINES,
} from '../../../shared/pageBuilderRevisionDiff.js';
import {
  createPageLayoutRevision,
} from '../services/pageLayoutRevisionService.js';

const definitionMap = getBlockDefinitionMap();

function sanitizeBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return reindexBlocks(
    raw.map((block) => {
      const base = {
        id: String(block.id || ''),
        type: String(block.type || ''),
        order: Number(block.order) || 0,
        enabled: block.enabled !== false,
        config: block.config && typeof block.config === 'object' ? block.config : {},
        metadata: block.metadata && typeof block.metadata === 'object' ? block.metadata : {},
      };
      if (block.globalBlockId) base.globalBlockId = String(block.globalBlockId);
      return base;
    }).filter((b) => b.id && b.type)
  );
}

async function loadGlobalBlockMap(blocks) {
  const ids = collectGlobalBlockIds(blocks);
  if (!ids.length) return new Map();
  const docs = await CmsGlobalBlock.find({ _id: { $in: ids } }).lean();
  return globalBlockMapFromList(docs);
}

export async function validateBlocksOrThrow(blocks) {
  const globalMap = await loadGlobalBlockMap(blocks);
  const errors = validatePageBlocksWithGlobals(blocks, globalMap);
  if (errors.length) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }
}

export const listPageLayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, locale, pageKey } = req.query;
  const filter = {};
  if (locale) filter.locale = normalizeLocale(locale);
  if (pageKey) filter.pageKey = String(pageKey).trim();

  const { skip, limit: lim } = paginateQuery(page, limit);
  const [items, total] = await Promise.all([
    CmsPageLayout.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(lim)
      .select('pageKey locale title status publishedAt updatedAt draftBlocks publishedBlocks')
      .lean(),
    CmsPageLayout.countDocuments(filter),
  ]);

  const rows = items.map((doc) => ({
    ...doc,
    draftBlockCount: doc.draftBlocks?.length || 0,
    publishedBlockCount: doc.publishedBlocks?.length || 0,
    draftBlocks: undefined,
    publishedBlocks: undefined,
  }));

  res.json(listResponse(rows, paginate(total, page, lim)));
});

export const getPageLayoutAdmin = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || req.query.pageKey || '').trim();
  const locale = normalizeLocale(req.query.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  let doc = await CmsPageLayout.findOne({ pageKey, locale }).lean();
  if (!doc) {
    doc = {
      pageKey,
      locale,
      title: pageKey,
      status: 'draft',
      draftBlocks: [],
      publishedBlocks: [],
    };
  }
  res.json(doc);
});

export const upsertPageLayout = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const pageKey = String(body.pageKey || '').trim();
  const locale = normalizeLocale(body.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  let doc = await CmsPageLayout.findOne({ pageKey, locale });
  const isCreate = !doc;
  if (!doc) doc = new CmsPageLayout({ pageKey, locale });

  if (body.title !== undefined) doc.title = String(body.title || '').trim() || pageKey;
  if (body.seoTitle !== undefined) doc.seoTitle = body.seoTitle;
  if (body.metaDescription !== undefined) doc.metaDescription = body.metaDescription;
  if (body.canonicalUrl !== undefined) doc.canonicalUrl = body.canonicalUrl;
  if (body.ogImageUrl !== undefined) doc.ogImageUrl = body.ogImageUrl;
  if (body.twitterCard !== undefined) doc.twitterCard = body.twitterCard;
  if (body.draftBlocks !== undefined) {
    const blocks = sanitizeBlocks(body.draftBlocks);
    await validateBlocksOrThrow(blocks);
    doc.draftBlocks = blocks;
    if (doc.status !== 'published') doc.status = 'draft';
  }

  doc.updatedBy = req.user?.userId;
  await doc.save();
  onContentSaved('page-builder', doc, { locale: doc.locale });

  await createPageLayoutRevision(doc, {
    action: REVISION_ACTIONS.DRAFT_SAVE,
    timeline: REVISION_TIMELINES.DRAFT,
    changeNote: String(body.changeNote || '').trim(),
    actor: { userId: req.user?.userId, email: req.user?.email },
    audit: auditFromRequest(req),
  });

  await logAudit({
    ...auditFromRequest(req),
    action: isCreate ? 'cms.pageLayout.create' : 'cms.pageLayout.update',
    targetType: 'cmsPageLayout',
    targetId: doc._id,
    targetLabel: `${pageKey}:${locale}`,
  });

  res.json(doc);
});

export const publishPageLayout = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || req.body?.pageKey || '').trim();
  const locale = normalizeLocale(req.params.locale || req.body?.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  const doc = await CmsPageLayout.findOne({ pageKey, locale });
  if (!doc) return res.status(404).json({ error: 'Page layout not found' });

  await validateBlocksOrThrow(doc.draftBlocks || []);
  doc.publishedBlocks = sanitizeBlocks(doc.draftBlocks);
  doc.status = 'published';
  doc.publishedAt = new Date();
  doc.updatedBy = req.user?.userId;
  await doc.save();
  await syncWorkflowAfterSave('page-builder', doc).catch(() => {});

  await createPageLayoutRevision(doc, {
    action: REVISION_ACTIONS.PUBLISH,
    timeline: REVISION_TIMELINES.PUBLISHED,
    changeNote: String(req.body?.changeNote || '').trim(),
    reachedProduction: true,
    actor: { userId: req.user?.userId, email: req.user?.email },
    audit: auditFromRequest(req),
  });

  await logAudit({
    ...auditFromRequest(req),
    action: 'cms.pageLayout.publish',
    targetType: 'cmsPageLayout',
    targetId: doc._id,
    targetLabel: `${pageKey}:${locale}`,
  });

  const actor = { userId: req.user?.userId, role: req.user?.role, email: req.user?.email };
  await onContentPublished('page-builder', doc._id, actor, { locale, title: doc.title });

  res.json(doc);
});

export const previewPageLayout = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || req.query.pageKey || '').trim();
  const locale = normalizeLocale(req.query.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  const doc = await CmsPageLayout.findOne({ pageKey, locale }).lean();
  if (!doc) {
    return res.json({
      pageKey,
      locale,
      title: pageKey,
      preview: true,
      blocks: [],
    });
  }

  res.json({
    pageKey: doc.pageKey,
    locale: doc.locale,
    title: doc.title || doc.pageKey,
    preview: true,
    blocks: doc.draftBlocks || [],
    seoTitle: doc.seoTitle,
    metaDescription: doc.metaDescription,
    canonicalUrl: doc.canonicalUrl,
    ogImageUrl: doc.ogImageUrl,
    twitterCard: doc.twitterCard,
  });
});

export const getPageLayoutPublished = asyncHandler(async (req, res) => {
  const pageKey = String(req.params.pageKey || '').trim();
  const locale = normalizeLocale(req.query.locale);
  if (!pageKey) return res.status(400).json({ error: 'pageKey is required' });

  const doc = await CmsPageLayout.findOne({ pageKey, locale, status: 'published' }).lean();
  if (!doc || !isRenderablePageLayout({ ...doc, blocks: doc.publishedBlocks }, { requirePublished: true })) {
    return res.status(404).json({ error: 'Published page layout not found' });
  }

  res.json({
    pageKey: doc.pageKey,
    locale: doc.locale,
    title: doc.title || doc.pageKey,
    status: doc.status,
    blocks: doc.publishedBlocks || [],
    publishedAt: doc.publishedAt,
    seoTitle: doc.seoTitle,
    metaDescription: doc.metaDescription,
    canonicalUrl: doc.canonicalUrl,
    ogImageUrl: doc.ogImageUrl,
    twitterCard: doc.twitterCard,
  });
});

export const getBlockRegistryMeta = asyncHandler(async (_req, res) => {
  res.json({
    blockTypes: REQUIRED_BLOCK_TYPES,
    categories: [...new Set([...definitionMap.values()].map((d) => d.category))].sort(),
  });
});
