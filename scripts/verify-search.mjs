#!/usr/bin/env node
/**
 * Global Search & Indexing verification (C.7.0.4)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SEARCH_ENTITY_TYPES, entityTypeLabel } from '../shared/search/entityTypes.js';
import { normalizeSearchDocument } from '../shared/search/searchDocument.js';
import { validateSearchQuery, parseSearchParams } from '../shared/search/validation.js';
import { scoreSearchDocument, rankSearchResults } from '../shared/search/scoring.js';
import { expandSearchSynonyms, SEARCH_SYNONYM_GROUPS } from '../shared/search/synonyms.js';
import { SEARCH_RANKING_WEIGHTS, SEARCH_DEBOUNCE_MS } from '../shared/search/rankingWeights.js';
import { SearchIndexer } from '../server/src/services/search/SearchIndexer.js';
import { findRelatedContent, RelatedContentService } from '../server/src/services/search/RelatedContentService.js';
import {
  buildSearchCacheKey,
  searchCacheGet,
  searchCacheSet,
  searchCacheClear,
} from '../server/src/services/search/searchCache.js';
import { mapJobToSearchDocument } from '../server/src/services/search/documentMappers.js';
import { extractRendererKeysFromMapSource, validateBlockRegistry } from '../shared/blockRegistryValidation.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// Entity types & document shape
{
  if (SEARCH_ENTITY_TYPES.length >= 10) pass('entity types registry size');
  else fail('entity types registry size', String(SEARCH_ENTITY_TYPES.length));
  if (SEARCH_ENTITY_TYPES.includes('talent-profile') && SEARCH_ENTITY_TYPES.includes('credential')) {
    pass('career search entity types');
  } else fail('career search entity types');
  const doc = normalizeSearchDocument({
    entityType: 'job',
    entityId: '1',
    title: 'Software Engineer',
    slug: 'software-engineer',
    url: '/jobs/software-engineer',
    summary: 'Great role',
    searchable: true,
    status: 'active',
  });
  if (doc.entityType === 'job' && doc.searchText.includes('software')) pass('normalize search document');
  else fail('normalize search document');
}

// Synonyms
{
  const expanded = expandSearchSynonyms('govt scholarship');
  if (expanded.includes('government') && expanded.includes('scholarship')) pass('synonym expansion');
  else fail('synonym expansion');
  if (Object.keys(SEARCH_SYNONYM_GROUPS).length >= 5) pass('synonym groups configured');
  else fail('synonym groups configured');
}

// Ranking
{
  const a = { title: 'Government Jobs', slug: 'government-jobs', featured: true, publishedAt: new Date().toISOString() };
  const b = { title: 'Other', slug: 'other', featured: false };
  const scoreA = scoreSearchDocument(a, 'government');
  const scoreB = scoreSearchDocument(b, 'government');
  if (scoreA > scoreB) pass('ranking weights');
  else fail('ranking weights');
  const ranked = rankSearchResults([b, a], 'government', 'relevance');
  if (ranked[0].title === 'Government Jobs') pass('rank sort');
  else fail('rank sort');
  if (SEARCH_RANKING_WEIGHTS.exactTitle > SEARCH_RANKING_WEIGHTS.summaryMatch) pass('centralized weights');
  else fail('centralized weights');
}

// Validation & params
{
  const errs = validateSearchQuery({ q: 'ab' });
  if (!errs.length) pass('valid search query');
  else fail('valid search query', errs.join('; '));
  const bad = validateSearchQuery({ q: 'x' });
  if (bad.length) pass('min query length');
  else fail('min query length');
  const params = parseSearchParams({ q: 'jobs', type: 'job', page: 2, limit: 10 });
  if (params.types[0] === 'job' && params.skip === 10) pass('parse search params');
  else fail('parse search params');
}

// SearchIndexer API
{
  if (typeof SearchIndexer.indexEntity === 'function'
    && typeof SearchIndexer.removeEntity === 'function'
    && typeof SearchIndexer.rebuildEntityType === 'function'
    && typeof SearchIndexer.rebuildAll === 'function') {
    pass('SearchIndexer methods');
  } else fail('SearchIndexer methods');
}

// Related content service
{
  if (typeof RelatedContentService.findRelated === 'function') pass('RelatedContentService');
  else fail('RelatedContentService');
}

// Cache
{
  await searchCacheClear();
  const key = buildSearchCacheKey({ q: 'test', page: 1 });
  await searchCacheSet(key, { results: [] });
  if (await searchCacheGet(key)) pass('search cache');
  else fail('search cache');
  await searchCacheClear();
}

// Mapper
{
  const mapped = mapJobToSearchDocument({
    _id: 'abc',
    title: 'Dev',
    slug: 'dev',
    status: 'active',
    company: 'Acme',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  if (mapped?.url === '/jobs/dev') pass('job document mapper');
  else fail('job document mapper');
}

// Labels
{
  if (entityTypeLabel('job') === 'Jobs') pass('entity type labels');
  else fail('entity type labels');
}

// Files
const required = [
  'shared/search/entityTypes.js',
  'shared/search/searchDocument.js',
  'shared/search/scoring.js',
  'shared/search/synonyms.js',
  'shared/search/validation.js',
  'shared/search/rankingWeights.js',
  'server/src/models/SearchDocument.js',
  'server/src/models/SearchQueryLog.js',
  'server/src/services/search/SearchIndexService.js',
  'server/src/services/search/SearchIndexer.js',
  'server/src/services/search/RelatedContentService.js',
  'server/src/services/search/documentMappers.js',
  'server/src/services/search/searchCache.js',
  'server/src/controllers/searchController.js',
  'server/src/controllers/admin/adminSearchController.js',
  'server/src/routes/search.js',
  'server/src/utils/searchIndexHooks.js',
  'client/src/services/searchApi.js',
  'client/src/components/search/GlobalSearch.jsx',
  'client/src/pages/Search/SearchResults.jsx',
  'client/src/pages/Admin/AdminGlobalSearch.jsx',
];
for (const f of required) {
  if (exists(f)) pass(`file ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Routes
{
  const index = read('server/src/index.js');
  if (index.includes('searchRouter')) pass('search API mounted');
  else fail('search API mounted');
  const routes = read('server/src/routes/search.js');
  if (routes.includes('/search') && routes.includes('/search/suggestions')) pass('search endpoints');
  else fail('search endpoints');
  const admin = read('server/src/routes/admin.js');
  if (admin.includes("'/search'")) pass('admin search route');
  else fail('admin search route');
}

// Client integration
{
  const home = read('client/src/pages/Home/Home.jsx');
  if (home.includes('GlobalSearch')) pass('homepage global search');
  else fail('homepage global search');
  const gs = read('client/src/components/search/GlobalSearch.jsx');
  if (gs.includes('role="combobox"') && gs.includes('SEARCH_DEBOUNCE_MS')) pass('accessibility combobox');
  else fail('accessibility combobox');
  if (gs.includes('ArrowDown') && gs.includes('Escape')) pass('keyboard navigation');
  else fail('keyboard navigation');
  const results = read('client/src/pages/Search/SearchResults.jsx');
  if (results.includes('noindex')) pass('search SEO noindex');
  else fail('search SEO noindex');
}

// Hooks (direct or via contentIntegration hub — C.7.0.7.1)
{
  const jobs = read('server/src/controllers/admin/adminJobsController.js');
  const hub = exists('server/src/utils/contentIntegration.js') ? read('server/src/utils/contentIntegration.js') : '';
  if (jobs.includes('scheduleSearchIndexUpdate') || jobs.includes('onContentSaved')) pass('job index hooks');
  else fail('job index hooks');
  const layout = read('server/src/controllers/pageLayoutController.js');
  if (layout.includes('scheduleSearchIndexUpdate') || layout.includes('onContentPublished') || layout.includes('onContentSaved')) pass('page builder index hook');
  else fail('page builder index hook');
  if (hub.includes('onContentSaved') && hub.includes('scheduleSearchIndexUpdate')) pass('canonical contentIntegration search');
  else fail('canonical contentIntegration search');
}

// Performance config
{
  if (SEARCH_DEBOUNCE_MS === 200) pass('debounce 200ms');
  else fail('debounce 200ms');
}

// Registry unchanged
{
  const mapSource = read('client/src/components/pageBuilder/blockComponentMap.js');
  const reg = validateBlockRegistry(extractRendererKeysFromMapSource(mapSource));
  if (reg.ok) pass('block registry parity');
  else fail('block registry parity', reg.errors?.join('; '));
}

console.log(`\nSearch verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.');
process.exit(0);
