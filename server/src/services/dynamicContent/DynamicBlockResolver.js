import { dynamicCacheKey } from '../../../../shared/dynamicBlocks/registry.js';
import { validateDynamicQuery } from '../../../../shared/dynamicBlocks/validation.js';
import { cacheGet, cacheSet } from './memoryCache.js';
import { batchQueryDynamicContent, queryDynamicContent } from './DynamicContentService.js';

/**
 * Dynamic Block Resolver (C.7.0.3).
 * Page Builder never queries MongoDB directly — all data flows through here.
 */
export class DynamicBlockResolver {
  /**
   * @param {string} source
   * @param {object} [query]
   * @param {object} [display]
   */
  constructor(source, query = {}, display = {}) {
    this.source = source;
    this.query = query;
    this.display = display;
  }

  cacheKey() {
    return dynamicCacheKey(this.source, this.query);
  }

  async fetch() {
    const key = this.cacheKey();
    const cached = await cacheGet(key);
    if (cached) return cached;

    const errors = validateDynamicQuery(this.source, this.query);
    if (errors.length) throw new Error(errors.join('; '));

    const raw = await queryDynamicContent(this.source, this.query);
    await cacheSet(key, raw);
    return raw;
  }

  transform(raw) {
    const items = (raw?.items || []).map((item) => ({
      ...item,
      href: item.href || '',
    }));
    return { items, total: raw?.total ?? items.length };
  }

  async renderModel() {
    const raw = await this.fetch();
    const transformed = this.transform(raw);
    return {
      source: this.source,
      items: transformed.items,
      total: transformed.total,
      display: this.display,
      empty: transformed.items.length === 0,
    };
  }
}

/**
 * @param {string} source
 * @param {object} query
 * @param {object} display
 */
export async function resolveDynamicBlock(source, query = {}, display = {}) {
  const resolver = new DynamicBlockResolver(source, query, display);
  return resolver.renderModel();
}

/**
 * @param {{ source: string; query?: object; display?: object }[]} blocks
 */
export async function resolveDynamicBlockBatch(blocks = []) {
  const uncached = [];
  /** @type {Map<string, object>} */
  const results = new Map();

  for (const block of blocks) {
    const key = dynamicCacheKey(block.source, block.query || {});
    const cached = await cacheGet(key);
    if (cached) {
      results.set(key, { source: block.source, ...cached, display: block.display });
    } else {
      uncached.push(block);
    }
  }

  if (uncached.length) {
    const fetched = await batchQueryDynamicContent(
      uncached.map((b) => ({ source: b.source, query: b.query })),
    );
    for (let i = 0; i < fetched.length; i += 1) {
      const raw = fetched[i];
      const block = uncached[i];
      const key = dynamicCacheKey(block.source, block.query || {});
      await cacheSet(key, raw);
      results.set(key, {
        source: block.source,
        items: raw.items,
        total: raw.total,
        display: block.display,
        empty: !raw.items?.length,
      });
    }
  }

  return [...results.values()];
}

export { invalidateDynamicSourceCache } from './memoryCache.js';
