#!/usr/bin/env node
/**
 * Employer Intelligence Platform foundation verification (C.8.5).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { CAREER_DOMAIN_EVENTS, PIPELINE_STAGES } from '../shared/career/constants.js';
import { EMPLOYER_INTELLIGENCE_EVENTS } from '../shared/employer/constants.js';
import { getRankingWeights, loadRankingConfig } from '../shared/employer/rankingWeights.js';
import {
  EMPLOYER_DASHBOARD_WIDGET_TYPES,
  EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS,
  DEFAULT_EMPLOYER_DASHBOARD_LAYOUT,
  resolveEnabledEmployerWidgets,
  filterEmployerLayoutByEnabled,
} from '../shared/employer/employerDashboardWidgetRegistry.js';
import { listTimelineHandledCareerEvents } from '../shared/career/timelineEventMap.js';
import { TIMELINE_VERBS } from '../shared/career/timelineVerbs.js';
import { ANALYTICS_EVENT_TYPES } from '../shared/analytics/eventTypes.js';
import {
  isEmployerIntelligenceEnabled,
} from '../server/src/config/careerFeatureFlags.js';
import { rankCandidate } from '../server/src/services/career/EmployerRankingService.js';

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

// Architecture / no duplicate candidate model
{
  const card = read('server/src/services/career/EmployerCandidateCardService.js');
  if (card.includes('TalentProfileReadService') && card.includes('buildCandidateCard')
    && !card.includes('mongoose.model(') && !exists('server/src/models/career/EmployerCandidate.js')) {
    pass('no duplicate candidate model — TalentProfile composed');
  } else fail('no duplicate candidate model — TalentProfile composed');

  const intel = read('server/src/services/career/EmployerIntelligenceService.js');
  if (intel.includes('OpportunityApplicationRepository') && intel.includes('PIPELINE_TO_LEGACY_STATUS')) {
    pass('OpportunityApplication remains canonical pipeline');
  } else fail('OpportunityApplication remains canonical pipeline');

  if (PIPELINE_STAGES.includes('interested') && PIPELINE_STAGES.includes('joined')
    && PIPELINE_STAGES.includes('rejected') && PIPELINE_STAGES.includes('withdrawn')) {
    pass('canonical pipeline stages present');
  } else fail('canonical pipeline stages present');
}

// Ranking — deterministic + explainable + configurable
{
  const cfg = loadRankingConfig('1.0.0');
  const w = cfg.ranking;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) < 0.001) pass('ranking weights sum to 1');
  else fail('ranking weights sum to 1', String(sum));
  if (w.readiness === 0.4 && w.verified_assessments === 0.25 && w.experience === 0.2
    && w.profile_completeness === 0.1 && w.recent_activity === 0.05) {
    pass('default ranking weight targets');
  } else fail('default ranking weight targets');

  const ranked = rankCandidate({
    readiness: { overall: 80 },
    verifiedSkills: [{ score: 90 }],
    experienceYears: 5,
    profileCompleteness: 70,
    recentActivityAt: new Date().toISOString(),
    basic: { displayName: 'A' },
    headline: 'Engineer',
    location: 'Lahore',
  });
  if (ranked.deterministic === true && ranked.aiUsed === false && ranked.factors?.length >= 5
    && ranked.factors.every((f) => f.explanationKey && f.weight != null)) {
    pass('ranking explanation exists');
  } else fail('ranking explanation exists');
  if (getRankingWeights().version === '1.0.0') pass('configurable ranking weights loader');
  else fail('configurable ranking weights loader');

  const rankSrc = read('server/src/services/career/EmployerRankingService.js');
  if (!rankSrc.toLowerCase().includes('openai') && !rankSrc.toLowerCase().includes('llm')
    && !rankSrc.includes('embedding')) {
    pass('no AI ranking');
  } else fail('no AI ranking');
}

// Feature flags + permissions
{
  if (typeof isEmployerIntelligenceEnabled() === 'boolean') pass('isEmployerIntelligenceEnabled');
  else fail('isEmployerIntelligenceEnabled');
  const env = read('.env.template');
  if (env.includes('EMPLOYER_INTELLIGENCE_ENABLED') && env.includes('VITE_EMPLOYER_INTELLIGENCE_ENABLED')) {
    pass('env template employer intelligence flags');
  } else fail('env template employer intelligence flags');
  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  if (clientFlags.includes('VITE_EMPLOYER_INTELLIGENCE_ENABLED')) pass('client employer intelligence flag');
  else fail('client employer intelligence flag');

  const routes = read('server/src/routes/employerIntelligence.js');
  if (routes.includes('requireAuth') && routes.includes('requireEmployerAuth')
    && routes.includes('requireEmployerIntelligenceEnabled')) {
    pass('permissions enforced on intelligence routes');
  } else fail('permissions enforced on intelligence routes');
}

// Search / timeline / analytics / events
{
  const bridge = read('server/src/services/career/careerEmployerBridge.js');
  if (bridge.includes('searchCacheInvalidatePrefix') && bridge.includes('scheduleAnalyticsEvent')) {
    pass('search + analytics integration via bridge');
  } else fail('search + analytics integration via bridge');

  for (const ev of EMPLOYER_INTELLIGENCE_EVENTS) {
    if (CAREER_DOMAIN_EVENTS.includes(ev) || ev === 'InterviewScheduled' || ev === 'OfferAccepted') {
      pass(`domain event ${ev}`);
    } else fail(`domain event ${ev}`);
  }

  const timelineHandled = listTimelineHandledCareerEvents();
  for (const ev of ['CandidateViewed', 'CandidateShortlisted', 'OfferSent', 'CandidateHired', 'HiringNoteAdded']) {
    if (timelineHandled.includes(ev)) pass(`timeline maps ${ev}`);
    else fail(`timeline maps ${ev}`);
  }
  for (const verb of ['hiring.candidate_viewed', 'hiring.candidate_hired', 'hiring.note_added']) {
    if (TIMELINE_VERBS.includes(verb)) pass(`timeline verb ${verb}`);
    else fail(`timeline verb ${verb}`);
  }
  for (const a of ['employer_candidate_viewed', 'employer_candidate_hired', 'employer_hiring_note_added']) {
    if (ANALYTICS_EVENT_TYPES.includes(a)) pass(`analytics ${a}`);
    else fail(`analytics ${a}`);
  }

  const notify = read('server/src/services/career/careerNotificationBridge.js');
  if (notify.includes('CandidateShortlisted') && notify.includes('candidateUserId')) {
    pass('notifications integration for hiring events');
  } else fail('notifications integration for hiring events');
}

// Dashboard composition architecture
{
  const compose = read('server/src/services/career/EmployerDashboardCompositionService.js');
  if (compose.includes('loadSharedContext') && compose.includes('PROVIDERS')
    && compose.includes('EmployerIntelligenceService') && compose.includes('filterEmployerLayoutByEnabled')) {
    pass('employer dashboard composition architecture');
  } else fail('employer dashboard composition architecture');

  if (EMPLOYER_DASHBOARD_WIDGET_TYPES.length >= 9) pass('employer widget registry size');
  else fail('employer widget registry size', String(EMPLOYER_DASHBOARD_WIDGET_TYPES.length));

  for (const type of EMPLOYER_DASHBOARD_WIDGET_TYPES) {
    const def = EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS[type];
    if (def?.rendererKey && def.provider) pass(`registry ${type}`);
    else fail(`registry ${type}`);
  }

  const enabled = new Set(resolveEnabledEmployerWidgets({ employerIntelligence: true }));
  const layout = filterEmployerLayoutByEnabled(DEFAULT_EMPLOYER_DASHBOARD_LAYOUT, enabled);
  if (layout.hero.includes('hiring-overview') && layout.main.includes('candidate-rankings')) {
    pass('employer layout filter');
  } else fail('employer layout filter');

  const widgetDir = 'client/src/employerIntelligence/widgets';
  const forbidden = ['mongoose', 'employerApi', 'axios', 'fetch('];
  let leak = false;
  for (const type of EMPLOYER_DASHBOARD_WIDGET_TYPES) {
    const key = EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS[type].rendererKey;
    const file = `${widgetDir}/${key}.jsx`;
    if (!exists(file)) {
      fail(`widget file ${key}`);
      continue;
    }
    pass(`widget file ${key}`);
    const src = read(file);
    for (const token of forbidden) {
      if (src.includes(token)) leak = true;
    }
  }
  if (!leak) pass('widgets presentational only');
  else fail('widgets presentational only');

  const hook = read('client/src/employerIntelligence/useEmployerDashboardComposition.js');
  if (hook.includes('intelligenceDashboard') && !hook.includes('intelligenceCandidates')) {
    pass('single composition API for dashboard');
  } else fail('single composition API for dashboard');
}

// Controller / service / repository boundaries
{
  const ctrl = read('server/src/controllers/career/employerIntelligenceController.js');
  if (ctrl.includes('EmployerIntelligenceService') && ctrl.includes('EmployerDashboardCompositionService')
    && !ctrl.includes('TimelineService') && !ctrl.includes('scheduleAnalyticsEvent')
    && !ctrl.includes('notifyUser') && !ctrl.includes('Application.find')) {
    pass('thin controllers — no direct cross-cutting calls');
  } else fail('thin controllers — no direct cross-cutting calls');

  const index = read('server/src/index.js');
  if (index.includes('employerIntelligenceRouter')) pass('intelligence router mounted');
  else fail('intelligence router mounted');
}

// Localization preserved
{
  const en = read('client/src/i18n/locales/en/employer.json');
  const ur = read('client/src/i18n/locales/ur/employer.json');
  for (const key of [
    'intelligenceHeading', 'candidateList', 'hiringPipeline', 'rankingExplanation',
    'widgetHiringOverview', 'credentialViewer', 'timelineViewer',
  ]) {
    if (en.includes(`"${key}"`) && ur.includes(`"${key}"`)) pass(`i18n ${key}`);
    else fail(`i18n ${key}`);
  }
}

// Workspace surfaces exist
{
  for (const rel of [
    'client/src/pages/Employer/EmployerIntelligence.jsx',
    'client/src/pages/Employer/EmployerCandidates.jsx',
    'client/src/pages/Employer/EmployerCandidateDetail.jsx',
    'client/src/pages/Employer/EmployerPipeline.jsx',
    'docs/SPRINT_C8_5_IMPLEMENTATION_REPORT.md',
    'docs/EMPLOYER_INTELLIGENCE_ARCHITECTURE.md',
  ]) {
    if (exists(rel)) pass(`deliverable ${rel}`);
    else fail(`deliverable ${rel}`);
  }
}

// Nested platform gates
{
  for (const script of ['verify:career-platform', 'verify:career-dashboard-v2', 'verify:readiness']) {
    const r = runNpm(script);
    if (r.ok) pass(script);
    else fail(script, r.out.slice(-500));
  }
}

// Client build
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nEmployer Intelligence verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All employer intelligence checks passed.');
