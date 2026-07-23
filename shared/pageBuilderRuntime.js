/**
 * Page Builder runtime validation (C.6.4.9).
 */
import { getBlockDefinitionMap } from './blockRegistry.js';
import { validatePageBlocks } from './blockSchema.js';

const definitionMap = getBlockDefinitionMap();

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
export function getEnabledBlocks(blocks) {
  return (blocks || []).filter((b) => b && b.enabled !== false);
}

/**
 * @param {import('./blockSchema.js').PageBlock[]} blocks
 */
export function validateLayoutBlocks(blocks) {
  return validatePageBlocks(blocks || [], definitionMap);
}

/**
 * @param {{ status?: string; blocks?: import('./blockSchema.js').PageBlock[]; publishedBlocks?: import('./blockSchema.js').PageBlock[] }} layout
 * @param {{ preview?: boolean; requirePublished?: boolean }} [options]
 */
export function isRenderablePageLayout(layout, options = {}) {
  if (!layout) return false;
  const { preview = false, requirePublished = !preview } = options;

  if (requirePublished && layout.status !== 'published') return false;

  const blocks = layout.blocks || layout.publishedBlocks || layout.draftBlocks || [];
  const enabled = getEnabledBlocks(blocks);
  if (!enabled.length) return false;

  const errors = validateLayoutBlocks(blocks);
  if (errors.length) return false;

  return true;
}

/**
 * Normalize API layout payload for runtime rendering.
 * @param {Record<string, unknown>} raw
 */
export function normalizePageLayoutPayload(raw) {
  if (!raw) return null;
  return {
    pageKey: raw.pageKey,
    locale: raw.locale,
    title: raw.title || raw.pageKey,
    status: raw.status,
    blocks: raw.blocks || raw.publishedBlocks || raw.draftBlocks || [],
    publishedAt: raw.publishedAt,
    preview: Boolean(raw.preview),
    seoTitle: raw.seoTitle,
    metaDescription: raw.metaDescription,
    canonicalUrl: raw.canonicalUrl,
    ogImageUrl: raw.ogImageUrl,
    twitterCard: raw.twitterCard,
  };
}
