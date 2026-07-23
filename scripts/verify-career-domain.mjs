#!/usr/bin/env node
/**
 * Career domain integration verification (C.8.0.2B.1+).
 * Mandatory gate for all C.8 sprints.
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

function runNodeScript(scriptRel, cwd = root) {
  const r = spawnSync(process.execPath, [join(root, scriptRel)], {
    cwd,
    encoding: 'utf8',
    shell: false,
    env: process.env,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

function runNpm(script, cwd = root) {
  // Prefer direct node scripts to avoid Windows PATH issues with nested npm.
  const map = {
    'verify:talent-profile': 'scripts/verify-talent-profile.mjs',
    'verify:profile-adoption': 'scripts/verify-profile-adoption.mjs',
    'verify:opportunity-application': 'scripts/verify-opportunity-application.mjs',
    'verify:application-ui': 'scripts/verify-application-ui.mjs',
    'verify:timeline': 'scripts/verify-timeline.mjs',
    'verify:documents': 'scripts/verify-documents.mjs',
    'verify:career-dashboard': 'scripts/verify-career-dashboard.mjs',
  };
  if (map[script]) return runNodeScript(map[script], cwd);
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, PATH: `${dirname(process.execPath)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}` },
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// TalentProfile remains canonical
{
  const user = read('server/src/models/User.js');
  if (!user.includes('talentProfileId') && !user.match(/skills.*type/)) pass('User model has no career fields');
  else fail('User model career field leak');

  if (exists('server/src/models/career/TalentProfile.js')) pass('TalentProfile model exists');
  else fail('TalentProfile model missing');
}

// No career writes to User from talent UI
{
  const editor = exists('client/src/pages/TalentProfile/TalentProfileEditor.jsx')
    ? read('client/src/pages/TalentProfile/TalentProfileEditor.jsx')
    : '';
  const api = exists('client/src/services/talentApi.js') ? read('client/src/services/talentApi.js') : '';
  if (editor.includes('talentApi') && !editor.includes('authApi.updateProfile')) pass('editor uses talentApi only');
  else if (!editor) fail('TalentProfile editor missing');
  else fail('editor must not write career data via authApi');

  if (api.includes('/talent/me') && !api.includes('/resumes')) pass('talentApi canonical endpoints');
  else fail('talentApi endpoints');
}

// Services own business logic
{
  const ctrl = read('server/src/controllers/career/talentProfileController.js');
  if (ctrl.includes('TalentProfileService') && !ctrl.includes('TalentProfile.create')) pass('thin talent controller');
  else fail('controller delegates to service');

  const svc = read('server/src/services/career/TalentProfileService.js');
  if (svc.includes('emitCareerEvent') && svc.includes('TalentProfileUpdated')) pass('events emitted from service');
  else fail('service event emission');
}

// Feature flags
{
  const flags = read('server/src/config/careerFeatureFlags.js');
  const routes = read('server/src/routes/talent.js');
  if (flags.includes('TALENT_PROFILE_ENABLED') && routes.includes('requireTalentProfileEnabled')) {
    pass('feature flag gating');
  } else fail('feature flag gating');
}

// Localization
{
  const i18n = read('client/src/i18n/config.js');
  const en = exists('client/src/i18n/locales/en/talent.json');
  const ur = exists('client/src/i18n/locales/ur/talent.json');
  if (i18n.includes("'talent'") && en && ur) pass('talent i18n namespace');
  else fail('talent i18n namespace');

  const editor = read('client/src/pages/TalentProfile/TalentProfileEditor.jsx');
  if (editor.includes("useTranslation(['talent'") && !editor.includes('Pakistan')) pass('editor localized');
  else fail('editor localization');
}

// Shared validation
{
  const editor = read('client/src/pages/TalentProfile/TalentProfileEditor.jsx');
  if (editor.includes('@shared/career/validation')) pass('shared validation in UI');
  else fail('shared validation in UI');
}

// Search integration
{
  const hub = read('server/src/utils/contentIntegration.js');
  const mappers = read('server/src/services/search/documentMappers.js');
  if (hub.includes('onCareerEntitySaved') && mappers.includes('mapTalentProfileToSearchDocument')) {
    pass('search integration');
  } else fail('search integration');
}

// Analytics integration
{
  const bridge = read('server/src/services/career/careerAnalyticsBridge.js');
  const types = read('shared/analytics/eventTypes.js');
  if (bridge.includes('scheduleAnalyticsEvent') && types.includes('profile_updated')) {
    pass('analytics integration');
  } else fail('analytics integration');
}

// No duplicate profile storage in client
{
  const editor = read('client/src/pages/TalentProfile/TalentProfileEditor.jsx');
  const mapper = read('client/src/pages/TalentProfile/talentProfileMapper.js');
  if (mapper.includes('formToProfilePayload') && !editor.includes('localStorage.setItem')) pass('no client duplicate storage');
  else fail('client storage check');
}

// UI files present
for (const f of [
  'client/src/pages/TalentProfile/TalentProfileEditor.jsx',
  'client/src/pages/TalentProfile/TalentProfileForm.jsx',
  'client/src/pages/TalentProfile/ResumeVersionsPanel.jsx',
  'client/src/pages/TalentProfile/DocumentsPanel.jsx',
  'client/src/services/talentApi.js',
]) {
  if (exists(f)) pass(`file ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Route registered
{
  const routes = read('client/src/routes/index.jsx');
  const constants = read('client/src/constants/index.js');
  if (constants.includes('TALENT_PROFILE') && routes.includes('TalentProfileEditor')) pass('client route');
  else fail('client route');
}

// Out of scope guards
{
  const editor = read('client/src/pages/TalentProfile/TalentProfileEditor.jsx');
  const forbidden = ['ScoringService', 'readiness', 'ApplicationTracker', 'CareerDashboard'];
  const leaked = forbidden.filter((k) => editor.includes(k));
  if (!leaked.length) pass('editor scope clean');
  else fail('editor scope', leaked.join(', '));
}

// Delegate to talent-profile verify
{
  const sub = runNpm('verify:talent-profile');
  if (sub.ok) pass('verify:talent-profile sub-suite');
  else fail('verify:talent-profile sub-suite', sub.out.slice(-400));
}

// Platform adoption (C.8.0.2B.2)
{
  const adoption = runNpm('verify:profile-adoption');
  if (adoption.ok) pass('verify:profile-adoption sub-suite');
  else fail('verify:profile-adoption sub-suite', adoption.out.slice(-400));
}

// OpportunityApplication foundation (C.8.0.3A)
{
  const opp = runNpm('verify:opportunity-application');
  if (opp.ok) pass('verify:opportunity-application sub-suite');
  else fail('verify:opportunity-application sub-suite', opp.out.slice(-400));
}

// Application UI (C.8.0.3B)
{
  const ui = runNpm('verify:application-ui');
  if (ui.ok) pass('verify:application-ui sub-suite');
  else fail('verify:application-ui sub-suite', ui.out.slice(-400));
}

// Timeline Platform (C.8.0.4)
{
  const timeline = runNpm('verify:timeline');
  if (timeline.ok) pass('verify:timeline sub-suite');
  else fail('verify:timeline sub-suite', timeline.out.slice(-400));
}

// Documents & Credentials (C.8.0.5)
{
  const docs = runNpm('verify:documents');
  if (docs.ok) pass('verify:documents sub-suite');
  else fail('verify:documents sub-suite', docs.out.slice(-400));
}

// Career Dashboard Foundation (C.8.0.6) — structural gate (full suite: npm run verify:career-dashboard)
{
  if (exists('shared/career/dashboardWidgetRegistry.js')
    && exists('server/src/services/career/DashboardCompositionService.js')
    && exists('client/src/dashboard/CareerDashboardPage.jsx')
    && exists('scripts/verify-career-dashboard.mjs')) {
    pass('career-dashboard foundation present');
  } else {
    fail('career-dashboard foundation present');
  }
}

// Migration Layer (C.8.0.7) — structural gate (full suite: npm run verify:migration)
{
  if (exists('shared/career/migrationMap.js')
    && exists('server/src/services/career/migration/CareerMigrationService.js')
    && exists('scripts/verify-migration.mjs')) {
    pass('migration layer present');
  } else {
    fail('migration layer present');
  }
}

console.log(`\nCareer domain verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
