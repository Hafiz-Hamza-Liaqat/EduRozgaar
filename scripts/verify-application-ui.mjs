#!/usr/bin/env node
/**
 * OpportunityApplication UI integration verification (C.8.0.3B).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PIPELINE_STAGES } from '../shared/career/constants.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runNpm(script, cwd = root) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd,
    encoding: 'utf8',
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Routes registered
{
  const routes = read('client/src/routes/index.jsx');
  const constants = read('client/src/constants/index.js');
  if (constants.includes('APPLICATIONS') && constants.includes('APPLICATIONS_NEW')) pass('route constants');
  else fail('route constants');
  if (routes.includes('MyApplications') && routes.includes('ApplicationDetail') && routes.includes('CreateApplication')) {
    pass('lazy routes');
  } else fail('lazy routes');
  if (routes.includes('ROUTES.APPLICATIONS') && routes.includes('ProtectedRoute')) pass('protected applications routes');
  else fail('protected applications routes');
}

// API integration via applicationsApi only
{
  const api = read('client/src/services/applicationsApi.js');
  const pages = [
    'client/src/pages/Applications/MyApplications.jsx',
    'client/src/pages/Applications/ApplicationDetail.jsx',
    'client/src/pages/Applications/CreateApplication.jsx',
  ];
  if (api.includes('/applications') && !api.includes('/jobs/')) pass('applicationsApi endpoints');
  else fail('applicationsApi endpoints');

  let legacyLeak = false;
  for (const p of pages) {
    const c = read(p);
    if (!c.includes('applicationsApi')) fail(`${p} missing applicationsApi`);
    else pass(`${p.split('/').pop()} uses applicationsApi`);
    if (c.includes('applicationsApi') === false) legacyLeak = true;
    if (c.includes('listingsService') && c.includes('applicationsApi')) {
      // listingsService for unrelated things ok - pages should not import legacy apply
    }
    if (c.match(/applicationsApi|applications\/:id/)) {
      /* ok */
    }
    if (c.includes('POST') && c.includes('/resumes')) legacyLeak = true;
  }
  for (const p of pages) {
    const c = read(p);
    if (c.includes('Application.create') || c.includes('resumesApi.create')) legacyLeak = true;
  }
  if (!legacyLeak) pass('no legacy Application writes in UI');
  else fail('no legacy Application writes in UI');
}

// No direct legacy application API in UI pages
{
  const forbidden = ['applyToJob', 'InternshipApplication', 'applicationsController'];
  const files = [
    'client/src/pages/Applications/MyApplications.jsx',
    'client/src/pages/Applications/ApplicationDetail.jsx',
    'client/src/pages/Applications/CreateApplication.jsx',
    'client/src/components/applications/DocumentPicker.jsx',
  ];
  let leaked = false;
  for (const f of files) {
    const c = read(f);
    for (const w of forbidden) {
      if (c.includes(w)) leaked = true;
    }
  }
  if (!leaked) pass('no legacy model references');
  else fail('no legacy model references');
}

// TalentProfile document picker
{
  const picker = read('client/src/components/applications/DocumentPicker.jsx');
  const create = read('client/src/pages/Applications/CreateApplication.jsx');
  if (picker.includes('talentApi') && picker.includes('listDocuments')) pass('document picker talentApi');
  else fail('document picker talentApi');
  if (create.includes('DocumentPicker') && create.includes('attachDocument')) pass('create attaches profile document');
  else fail('create attaches profile document');
}

