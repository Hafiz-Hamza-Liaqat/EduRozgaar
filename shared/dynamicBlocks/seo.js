/**
 * SEO helpers for dynamic listing blocks (C.7.0.3).
 */
import { isDynamicBlockType, resolveDynamicSource } from './registry.js';

const LISTING_SOURCES = new Set([
  'latest-jobs',
  'featured-scholarships',
  'admissions',
  'universities',
  'latest-blogs',
  'career-guidance',
]);

/**
 * @param {import('../blockSchema.js').PageBlock[]} blocks
 * @param {string} [siteUrl]
 */
export function collectDynamicBlockJsonLd(blocks, siteUrl = '') {
  /** @type {object[]} */
  const schemas = [];
  const base = String(siteUrl || '').replace(/\/$/, '');

  for (const block of blocks || []) {
    if (block.enabled === false || !isDynamicBlockType(block.type)) continue;
    const source = resolveDynamicSource(block.type);
    if (!source || !LISTING_SOURCES.has(source)) continue;

    const title = block.config?.title || block.type;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: title,
      description: `Dynamic ${source} listing`,
      url: base ? `${base}${block.config?.buttonLink || ''}` : undefined,
    });
  }

  return schemas;
}

/**
 * Dedupe ItemList schemas by name.
 * @param {object[]} schemas
 */
export function dedupeDynamicJsonLd(schemas) {
  const seen = new Set();
  return schemas.filter((s) => {
    const key = `${s['@type']}:${s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
