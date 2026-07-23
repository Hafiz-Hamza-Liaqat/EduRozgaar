#!/usr/bin/env node
/**
 * Enterprise integration gap closure verification (C.7.0.7.1)
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runNpmScript(script) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Canonical integration hub
if (exists('server/src/utils/contentIntegration.js')) {
  const hub = read('server/src/utils/contentIntegration.js');
  if (hub.includes('onContentSaved') && hub.includes('onContentPublished') && hub.includes('onGlobalBlockMutated')) {
    pass('contentIntegration hub');
  } else fail('contentIntegration hub');
} else fail('contentIntegration hub exists');

// Search hooks via canonical hub (no parallel scheduleSearchIndexUpdate in migrated controllers)
{
  const checks = [
    ['cmsController', read('server/src/controllers/cmsController.js').includes('onContentSaved')],
    ['mediaController', read('server/src/controllers/admin/mediaController.js').includes('onContentSaved')],
    ['formAdminController', read('server/src/controllers/admin/formAdminController.js').includes('onContentSaved')],
    ['globalBlockController', read('server/src/controllers/globalBlockController.js').includes('onGlobalBlockMutated')],
    ['blockTemplateController', read('server/src/controllers/blockTemplateController.js').includes('onBlockTemplateMutated')],
    ['adminBlogsController uses hub', !read('server/src/controllers/admin/adminBlogsController.js').includes('scheduleSearchIndexUpdate')],
  ];
  for (const [name, ok] of checks) {
    if (ok) pass(`search hook: ${name}`);
    else fail(`search hook: ${name}`);
  }
}

// Analytics canonical paths
{
  const monetization = read('server/src/controllers/monetizationController.js');
  if (monetization.includes('scheduleAnalyticsEvent') && monetization.includes('ad_impression')) pass('analytics: ads');
  else fail('analytics: ads');

  const formPublic = read('server/src/controllers/formPublicController.js');
  if (formPublic.includes('scheduleAnalyticsEvent') && formPublic.includes('form_submit')) pass('analytics: forms');
  else fail('analytics: forms');

  const jobQueue = read('server/src/services/jobQueueService.js');
  if (jobQueue.includes('scheduleAnalyticsEvent') && !jobQueue.includes('AnalyticsEvent.create')) pass('analytics: job queue');
  else fail('analytics: job queue');

  const platformAnalytics = read('client/src/utils/platformAnalytics.js');
  if (platformAnalytics.includes('trackPlatformEvent') && platformAnalytics.includes('analyticsEventApi')) pass('analytics: client emitter');
  else fail('analytics: client emitter');

  const jobDetail = read('client/src/pages/Jobs/JobDetail.jsx');
  if (jobDetail.includes('useContentView')) pass('analytics: job detail view');
  else fail('analytics: job detail view');
}

// Media library unified upload
{
  const field = read('client/src/components/admin/AdminImageUrlField.jsx');
  if (field.includes('uploadMediaAssets') && field.includes('MediaAssetPicker')) pass('media: AdminImageUrlField');
  else fail('media: AdminImageUrlField');

  const blockCustom = read('client/src/components/pageBuilder/editors/BlockCustomField.jsx');
  if (blockCustom.includes('LogosItemsEditor') && blockCustom.includes('logo-grid')) pass('media: logo grid picker');
  else fail('media: logo grid picker');

  const richText = read('client/src/components/pageBuilder/editors/RichTextFieldEditor.jsx');
  if (richText.includes('MediaAssetPicker')) pass('media: rich text picker');
  else fail('media: rich text picker');
}

// Workflow publish integration
{
  const wfPub = read('server/src/services/workflow/workflowPublishIntegration.js');
  if (wfPub.includes('syncWorkflowPublished')) pass('workflow: publish integration');
  else fail('workflow: publish integration');

  const cms = read('server/src/controllers/cmsController.js');
  if (cms.includes('onContentPublished')) pass('workflow: cms publish hook');
  else fail('workflow: cms publish hook');

  const scheduler = read('server/src/services/workflow/workflowSchedulerService.js');
  if (scheduler.includes('onContentPublished')) pass('workflow: scheduler reindex');
  else fail('workflow: scheduler reindex');
}

// Shared utilities
if (exists('shared/datetime.js')) pass('shared datetime utility');
else fail('shared datetime utility');

// Cache invalidation in hub
{
  const hub = read('server/src/utils/contentIntegration.js');
  if (hub.includes('searchCacheInvalidatePrefix') && hub.includes('analyticsCacheClear')) pass('cache invalidation hub');
  else fail('cache invalidation hub');
}

// Duplicate utility detection (spot checks)
{
  const blogs = read('server/src/controllers/admin/adminBlogsController.js');
  if (!blogs.includes('syncWorkflowAfterSave') && blogs.includes('onContentSaved')) pass('no duplicate blog workflow+search');
  else fail('no duplicate blog workflow+search');
}

// Run existing verify suite
const SCRIPTS = [
  'verify:registry',
  'verify:blocks',
  'verify:workflow',
  'verify:analytics',
  'verify:search',
  'verify:dynamic-blocks',
  'verify:forms',
  'verify:media-library',
  'verify:page-builder-production',
  'verify:placements',
  'verify:platform-audit',
];

for (const script of SCRIPTS) {
  const { ok, out } = runNpmScript(script);
  if (ok) pass(`npm run ${script}`);
  else fail(`npm run ${script}`, out.split('\n').slice(-3).join(' ').trim());
}

console.log(`\nIntegration verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log('Enterprise integration checks passed.');
