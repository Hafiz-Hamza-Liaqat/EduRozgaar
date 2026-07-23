/**
 * Page Builder revision snapshot & diff utilities (C.6.4.13).
 */
import { sortBlocks } from './blockSchema.js';

export const REVISION_ACTIONS = {
  DRAFT_SAVE: 'draft_save',
  PUBLISH: 'publish',
  RESTORE: 'restore',
};

export const REVISION_TIMELINES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

const SEO_KEYS = ['seoTitle', 'metaDescription', 'canonicalUrl', 'ogImageUrl', 'twitterCard'];
const META_KEYS = ['title'];

/**
 * @param {object} layoutDoc
 */
export function buildRevisionSnapshot(layoutDoc) {
  return {
    title: layoutDoc.title || layoutDoc.pageKey || '',
    status: layoutDoc.status || 'draft',
    draftBlocks: sortBlocks(layoutDoc.draftBlocks || []),
    publishedBlocks: sortBlocks(layoutDoc.publishedBlocks || []),
    seo: {
      seoTitle: layoutDoc.seoTitle || '',
      metaDescription: layoutDoc.metaDescription || '',
      canonicalUrl: layoutDoc.canonicalUrl || '',
      ogImageUrl: layoutDoc.ogImageUrl || '',
      twitterCard: layoutDoc.twitterCard || 'summary_large_image',
    },
    metadata: {
      publishedAt: layoutDoc.publishedAt || null,
    },
  };
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
function blockMap(blocks) {
  const map = new Map();
  for (const b of sortBlocks(blocks)) {
    map.set(b.id, b);
  }
  return map;
}

function stableBlockSignature(block) {
  return JSON.stringify({
    type: block.type,
    order: block.order,
    enabled: block.enabled !== false,
    config: block.config || {},
    globalBlockId: block.globalBlockId || null,
    metadata: block.metadata || {},
  });
}

/**
 * @param {object} revisionA
 * @param {object} revisionB
 * @param {{ timeline?: 'draft'|'published' }} [options]
 */
export function compareRevisions(revisionA, revisionB, options = {}) {
  const timeline = options.timeline || 'draft';
  const pickBlocks = (rev) => {
    const snap = rev?.snapshot || rev;
    if (timeline === 'published') return snap.publishedBlocks || [];
    return snap.draftBlocks || snap.blocks || [];
  };

  const blocksA = pickBlocks(revisionA);
  const blocksB = pickBlocks(revisionB);
  const mapA = blockMap(blocksA);
  const mapB = blockMap(blocksB);

  /** @type {{ id: string; type: string; label: string }[]} */
  const added = [];
  /** @type {{ id: string; type: string; label: string }[]} */
  const removed = [];
  /** @type {{ id: string; type: string; from: number; to: number }[]} */
  const moved = [];
  /** @type {{ id: string; type: string; changes: string[] }[]} */
  const modified = [];

  for (const [id, block] of mapB) {
    if (!mapA.has(id)) {
      added.push({ id, type: block.type, label: blockLabel(block) });
    }
  }

  for (const [id, block] of mapA) {
    if (!mapB.has(id)) {
      removed.push({ id, type: block.type, label: blockLabel(block) });
    }
  }

  for (const [id, blockA] of mapA) {
    const blockB = mapB.get(id);
    if (!blockB) continue;
    const orderA = blockA.order ?? 0;
    const orderB = blockB.order ?? 0;
    if (orderA !== orderB && stableBlockSignature(blockA) === stableBlockSignature(blockB)) {
      moved.push({ id, type: blockA.type, from: orderA + 1, to: orderB + 1 });
    } else if (stableBlockSignature(blockA) !== stableBlockSignature(blockB)) {
      modified.push({
        id,
        type: blockA.type,
        changes: describeBlockChanges(blockA, blockB),
      });
    }
  }

  const seoA = revisionA?.snapshot?.seo || {};
  const seoB = revisionB?.snapshot?.seo || {};
  /** @type {{ field: string; from: string; to: string }[]} */
  const seoChanges = [];
  for (const key of SEO_KEYS) {
    const from = String(seoA[key] ?? '');
    const to = String(seoB[key] ?? '');
    if (from !== to) seoChanges.push({ field: key, from, to });
  }

  const metaA = {
    title: revisionA?.snapshot?.title ?? '',
    ...(revisionA?.snapshot?.metadata || {}),
  };
  const metaB = {
    title: revisionB?.snapshot?.title ?? '',
    ...(revisionB?.snapshot?.metadata || {}),
  };
  /** @type {{ field: string; from: string; to: string }[]} */
  const metadataChanges = [];
  for (const key of [...META_KEYS, 'publishedAt']) {
    const from = String(metaA[key] ?? '');
    const to = String(metaB[key] ?? '');
    if (from !== to) metadataChanges.push({ field: key, from, to });
  }

  return {
    timeline,
    added,
    removed,
    moved,
    modified,
    seoChanges,
    metadataChanges,
    hasChanges: Boolean(
      added.length || removed.length || moved.length || modified.length
      || seoChanges.length || metadataChanges.length,
    ),
  };
}

function blockLabel(block) {
  const cfg = block.config || {};
  return cfg.headline || cfg.title || cfg.heading || block.type;
}

function describeBlockChanges(a, b) {
  /** @type {string[]} */
  const changes = [];
  if (a.type !== b.type) changes.push(`type: ${a.type} → ${b.type}`);
  if (Boolean(a.enabled) !== Boolean(b.enabled)) changes.push(`enabled: ${a.enabled} → ${b.enabled}`);
  if (String(a.globalBlockId || '') !== String(b.globalBlockId || '')) changes.push('global link changed');
  if (JSON.stringify(a.config || {}) !== JSON.stringify(b.config || {})) changes.push('configuration changed');
  if ((a.order ?? 0) !== (b.order ?? 0)) changes.push(`order: ${(a.order ?? 0) + 1} → ${(b.order ?? 0) + 1}`);
  return changes;
}

/**
 * @param {number[]} versions
 */
export function validateVersionSequence(versions) {
  if (!versions.length) return { ok: true, errors: [] };
  const sorted = [...versions].sort((a, b) => a - b);
  /** @type {string[]} */
  const errors = [];
  const seen = new Set();
  for (const v of sorted) {
    if (seen.has(v)) errors.push(`Duplicate version number: ${v}`);
    seen.add(v);
  }
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      errors.push(`Version gap between ${sorted[i - 1]} and ${sorted[i]}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function actionDisplayLabel(action) {
  const labels = {
    draft_save: 'Draft Save',
    publish: 'Publish',
    restore: 'Restore',
  };
  return labels[action] || action;
}
