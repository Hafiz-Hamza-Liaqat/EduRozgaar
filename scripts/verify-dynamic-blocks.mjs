#!/usr/bin/env node
/**
 * Dynamic Content Blocks verification (C.7.0.3)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  DYNAMIC_BLOCK_TYPES,
  BLOCK_TYPE_TO_SOURCE,
  buildDynamicQuery,
  buildDisplayOptions,
  dynamicCacheKey,
  isDynamicBlockType,
  resolveDynamicSource,
} from '../shared/dynamicBlocks/registry.js';
import { validateDynamicQuery } from '../shared/dynamicBlocks/validation.js';
import { collectDynamicBlockJsonLd, dedupeDynamicJsonLd } from '../shared/dynamicBlocks/seo.js';
import { resolvePageBuilderSeo } from '../shared/pageBuilderSeo.js';
import { getBlockDefinition } from '../shared/blockRegistry.js';
import { extractRendererKeysFromMapSource, validateBlockRegistry } from '../shared/blockRegistryValidation.js';
import { DynamicBlockResolver } from '../server/src/services/dynamicContent/DynamicBlockResolver.js';
import {
  cacheGet,
  cacheSet,
  cacheClear,
  invalidateDynamicSourceCache,
  cacheStats,
} from '../server/src/services/dynamicContent/memoryCache.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }
function exists(rel) { return docExists(root, rel); }

// Registry
{
  if (DYNAMIC_BLOCK_TYPES.length === 8) pass('8 dynamic block types');
  else fail('8 dynamic block types', String(DYNAMIC_BLOCK_TYPES.length));
  if (Object.keys(BLOCK_TYPE_TO_SOURCE).length === 8) pass('block type → source map');
  else fail('block type → source map');
  const govQuery = buildDynamicQuery('featured-jobs', { governmentOnly: true, count: 6 });
  if (govQuery.governmentOnly && govQuery.count === 6) pass('jobs government filter query');
  else fail('jobs government filter query');
  const ukQuery = buildDynamicQuery('featured-scholarships', { country: 'UK' });
  if (ukQuery.country === 'UK') pass('scholarships country filter');
  else fail('scholarships country filter');
  const blogQuery = buildDynamicQuery('dynamic-blogs', { category: 'Career' });
  if (blogQuery.category === 'Career') pass('blogs category filter');
  else fail('blogs category filter');
  const display = buildDisplayOptions('featured-jobs', { title: 'Jobs' });
  if (display.title === 'Jobs' && display.showDeadline) pass('display options');
  else fail('display options');
  const key = dynamicCacheKey('latest-jobs', { count: 6 });
  if (key.startsWith('dynamic:latest-jobs:')) pass('cache key format');
  else fail('cache key format');
}

// Validation
{
  const ok = validateDynamicQuery('latest-jobs', { count: 6 });
  if (!ok.length) pass('valid query');
  else fail('valid query', ok.join('; '));
  const bad = validateDynamicQuery('unknown', {});
  if (bad.length) pass('invalid source rejected');
  else fail('invalid source rejected');
  const over = validateDynamicQuery('latest-jobs', { count: 99 });
  if (over.length) pass('count cap validation');
  else fail('count cap validation');
}

// Resolver API surface
{
  const resolver = new DynamicBlockResolver('latest-jobs', { count: 3 });
  if (typeof resolver.fetch === 'function'
    && typeof resolver.transform === 'function'
    && typeof resolver.cacheKey === 'function'
    && typeof resolver.renderModel === 'function') {
    pass('DynamicBlockResolver methods');
  } else fail('DynamicBlockResolver methods');
  const raw = { items: [{ id: '1', title: 'Test', href: '/jobs/x' }], total: 1 };
  const transformed = resolver.transform(raw);
  if (transformed.items[0].href === '/jobs/x') pass('resolver transform');
  else fail('resolver transform');
}

// Memory cache
{
  await cacheClear();
  await cacheSet('dynamic:latest-jobs:{"count":1}', { items: [], total: 0 }, 5000);
  if (await cacheGet('dynamic:latest-jobs:{"count":1}')) pass('cache set/get');
  else fail('cache set/get');
  await invalidateDynamicSourceCache('latest-jobs');
  if (!(await cacheGet('dynamic:latest-jobs:{"count":1}'))) pass('cache invalidation by source');
  else fail('cache invalidation by source');
  if (cacheStats().namespace) pass('cache stats');
  else fail('cache stats');
  await cacheClear();
}

// SEO
{
  const blocks = [{
    type: 'featured-jobs',
    enabled: true,
    config: { title: 'Latest Jobs', buttonLink: '/jobs' },
  }];
  const schemas = collectDynamicBlockJsonLd(blocks, 'https://edurozgaar.pk');
  if (schemas[0]?.['@type'] === 'ItemList') pass('dynamic JSON-LD');
  else fail('dynamic JSON-LD');
  const deduped = dedupeDynamicJsonLd([...schemas, ...schemas]);
  if (deduped.length === 1) pass('JSON-LD dedupe');
  else fail('JSON-LD dedupe');
  const seo = resolvePageBuilderSeo({
    layout: { blocks },
    siteUrl: 'https://edurozgaar.pk',
  });
  if (seo.dynamicSchemas?.length === 1) pass('page builder SEO integration');
  else fail('page builder SEO integration');
}

// Block registry parity
{
  for (const type of DYNAMIC_BLOCK_TYPES) {
    const def = getBlockDefinition(type);
    if (!def?.rendererKey) fail(`registry entry ${type}`);
    else if (!isDynamicBlockType(type)) fail(`isDynamicBlockType ${type}`);
    else pass(`registry ${type}`);
  }
  const mapSource = read('client/src/components/pageBuilder/blockComponentMap.js');
  const reg = validateBlockRegistry(extractRendererKeysFromMapSource(mapSource));
  if (reg.ok) pass('block registry parity (22 blocks)');
  else fail('block registry parity', reg.errors?.join('; '));
}

// File structure
const requiredFiles = [
  'shared/dynamicBlocks/registry.js',
  'shared/dynamicBlocks/validation.js',
  'shared/dynamicBlocks/seo.js',
  'server/src/services/dynamicContent/DynamicContentService.js',
  'server/src/services/dynamicContent/DynamicBlockResolver.js',
  'server/src/services/dynamicContent/memoryCache.js',
  'server/src/controllers/dynamicContentController.js',
  'server/src/routes/dynamicContent.js',
  'client/src/services/dynamicContentApi.js',
  'client/src/components/pageBuilder/dynamic/DynamicBlockRenderer.jsx',
  'client/src/components/pageBuilder/dynamic/DynamicBlockSettingsEditor.jsx',
  'client/src/components/pageBuilder/dynamic/dynamicBlockLayouts.jsx',
  'client/src/components/pageBuilder/BlockConfigFields.jsx',
];
for (const f of requiredFiles) {
  if (exists(f)) pass(`file ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Route wiring
{
  const index = read('server/src/index.js');
  if (index.includes('dynamicContentRouter')) pass('API route mounted');
  else fail('API route mounted');
  const routes = read('server/src/routes/dynamicContent.js');
  if (routes.includes('/dynamic-content/:source') && routes.includes('/dynamic-content/batch')) {
    pass('dynamic content endpoints');
  } else fail('dynamic content endpoints');
}

// Client integration
{
  const fields = read('client/src/components/pageBuilder/BlockConfigFields.jsx');
  if (fields.includes('DynamicBlockSettingsEditor') && fields.includes('isDynamicBlockType')) {
    pass('settings editor wired');
  } else fail('settings editor wired');
  const renderer = read('client/src/components/pageBuilder/dynamic/DynamicBlockRenderer.jsx');
  if (renderer.includes('empty && !preview') && renderer.includes('DynamicBlockSkeleton')) {
    pass('runtime empty/loading states');
  } else fail('runtime empty/loading states');
  const blocks = read('client/src/components/pageBuilder/blocks/index.jsx');
  if (blocks.includes('DynamicBlockRenderer') && !blocks.includes('FeaturedListingBlock')) {
    pass('legacy listing removed');
  } else fail('legacy listing removed');
}

// Source resolution from block type param
{
  if (resolveDynamicSource('featured-jobs') === 'latest-jobs') pass('block type resolves to source');
  else fail('block type resolves to source');
}

console.log(`\nDynamic Blocks verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.');
process.exit(0);
