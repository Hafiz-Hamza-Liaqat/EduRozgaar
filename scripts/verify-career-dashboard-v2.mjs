#!/usr/bin/env node
/**
 * Career Dashboard v2 (Career OS) verification (C.8.3).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  DASHBOARD_WIDGET_TYPES,
  DASHBOARD_WIDGET_DEFINITIONS,
  DEFAULT_DASHBOARD_LAYOUT_V1,
  DEFAULT_DASHBOARD_LAYOUT_V2,
  resolveEnabledWidgets,
  resolveDefaultLayout,
  applyLayoutPreference,
  filterLayoutByEnabled,
} from '../shared/career/dashboardWidgetRegistry.js';
import {
  isCareerDashboardEnabled,
  isCareerDashboardV2Enabled,
  isDashboardPersonalizationEnabled,
} from '../server/src/config/careerFeatureFlags.js';

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

function runNpm(script) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

const V2_WIDGETS = [
  'career-health',
  'weekly-progress',
  'profile-completion',
  'upcoming-deadlines',
  'interview-schedule',
  'recommended-jobs',
  'recommended-scholarships',
  'recommended-admissions',
  'recommended-learning',
  'goals-targets',
  'notification-center',
  'recent-achievements',
  'layout-customize',
];

// Registry integrity
{
  if (DASHBOARD_WIDGET_TYPES.length >= 20) pass('extensible widget registry size');
  else fail('extensible widget registry size', String(DASHBOARD_WIDGET_TYPES.length));
  for (const type of DASHBOARD_WIDGET_TYPES) {
    const def = DASHBOARD_WIDGET_DEFINITIONS[type];
    if (def?.rendererKey && def.widgetType === type) pass(`registry ${type}`);
    else fail(`registry ${type}`);
  }
  if (DEFAULT_DASHBOARD_LAYOUT_V1.main?.length && DEFAULT_DASHBOARD_LAYOUT_V2.main?.length) {
    pass('v1 + v2 default layouts');
  } else fail('v1 + v2 default layouts');
  for (const w of V2_WIDGETS) {
    if (DASHBOARD_WIDGET_TYPES.includes(w) && DASHBOARD_WIDGET_DEFINITIONS[w]?.module === 'v2') {
      pass(`v2 module ${w}`);
    } else fail(`v2 module ${w}`);
  }
}

// Layout resolution + personalization helpers
{
  const v1 = resolveDefaultLayout({ careerDashboardV2: false });
  const v2 = resolveDefaultLayout({ careerDashboardV2: true });
  if (v1.main.includes('applications-summary') && !v1.main.includes('weekly-progress')) pass('v1 layout classic');
  else fail('v1 layout classic');
  if (v2.hero.includes('career-health') && v2.main.includes('upcoming-deadlines')) pass('v2 layout operating system');
  else fail('v2 layout operating system');

  const pref = applyLayoutPreference(v2, { hiddenWidgets: ['recommended-learning'], layout: null });
  if (!pref.aside.includes('recommended-learning')) pass('hide widget preference');
  else fail('hide widget preference');

  const enabled = new Set(resolveEnabledWidgets({
    talentProfile: true,
    opportunityApplication: true,
    timeline: true,
    documentsPlatform: true,
    scoring: true,
    careerDashboardV2: true,
  }));
  const filtered = filterLayoutByEnabled(v2, enabled);
  if (filtered.main.includes('readiness-score') && filtered.aside.includes('goals-targets')) {
    pass('filter layout by enabled');
  } else fail('filter layout by enabled');
}

// Feature flags
{
  if (typeof isCareerDashboardEnabled() === 'boolean') pass('isCareerDashboardEnabled');
  else fail('isCareerDashboardEnabled');
  if (typeof isCareerDashboardV2Enabled() === 'boolean') pass('isCareerDashboardV2Enabled');
  else fail('isCareerDashboardV2Enabled');
  if (typeof isDashboardPersonalizationEnabled() === 'boolean') pass('isDashboardPersonalizationEnabled');
  else fail('isDashboardPersonalizationEnabled');
  const env = read('.env.template');
  if (env.includes('CAREER_DASHBOARD_V2_ENABLED') && env.includes('DASHBOARD_PERSONALIZATION_ENABLED')) {
    pass('env template dashboard v2 flags');
  } else fail('env template dashboard v2 flags');
  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  if (clientFlags.includes('VITE_CAREER_DASHBOARD_V2_ENABLED')) pass('client v2 flag');
  else fail('client v2 flag');
}

// Composition-only architecture + no client widget queries
{
  const compose = read('server/src/services/career/DashboardCompositionService.js');
  if (compose.includes('loadSharedContext') && compose.includes('PROVIDERS')) pass('shared composition context');
  else fail('shared composition context');
  if (compose.includes('OpportunityApplicationService') && compose.includes('ScoringService')
    && compose.includes('TimelineService') && compose.includes('DocumentService')
    && compose.includes('CredentialPlatformService') && compose.includes('TalentProfile')) {
    pass('platform service integration');
  } else fail('platform service integration');
  if (compose.includes('careerHealthProvider') && compose.includes('upcomingDeadlinesProvider')) {
    pass('v2 providers registered');
  } else fail('v2 providers registered');

  const widgetFiles = [
    'CareerHealthWidget.jsx',
    'WeeklyProgressWidget.jsx',
    'ProfileCompletionWidget.jsx',
    'UpcomingDeadlinesWidget.jsx',
    'InterviewScheduleWidget.jsx',
    'RecommendedJobsWidget.jsx',
    'RecommendedScholarshipsWidget.jsx',
    'RecommendedAdmissionsWidget.jsx',
    'RecommendedLearningWidget.jsx',
    'GoalsTargetsWidget.jsx',
    'NotificationCenterWidget.jsx',
    'RecentAchievementsWidget.jsx',
    'LayoutCustomizeWidget.jsx',
    'ReadinessScoreWidget.jsx',
    'ApplicationsSummaryWidget.jsx',
    'TimelineWidget.jsx',
    'DocumentsWidget.jsx',
    'CredentialsWidget.jsx',
  ];
  let leak = false;
  const forbidden = ['mongoose', 'talentApi', 'applicationsApi', 'documentsApi', 'credentialsApi', 'timelineApi', 'scoringApi', 'Job.find', 'OpportunityApplication'];
  for (const f of widgetFiles) {
    const path = `client/src/dashboard/widgets/${f}`;
    if (!exists(path)) {
      fail(`widget exists ${f}`);
      continue;
    }
    pass(`widget exists ${f}`);
    const src = read(path);
    for (const token of forbidden) {
      if (src.includes(token)) leak = true;
    }
  }
  if (!leak) pass('widgets composition-only (no duplicate platform queries)');
  else fail('widgets composition-only (no duplicate platform queries)');

  const hook = read('client/src/dashboard/useDashboardComposition.js');
  if (hook.includes('careerDashboardApi') && hook.includes('.get(') && !hook.includes('applicationsApi')) {
    pass('single composition API call');
  } else fail('single composition API call');
}

// Map + integrations
{
  const map = read('client/src/dashboard/widgetComponentMap.js');
  for (const type of V2_WIDGETS) {
    const key = DASHBOARD_WIDGET_DEFINITIONS[type].rendererKey;
    if (map.includes(key)) pass(`map ${key}`);
    else fail(`map ${key}`);
  }
  if (map.includes('ReadinessScoreWidget') && map.includes('ApplicationsSummaryWidget') && map.includes('TimelineWidget')) {
    pass('readiness + tracker + timeline widgets mapped');
  } else fail('readiness + tracker + timeline widgets mapped');
}

// Responsive layout
{
  const layout = read('client/src/dashboard/DashboardLayout.jsx');
  if (layout.includes('lg:grid-cols-3') && layout.includes('md:grid-cols-2') && layout.includes('grid-cols-1')) {
    pass('responsive layout desktop/tablet/mobile');
  } else fail('responsive layout desktop/tablet/mobile');
}

// Permissions + personalization API
{
  const routes = read('server/src/routes/careerDashboard.js');
  if (routes.includes('requireAuth') && routes.includes('/career/dashboard/layout')) pass('dashboard routes + layout API');
  else fail('dashboard routes + layout API');
  if (exists('server/src/models/career/DashboardPreference.js')) pass('DashboardPreference model');
  else fail('DashboardPreference model');
  if (exists('server/src/services/career/DashboardPreferenceService.js')) pass('DashboardPreferenceService');
  else fail('DashboardPreferenceService');
}

// Localization
{
  const en = read('client/src/i18n/locales/en/dashboard.json');
  const ur = read('client/src/i18n/locales/ur/dashboard.json');
  for (const key of ['careerHealth', 'weeklyProgress', 'upcomingDeadlines', 'interviewSchedule', 'goalsTargets', 'notificationCenter', 'layoutPlaceholder', 'subtitleV2']) {
    if (en.includes(`"${key}"`) && ur.includes(`"${key}"`)) pass(`i18n ${key}`);
    else fail(`i18n ${key}`);
  }
}

// Docs
{
  if (exists('docs/SPRINT_C8_3_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// Backward-compat gate + builds
{
  const v2Off = resolveEnabledWidgets({
    talentProfile: true,
    opportunityApplication: true,
    timeline: true,
    documentsPlatform: true,
    scoring: true,
    careerDashboardV2: false,
  });
  if (!v2Off.includes('career-health') && v2Off.includes('applications-summary')) {
    pass('v2 widgets gated when flag off');
  } else fail('v2 widgets gated when flag off');

  const dash = runNpm('verify:career-dashboard');
  if (dash.ok) pass('verify:career-dashboard sub-suite');
  else fail('verify:career-dashboard sub-suite', dash.out.slice(-500));

  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nverify:career-dashboard-v2 — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All career dashboard v2 checks passed.');
process.exit(0);