// Localization
{
  const i18n = read('client/src/i18n/config.js');
  const en = exists('client/src/i18n/locales/en/applications.json');
  const ur = exists('client/src/i18n/locales/ur/applications.json');
  if (i18n.includes("'applications'") && en && ur) pass('applications i18n namespace');
  else fail('applications i18n namespace');

  const enJson = JSON.parse(read('client/src/i18n/locales/en/applications.json'));
  if (PIPELINE_STAGES.every((s) => enJson.stages?.[s])) pass('all stage labels localized');
  else fail('all stage labels localized');

  const list = read('client/src/pages/Applications/MyApplications.jsx');
  if (list.includes("useTranslation(['applications'") && list.includes('applications:')) pass('pages use applications namespace');
  else fail('pages use applications namespace');

  const util = read('client/src/utils/applicationUi.js');
  if (util.includes('formatApplicationDate') && util.includes('getLanguageConfig')) pass('locale date formatting');
  else fail('locale date formatting');
}

// Feature flags
{
  const flags = read('client/src/config/careerFeatureFlags.js');
  const list = read('client/src/pages/Applications/MyApplications.jsx');
  if (flags.includes('VITE_OPPORTUNITY_APPLICATION_ENABLED') && flags.includes('isOpportunityApplicationEnabled')) {
    pass('client feature flag');
  } else fail('client feature flag');
  if (list.includes('isOpportunityApplicationEnabled')) pass('pages honor feature flag');
  else fail('pages honor feature flag');
}

// UI components — stage badges, timeline, responsive
{
  for (const f of [
    'client/src/components/applications/StageBadge.jsx',
    'client/src/components/applications/StageTimeline.jsx',
    'client/src/components/applications/ApplicationCard.jsx',
  ]) {
    if (exists(f)) pass(`component ${f.split('/').pop()}`);
    else fail(`component ${f.split('/').pop()}`);
  }
  const list = read('client/src/pages/Applications/MyApplications.jsx');
  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  if (list.includes('sm:flex-row') || list.includes('flex-col')) pass('responsive list layout');
  else fail('responsive list layout');
  if (detail.includes('StageTimeline') && detail.includes('stageHistory')) pass('detail stage timeline');
  else fail('detail stage timeline');
}

// Accessibility
{
  const list = read('client/src/pages/Applications/MyApplications.jsx');
  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  const badge = read('client/src/components/applications/StageBadge.jsx');
  if (list.includes('aria-label') || list.includes('aria-pressed') || list.includes('sr-only')) pass('list a11y attributes');
  else fail('list a11y attributes');
  if (detail.includes('aria-labelledby') || detail.includes('role="list"')) pass('detail a11y structure');
  else fail('detail a11y structure');
  if (badge.includes('aria-label')) pass('stage badge a11y');
  else fail('stage badge a11y');
  if (list.includes('min-h-[44px]') || list.includes('focus-visible:ring')) pass('keyboard/touch targets');
  else fail('keyboard/touch targets');
}

// Detail sections
{
  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  for (const section of ['notesTitle', 'documentsTitle', 'remindersTitle', 'activityTitle', 'stageHistoryTitle']) {
    if (detail.includes(section)) pass(`detail section ${section}`);
    else fail(`detail section ${section}`);
  }
}

// Platform track CTA (one-click create → tracker; advanced form remains separate)
{
  const scholarship = read('client/src/pages/Scholarships/ScholarshipDetail.jsx');
  const create = read('client/src/pages/Applications/CreateApplication.jsx');
  if (
    scholarship.includes('applicationsApi.create')
    && scholarship.includes("opportunityType: 'scholarship'")
    && scholarship.includes('APPLICATIONS')
  ) {
    pass('scholarship platform track link');
  } else fail('scholarship platform track link');
  if (create.includes("mode === 'external'") && create.includes('externalUrl')) pass('external create mode');
  else fail('external create mode');
}

// Env template
{
  const env = read('.env.template');
  if (env.includes('VITE_OPPORTUNITY_APPLICATION_ENABLED')) pass('env template client flag');
  else fail('env template client flag');
}

// Sub-suite: opportunity-application backend
{
  const sub = runNpm('verify:opportunity-application');
  if (sub.ok) pass('verify:opportunity-application sub-suite');
  else fail('verify:opportunity-application sub-suite', sub.out.slice(-400));
}

console.log(`\nApplication UI verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
