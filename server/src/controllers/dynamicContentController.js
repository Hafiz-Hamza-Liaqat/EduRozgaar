import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveDynamicSource } from '../../../shared/dynamicBlocks/registry.js';
import { validateDynamicQuery } from '../../../shared/dynamicBlocks/validation.js';
import { resolveDynamicBlock, resolveDynamicBlockBatch } from '../services/dynamicContent/DynamicBlockResolver.js';
import { invalidateDynamicSourceCache, cacheStats, cacheClear } from '../services/dynamicContent/memoryCache.js';

export const getDynamicContent = asyncHandler(async (req, res) => {
  const source = resolveDynamicSource(req.params.source) || req.params.source;
  const query = { ...req.query };
  if (query.count) query.count = Number(query.count);

  const errors = validateDynamicQuery(source, query);
  if (errors.length) return res.status(400).json({ error: 'Invalid query', details: errors });

  const model = await resolveDynamicBlock(source, query, {
    title: query.title,
    emptyMessage: query.emptyMessage,
  });
  res.json(model);
});

export const postDynamicContentBatch = asyncHandler(async (req, res) => {
  const requests = Array.isArray(req.body?.blocks) ? req.body.blocks : [];
  if (!requests.length) return res.status(400).json({ error: 'blocks array required' });

  for (const block of requests) {
    const source = resolveDynamicSource(block.source) || block.source;
    const errors = validateDynamicQuery(source, block.query || {});
    if (errors.length) return res.status(400).json({ error: 'Invalid query', details: errors, source });
    block.source = source;
  }

  const results = await resolveDynamicBlockBatch(requests);
  res.json({ results });
});

export const invalidateCache = asyncHandler(async (req, res) => {
  const { source } = req.body || {};
  if (source) await invalidateDynamicSourceCache(source);
  else await cacheClear();
  res.json({ ok: true, stats: cacheStats() });
});
