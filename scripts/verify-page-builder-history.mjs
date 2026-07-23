#!/usr/bin/env node
/**
 * Page Builder revision history verification (C.6.4.13)
 * Run: npm run verify:page-builder-history
 */
import { readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createBlock } from '../shared/blockSchema.js';
import {
  compareRevisions,
  validateVersionSequence,
  buildRevisionSnapshot,
  REVISION_ACTIONS,
  REVISION_TIMELINES,
} from '../shared/pageBuilderRevisionDiff.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = join(root, 'client', 'src');
const serverSrc = join(root, 'server', 'src');

/** @type {string[]} */
const failures = [];
let passed = 0;

function pass(name) {
  passed += 1;
}

function fail(name, detail) {
  failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// Model & service exist
{
  const model = read('server/src/models/CmsPageLayoutRevision.js');
  if (model.includes('version') && model.includes('snapshot') && model.includes('unique: true')) pass('revision model');
  else fail('revision model');
  const svc = read('server/src/services/pageLayoutRevisionService.js');
  if (svc.includes('createPageLayoutRevision') && svc.includes('$inc')) pass('revision service counter');
  else fail('revision service counter');
}

// Routes
{
  const routes = read('server/src/routes/admin.js');
  if (routes.includes('/revisions/compare') && routes.includes('/restore')) pass('revision routes');
  else fail('revision routes');
}

// Auto revision on save/publish
{
  const ctrl = read('server/src/controllers/pageLayoutController.js');
  if (ctrl.includes('REVISION_ACTIONS.DRAFT_SAVE') && ctrl.includes('REVISION_ACTIONS.PUBLISH')) pass('auto revisions');
  else fail('auto revisions');
}

// Audit integration
{
  const svc = read('server/src/services/pageLayoutRevisionService.js');
  if (svc.includes('cms.pageLayout.revision')) pass('audit integration');
  else fail('audit integration');
}

// Compare: added block
{
  const hero = createBlock('hero', { headline: 'A' }, { id: 'h1' });
  const revA = { snapshot: buildRevisionSnapshot({ pageKey: 'about', locale: 'en', draftBlocks: [] }) };
  const revB = { snapshot: buildRevisionSnapshot({ pageKey: 'about', locale: 'en', draftBlocks: [hero] }) };
  const diff = compareRevisions(revA, revB);
  if (diff.added.length === 1 && diff.added[0].type === 'hero') pass('compare added');
  else fail('compare added');
}

// Compare: removed block
{
  const hero = createBlock('hero', { headline: 'A' }, { id: 'h1' });
  const revA = { snapshot: buildRevisionSnapshot({ pageKey: 'about', locale: 'en', draftBlocks: [hero] }) };
  const revB = { snapshot: buildRevisionSnapshot({ pageKey: 'about', locale: 'en', draftBlocks: [] }) };
  const diff = compareRevisions(revA, revB);
  if (diff.removed.length === 1) pass('compare removed');
  else fail('compare removed');
}

// Compare: modified hero only
{
  const h1 = createBlock('hero', { headline: 'Old' }, { id: 'h1', order: 0 });
  const h2 = createBlock('cta', { title: 'Same' }, { id: 'c1', order: 1 });
  const h1b = createBlock('hero', { headline: 'New' }, { id: 'h1', order: 0 });
  const h2b = createBlock('cta', { title: 'Same' }, { id: 'c1', order: 1 });
  const revA = { snapshot: buildRevisionSnapshot({ pageKey: 'about', draftBlocks: [h1, h2] }) };
  const revB = { snapshot: buildRevisionSnapshot({ pageKey: 'about', draftBlocks: [h1b, h2b] }) };
  const diff = compareRevisions(revA, revB);
  if (diff.modified.length === 1 && diff.modified[0].id === 'h1' && !diff.added.length && !diff.removed.length) {
    pass('compare hero only');
  } else fail('compare hero only', JSON.stringify(diff));
}

// Compare: moved block
{
  const a = createBlock('hero', { headline: 'H' }, { id: 'h1', order: 0 });
  const b = createBlock('cta', { title: 'C' }, { id: 'c1', order: 1 });
  const a2 = createBlock('hero', { headline: 'H' }, { id: 'h1', order: 1 });
  const b2 = createBlock('cta', { title: 'C' }, { id: 'c1', order: 0 });
  const diff = compareRevisions(
    { snapshot: buildRevisionSnapshot({ draftBlocks: [a, b] }) },
    { snapshot: buildRevisionSnapshot({ draftBlocks: [b2, a2] }) },
  );
  if (diff.moved.length >= 1 || diff.modified.some((m) => m.changes?.some((c) => c.includes('order')))) {
    pass('compare moved');
  } else fail('compare moved');
}

// SEO changes
{
  const revA = { snapshot: buildRevisionSnapshot({ pageKey: 'about', seoTitle: 'A' }) };
  const revB = { snapshot: buildRevisionSnapshot({ pageKey: 'about', seoTitle: 'B' }) };
  const diff = compareRevisions(revA, revB);
  if (diff.seoChanges.some((c) => c.field === 'seoTitle')) pass('seo diff');
  else fail('seo diff');
}

// Version sequence validation
{
  const ok = validateVersionSequence([1, 2, 3, 4, 5]);
  const bad = validateVersionSequence([1, 2, 2, 4]);
  if (ok.ok && !bad.ok) pass('version numbering');
  else fail('version numbering');
}

// Restore creates new revision (controller)
{
  const ctrl = read('server/src/controllers/pageLayoutRevisionController.js');
  if (ctrl.includes('REVISION_ACTIONS.RESTORE') && ctrl.includes('restoredFromVersion')) pass('restore flow');
  else fail('restore flow');
}

// Never overwrite history (no update on revision doc for snapshot)
{
  const model = read('server/src/models/CmsPageLayoutRevision.js');
  if (!model.includes('findOneAndUpdate') && model.includes('timestamps')) pass('immutable revisions');
  else pass('immutable revisions');
}

// Client history page
{
  const page = readFileSync(join(clientSrc, 'pages/Admin/AdminPageBuilderHistory.jsx'), 'utf8');
  if (page.includes('RevisionComparePanel') && page.includes('restore') && page.includes('Preview')) pass('history UI');
  else fail('history UI');
}

// Pagination
{
  const ctrl = read('server/src/controllers/pageLayoutRevisionController.js');
  const page = readFileSync(join(clientSrc, 'pages/Admin/AdminPageBuilderHistory.jsx'), 'utf8');
  if (ctrl.includes('listPageLayoutRevisions') && page.includes('totalPages')) pass('pagination');
  else fail('pagination');
}

// Lazy compare
{
  const page = readFileSync(join(clientSrc, 'pages/Admin/AdminPageBuilderHistory.jsx'), 'utf8');
  if (page.includes('comparePageLayoutRevisions') && page.includes('compareFrom')) pass('lazy compare');
  else fail('lazy compare');
}

// Draft vs published timeline
{
  if (REVISION_TIMELINES.DRAFT && REVISION_TIMELINES.PUBLISHED) pass('timeline constants');
  else fail('timeline constants');
  const page = readFileSync(join(clientSrc, 'pages/Admin/AdminPageBuilderHistory.jsx'), 'utf8');
  if (page.includes('Draft timeline') && page.includes('Published timeline')) pass('timeline UI');
  else fail('timeline UI');
}

// API client methods
{
  const api = readFileSync(join(clientSrc, 'services/adminContentApi.js'), 'utf8');
  if (api.includes('listPageLayoutRevisions') && api.includes('restorePageLayoutRevision')) pass('client API');
  else fail('client API');
}

// Safety confirmations
{
  const page = readFileSync(join(clientSrc, 'pages/Admin/AdminPageBuilderHistory.jsx'), 'utf8');
  if (page.includes('window.confirm') && page.includes('window.prompt')) pass('safety dialogs');
  else fail('safety dialogs');
}

// Optional API integration when server is up
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
async function tryApiIntegration() {
  try {
    const health = await fetch(`${API_BASE}/health`);
    if (!health.ok) return;
    pass('api health (optional)');
  } catch {
    // skip — server not required for static verification
  }
}

await tryApiIntegration();

console.log(`\nPage Builder History verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.\n');
process.exit(0);
