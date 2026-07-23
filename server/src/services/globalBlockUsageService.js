import { CmsPageLayout } from '../models/CmsPageLayout.js';

/**
 * Find page layouts referencing a global block (draft and/or published).
 * @param {string} globalBlockId
 */
export async function findGlobalBlockUsage(globalBlockId) {
  const id = String(globalBlockId || '').trim();
  if (!id) return [];

  const layouts = await CmsPageLayout.find({
    $or: [
      { 'draftBlocks.globalBlockId': id },
      { 'publishedBlocks.globalBlockId': id },
    ],
  })
    .select('pageKey locale title status draftBlocks publishedBlocks')
    .lean();

  /** @type {{ pageKey: string; locale: string; title?: string; inDraft: boolean; inPublished: boolean }[]} */
  const usage = [];

  for (const doc of layouts) {
    const inDraft = (doc.draftBlocks || []).some((b) => String(b.globalBlockId) === id);
    const inPublished = (doc.publishedBlocks || []).some((b) => String(b.globalBlockId) === id);
    if (inDraft || inPublished) {
      usage.push({
        pageKey: doc.pageKey,
        locale: doc.locale,
        title: doc.title,
        inDraft,
        inPublished,
      });
    }
  }

  return usage;
}

/**
 * @param {string[]} globalBlockIds
 */
export async function countGlobalBlockUsage(globalBlockIds) {
  const counts = new Map();
  for (const gid of globalBlockIds) counts.set(gid, 0);

  const layouts = await CmsPageLayout.find({
    $or: [
      { 'draftBlocks.globalBlockId': { $in: globalBlockIds } },
      { 'publishedBlocks.globalBlockId': { $in: globalBlockIds } },
    ],
  })
    .select('draftBlocks publishedBlocks')
    .lean();

  for (const doc of layouts) {
    const seen = new Set();
    for (const block of [...(doc.draftBlocks || []), ...(doc.publishedBlocks || [])]) {
      const gid = block?.globalBlockId ? String(block.globalBlockId) : '';
      if (!gid || !counts.has(gid) || seen.has(`${doc._id}:${gid}`)) continue;
      seen.add(`${doc._id}:${gid}`);
      counts.set(gid, (counts.get(gid) || 0) + 1);
    }
  }

  return counts;
}
