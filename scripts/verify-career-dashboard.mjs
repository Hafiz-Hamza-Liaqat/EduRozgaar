#!/usr/bin/env node
/**
 * Career Dashboard Foundation verification (C.8.0.6).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  DASHBOARD_WIDGET_TYPES,
  DASHBOARD_WIDGET_DEFINITIONS,
  DEFAULT_DASHBOARD_LAYOUT,
  resolveEnabledWidgets,
} from '../shared/career/dashboardWidgetRegistry.js';
import { isCareerDashboardEnabled } from '../server/src/config/careerFeatureFlags.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runClientBuild() {
  const viteBin = join(root, 'client/node_modules/vite/bin/vite.js');
  const r = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: join(root, 'client'),
    encoding: 'utf8',
    shell: false,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Shared widget registry
{
  if (DASHBOARD_WIDGET_TYPES.length >= 7) pass('widget types defined');
  else fail('widget types defined');
  for (const type of DASHBOARD_WIDGET_TYPES) {
    if (DASHBOARD_WIDGET_DEFINITIONS[type]?.rendererKey) pass(`registry ${type}`);
    else fail(`registry ${type}`);
  }
  if (DEFAULT_DASHBOARD_LAYOUT.main?.length && DEFAULT_DASHBOARD_LAYOUT.aside?.length) {
    pass('default layout zones');
  } else fail('default layout zones');
}

// Feature flags
{
  if (typeof isCareerDashboardEnabled() === 'boolean') pass('isCareerDashboardEnabled');
  else fail('isCareerDashboardEnabled');
  const serverFlags = read('server/src/config/careerFeatureFlags.js');
  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  if (serverFlags.includes('CAREER_DASHBOARD_ENABLED') && clientFlags.includes('VITE_CAREER_DASHBOARD_ENABLED')) {
    pass('career dashboard feature flags');
  } else fail('career dashboard feature flags');
}

// Server composition layer
{
  for (const f of [
    'server/src/services/career/DashboardCompositionService.js',
    'server/src/controllers/career/careerDashboardController.js',
    'server/src/routes/careerDashboard.js',
  ]) {
    if (exists(f)) pass(`server ${f.split('/').pop()}`);
    else fail(`server ${f.split('/').pop()}`);
  }
  const svc = read('server/src/services/career/DashboardCompositionService.js');
  if (svc.includes('TalentProfileReadService') && svc.includes('OpportunityApplicationService')) pass('TalentProfile integration');
  else fail('TalentProfile integration');
  if (svc.includes('TimelineService') && svc.includes('DocumentService') && svc.includes('CredentialPlatformService')) {
    pass('platform service integration');
  } else fail('platform service integration');
  const route = read('server/src/routes/careerDashboard.js');
  if (route.includes('/career/dashboard') && route.includes('requireAuth')) pass('dashboard route auth');
  else fail('dashboard route auth');
}

// Client composition layer
{
  for (const f of [
    'client/src/dashboard/widgetRegistry.js',
    'client/src/dashboard/widgetComponentMap.js',
    'client/src/dashboard/WidgetRenderer.jsx',
    'client/src/dashboard/DashboardLayout.jsx',
    'client/src/dashboard/useDashboardComposition.js',
    'client/src/dashboard/CareerDashboardPage.jsx',
    'client/src/services/careerDashboardApi.js',
  ]) {
    if (exists(f)) pass(`client ${f.split('/').pop()}`);
    else fail(`client ${f.split('/').pop()}`);
  }
  const map = read('client/src/dashboard/widgetComponentMap.js');
  for (const def of Object.values(DASHBOARD_WIDGET_DEFINITIONS)) {
    if (map.includes(def.rendererKey)) pass(`renderer ${def.rendererKey}`);
    else fail(`renderer ${def.rendererKey}`);
  }
}

// Foundational widgets
{
  for (const w of [
    'ProfileSummaryWidget.jsx',
    'ApplicationsSummaryWidget.jsx',
    'TimelineWidget.jsx',
    'DocumentsWidget.jsx',
    'CredentialsWidget.jsx',
    'RecommendationsWidget.jsx',
    'DynamicContentWidget.jsx',
  ]) {
    if (exists(`client/src/dashboard/widgets/${w}`)) pass(`widget ${w}`);
    else fail(`widget ${w}`);
  }
}

// Widget reuse — no duplicate platform API calls in widgets
{
  const widgetDir = read('client/src/dashboard/widgets/ProfileSummaryWidget.jsx')
    + read('client/src/dashboard/widgets/ApplicationsSummaryWidget.jsx')
    + read('client/src/dashboard/widgets/TimelineWidget.jsx')
    + read('client/src/dashboard/widgets/DocumentsWidget.jsx')
    + read('client/src/dashboard/widgets/CredentialsWidget.jsx');
  const forbidden = ['talentApi', 'applicationsApi', 'documentsApi', 'credentialsApi', 'timelineApi.listMine'];
  let dup = false;
  for (const f of forbidden) {
    if (widgetDir.includes(f)) dup = true;
  }
  if (!dup) pass('widgets avoid duplicate queries');
  else fail('widgets avoid duplicate queries');
}

// ActivityFeed reuse + listMine support
{
  const feed = read('client/src/components/timeline/ActivityFeed.jsx');
  if (feed.includes('prefetchedItems') && feed.includes('listMine')) pass('ActivityFeed integration');
  else fail('ActivityFeed integration');
  const timelineWidget = read('client/src/dashboard/widgets/TimelineWidget.jsx');
  if (timelineWidget.includes('ActivityFeed') && timelineWidget.includes('prefetchedItems')) pass('Timeline widget reuse');
  else fail('Timeline widget reuse');
}

// Dynamic blocks reuse
{
  const dyn = read('client/src/dashboard/widgets/DynamicContentWidget.jsx');
  if (dyn.includes('BlockListRenderer') && dyn.includes('DASHBOARD_DYNAMIC_BLOCKS')) pass('DynamicContent widget reuse');
  else fail('DynamicContent widget reuse');
  const blocks = read('client/src/dashboard/dashboardDynamicBlocks.js');
  if (blocks.includes('featured-jobs') && blocks.includes('dynamic-career')) pass('dynamic block configs');
  else fail('dynamic block configs');
}

// Responsive layout
{
  const layout = read('client/src/dashboard/DashboardLayout.jsx');
  if (layout.includes('lg:grid-cols-3') && layout.includes('lg:col-span-2')) pass('responsive layout');
  else fail('responsive layout');
}

// Dashboard page flag gate
{
  const dash = read('client/src/pages/Dashboard/Dashboard.jsx');
  if (dash.includes('isCareerDashboardEnabled') && dash.includes('CareerDashboardPage') && dash.includes('LegacyDashboard')) {
    pass('dashboard flag gate');
  } else fail('dashboard flag gate');
}

// Localization
{
  const en = read('client/src/i18n/locales/en/dashboard.json');
  const ur = read('client/src/i18n/locales/ur/dashboard.json');
  if (en.includes('"widgets"') && ur.includes('"widgets"') && en.includes('profileSummary')) pass('dashboard widget i18n');
  else fail('dashboard widget i18n');
}

// Permissions middleware
{
  const ctrl = read('server/src/controllers/career/careerDashboardController.js');
  if (ctrl.includes('requireCareerDashboardEnabled')) pass('feature flag middleware');
  else fail('feature flag middleware');
}

// resolveEnabledWidgets gating
{
  const allOff = resolveEnabledWidgets({ talentProfile: false, opportunityApplication: false, timeline: false, documentsPlatform: false });
  const allOn = resolveEnabledWidgets({ talentProfile: true, opportunityApplication: true, timeline: true, documentsPlatform: true });
  if (allOff.length < allOn.length) pass('widget flag gating');
  else fail('widget flag gating');
}

// Documentation
{
  if (exists('docs/SPRINT_C8_0_6_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// Client build
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nverify:career-dashboard — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All career dashboard checks passed.');
process.exit(0);
