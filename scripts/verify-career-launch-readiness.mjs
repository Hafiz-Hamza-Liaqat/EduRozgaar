#!/usr/bin/env node
/**
 * Career Platform Stabilization & Launch Readiness Audit gate (C.8.5A).
 * Cascades C.8 verification suites and asserts cross-module architecture integrity.
 * No new product features — release gate only.
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';
import { CAREER_DOMAIN_EVENTS, PIPELINE_STAGES } from '../shared/career/constants.js';
import {
  listTimelineHandledCareerEvents,
  INTENTIONAL_NON_TIMELINE_CAREER_EVENTS,
  isIntentionalNonTimelineCareerEvent,
} from '../shared/career/timelineEventMap.js';
import { EMPLOYER_INTELLIGENCE_EVENTS } from '../shared/employer/constants.js';
import { SEARCH_ENTITY_TYPES } from '../shared/search/entityTypes.js';
import { getFeatureFlagMatrix } from '../server/src/config/careerFeatureFlags.js';
import {
  resetCareerEventBus,
  getCareerEventSubscriberCount,
  emitCareerEvent,
} from '../server/src/services/career/CareerEventBus.js';
import {
  registerCareerTimelineHandlers,
  resetCareerTimelineHandlerRegistration,
} from '../server/src/services/career/careerEventHandlers.js';
import {
  registerCareerNotificationHandlers,
  resetCareerNotificationHandlerRegistration,
} from '../server/src/services/career/careerNotificationBridge.js';
import {
  registerCareerScoringHandlers,
  resetCareerScoringHandlerRegistration,
} from '../server/src/services/career/careerScoringBridge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runNpm(script) {
  const nodeDir = dirname(process.execPath);
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: {
      ...process.env,
      PATH: `${nodeDir}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`,
    },
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

function runClientBuild() {
  const viteBin = join(root, 'client/node_modules/vite/bin/vite.js');
  const r = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: join(root, 'client'),
    encoding: 'utf8',
    shell: false,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

async function assertModuleLoads(rel) {
  const href = pathToFileURL(join(root, rel)).href;
  await import(href);
}

// ---------------------------------------------------------------------------
// Audit deliverables
// ---------------------------------------------------------------------------
{
  if (exists('docs/SPRINT_C8_5A_CAREER_PLATFORM_LAUNCH_AUDIT.md')) pass('launch audit report');
  else fail('launch audit report');
  if (exists('docs/EMPLOYER_INTELLIGENCE_ARCHITECTURE.md')) pass('employer architecture doc');
  else fail('employer architecture doc');
  if (exists('docs/SPRINT_C8_5_IMPLEMENTATION_REPORT.md')) pass('C.8.5 report');
  else fail('C.8.5 report');
}

// ---------------------------------------------------------------------------
// Module load / boot integrity (P0 regression guard)
// ---------------------------------------------------------------------------
{
  const modules = [
    'server/src/controllers/career/employerIntelligenceController.js',
    'server/src/services/career/migration/ApplicationMigrationService.js',
    'server/src/services/career/migration/DocumentMigrationService.js',
    'server/src/services/career/migration/CredentialMigrationService.js',
    'server/src/services/career/migration/MigrationReconcileService.js',
    'server/src/controllers/admin/adminSearchController.js',
    'server/src/routes/index.js',
  ];
  for (const rel of modules) {
    try {
      await assertModuleLoads(rel);
      pass(`module loads ${rel.split('/').pop()}`);
    } catch (e) {
      fail(`module loads ${rel.split('/').pop()}`, e.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Feature flag matrix + env/client parity
// ---------------------------------------------------------------------------
{
  const matrix = getFeatureFlagMatrix();
  const required = [
    'talentProfile', 'opportunityApplication', 'timeline', 'documentsPlatform',
    'careerDashboard', 'careerDashboardV2', 'scoring', 'assessments',
    'employerIntelligence', 'migrationJobs',
  ];
  for (const key of required) {
    if (matrix[key] && typeof matrix[key].enabled === 'boolean') pass(`flag matrix ${key}`);
    else fail(`flag matrix ${key}`);
  }

  const env = read('.env.template');
  for (const key of [
    'TALENT_PROFILE_ENABLED', 'OPPORTUNITY_APPLICATION_ENABLED', 'TIMELINE_ENABLED',
    'DOCUMENTS_PLATFORM_ENABLED', 'CAREER_DASHBOARD_ENABLED', 'CAREER_DASHBOARD_V2_ENABLED',
    'SCORING_ENABLED', 'ASSESSMENTS_ENABLED', 'EMPLOYER_INTELLIGENCE_ENABLED',
    'VITE_EMPLOYER_INTELLIGENCE_ENABLED', 'VITE_ASSESSMENTS_ENABLED', 'VITE_SCORING_ENABLED',
  ]) {
    if (env.includes(key)) pass(`env ${key}`);
    else fail(`env ${key}`);
  }

  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  for (const fn of [
    'isTalentProfileEnabled', 'isAssessmentsEnabled', 'isEmployerIntelligenceEnabled',
    'isScoringEnabled', 'isCareerDashboardV2Enabled',
  ]) {
    if (clientFlags.includes(fn)) pass(`client flag ${fn}`);
    else fail(`client flag ${fn}`);
  }
}

// ---------------------------------------------------------------------------
// CareerEventBus + handler registration
// ---------------------------------------------------------------------------
{
  resetCareerEventBus();
  resetCareerTimelineHandlerRegistration();
  resetCareerNotificationHandlerRegistration();
  resetCareerScoringHandlerRegistration();
  registerCareerTimelineHandlers();
  registerCareerNotificationHandlers();
  registerCareerScoringHandlers();

  const handled = listTimelineHandledCareerEvents();
  if (handled.length >= 30) pass('timeline map coverage size');
  else fail('timeline map coverage size', String(handled.length));

  for (const evt of INTENTIONAL_NON_TIMELINE_CAREER_EVENTS) {
    if (isIntentionalNonTimelineCareerEvent(evt) && !handled.includes(evt)) {
      pass(`intentional non-timeline ${evt}`);
    } else fail(`intentional non-timeline ${evt}`);
  }

  for (const evt of CAREER_DOMAIN_EVENTS) {
    const ok = handled.includes(evt) || isIntentionalNonTimelineCareerEvent(evt);
    if (ok) pass(`domain→timeline policy ${evt}`);
    else fail(`domain→timeline policy ${evt}`);
  }

  if (getCareerEventSubscriberCount('TalentProfileUpdated') >= 1) pass('bus TalentProfileUpdated');
  else fail('bus TalentProfileUpdated');
  if (getCareerEventSubscriberCount('AssessmentCompleted') >= 1) pass('bus AssessmentCompleted');
  else fail('bus AssessmentCompleted');
  if (getCareerEventSubscriberCount('CandidateHired') >= 1) pass('bus CandidateHired');
  else fail('bus CandidateHired');
  if (getCareerEventSubscriberCount('InterviewScheduled') >= 1) pass('bus InterviewScheduled notify');
  else fail('bus InterviewScheduled notify');

  const evt = emitCareerEvent('CandidateViewed', { candidateUserId: 'u1', talentProfileId: 'tp1' }, {
    aggregateId: 'app1',
    actor: { type: 'employer', id: 'e1' },
  });
  if (evt.eventType === 'CandidateViewed') pass('emit CandidateViewed');
  else fail('emit CandidateViewed');
}

// ---------------------------------------------------------------------------
// Permissions / route gates
// ---------------------------------------------------------------------------
{
  const gates = [
    ['talent.js', ['requireAuth', 'requireUserAuth']],
    ['opportunityApplications.js', ['requireAuth', 'requireUserAuth']],
    ['timeline.js', ['requireAuth', 'requireUserAuth']],
    ['documents.js', ['requireAuth', 'requireUserAuth']],
    ['credentials.js', ['requireAuth', 'requireUserAuth']],
    ['scoring.js', ['requireAuth', 'requireUserAuth']],
    ['careerDashboard.js', ['requireAuth', 'requireUserAuth']],
    ['employerIntelligence.js', ['requireAuth', 'requireEmployerAuth', 'requireEmployerIntelligenceEnabled']],
    ['assessments.js', ['requireAuth', 'requireUserAuth', 'requireAdmin']],
  ];
  for (const [file, tokens] of gates) {
    const src = read(`server/src/routes/${file}`);
    if (tokens.every((t) => src.includes(t))) pass(`permissions ${file}`);
    else fail(`permissions ${file}`);
  }

  const index = read('server/src/index.js');
  for (const r of [
    'talentRouter', 'opportunityApplicationsRouter', 'timelineRouter', 'documentsRouter',
    'credentialsRouter', 'careerDashboardRouter', 'scoringRouter', 'assessmentsRouter',
    'employerIntelligenceRouter', 'migrationRouter', 'registerCareerTimelineHandlers',
    'registerCareerNotificationHandlers', 'registerCareerScoringHandlers',
  ]) {
    if (index.includes(r)) pass(`startup ${r}`);
    else fail(`startup ${r}`);
  }
}

// ---------------------------------------------------------------------------
// Cross-module integration surfaces
// ---------------------------------------------------------------------------
{
  const scoringBridge = read('server/src/services/career/careerScoringBridge.js');
  if (scoringBridge.includes('AssessmentCompleted') || scoringBridge.includes('AssessmentPassed')) {
    pass('assessment→readiness bridge');
  } else fail('assessment→readiness bridge');

  const assess = read('server/src/services/career/AssessmentService.js');
  if (assess.includes('CredentialPlatformService') && assess.includes('emitCareerEvent')) {
    pass('assessment→credential→events');
  } else fail('assessment→credential→events');

  const card = read('server/src/services/career/EmployerCandidateCardService.js');
  if (card.includes('TalentProfileReadService') && card.includes('ScoringService')
    && card.includes('CredentialPlatformService') && card.includes('DocumentService')
    && card.includes('TimelineService') && !exists('server/src/models/career/EmployerCandidate.js')) {
    pass('employer composition-only candidate card');
  } else fail('employer composition-only candidate card');

  const intel = read('server/src/services/career/EmployerIntelligenceService.js');
  if (intel.includes('CONCURRENCY') && intel.includes('oaSync') && intel.includes('forced')) {
    pass('employer list concurrency + OA sync policy');
  } else fail('employer list concurrency + OA sync policy');

  const compose = read('server/src/services/career/DashboardCompositionService.js');
  if (compose.includes('loadSharedContext') && compose.includes('PROVIDERS')) {
    pass('career dashboard composition');
  } else fail('career dashboard composition');

  const empCompose = read('server/src/services/career/EmployerDashboardCompositionService.js');
  if (empCompose.includes('loadSharedContext') && empCompose.includes('PROVIDERS')) {
    pass('employer dashboard composition');
  } else fail('employer dashboard composition');

  if (PIPELINE_STAGES.length === 13) pass('canonical pipeline 13 stages');
  else fail('canonical pipeline 13 stages', String(PIPELINE_STAGES.length));

  for (const ev of EMPLOYER_INTELLIGENCE_EVENTS) {
    if (CAREER_DOMAIN_EVENTS.includes(ev) || ['InterviewScheduled', 'OfferAccepted'].includes(ev)) {
      pass(`employer event registered ${ev}`);
    } else fail(`employer event registered ${ev}`);
  }

  if (SEARCH_ENTITY_TYPES.includes('talent-profile') && SEARCH_ENTITY_TYPES.includes('credential')) {
    pass('search career entity types');
  } else fail('search career entity types');

  const employerBridge = read('server/src/services/career/careerEmployerBridge.js');
  if (employerBridge.includes('scheduleAnalyticsEvent') && employerBridge.includes('searchCacheInvalidatePrefix')) {
    pass('employer analytics + search cache');
  } else fail('employer analytics + search cache');
}

// ---------------------------------------------------------------------------
// Localization samples (career)
// ---------------------------------------------------------------------------
{
  const pairs = [
    ['dashboard.json', ['notifications', 'viewAll', 'markAllRead', 'backToDashboard']],
    ['employer.json', ['intelligenceHeading', 'candidateList', 'rankingExplanation']],
    ['timeline.json', ['hiring.candidate_viewed', 'hiring.candidate_hired']],
    ['assessments.json', ['title']],
    ['talent.json', ['title', 'featureDisabled']],
  ];
  for (const [file, keys] of pairs) {
    const en = read(`client/src/i18n/locales/en/${file}`);
    const ur = read(`client/src/i18n/locales/ur/${file}`);
    for (const key of keys) {
      const needle = file === 'timeline.json' ? `"${key}"` : `"${key}"`;
      if (en.includes(needle) && ur.includes(needle)) pass(`i18n ${file} ${key}`);
      else fail(`i18n ${file} ${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// End-to-end journey surface maps (static contract)
// ---------------------------------------------------------------------------
{
  const journeys = {
    'talent profile journey': [
      'client/src/pages/TalentProfile/TalentProfileEditor.jsx',
      'server/src/services/career/TalentProfileService.js',
      'server/src/routes/talent.js',
    ],
    'application journey': [
      'client/src/pages/Applications/MyApplications.jsx',
      'client/src/pages/Applications/ApplicationDetail.jsx',
      'server/src/services/career/OpportunityApplicationService.js',
    ],
    'assessment journey': [
      'client/src/pages/Assessments/AssessmentsCatalog.jsx',
      'client/src/pages/Assessments/AssessmentTake.jsx',
      'server/src/services/career/AssessmentService.js',
    ],
    'resume / documents journey': [
      'client/src/pages/TalentProfile/ResumeVersionsPanel.jsx',
      'client/src/pages/TalentProfile/DocumentsPanel.jsx',
      'server/src/services/career/DocumentService.js',
      'server/src/services/career/CredentialPlatformService.js',
    ],
    'employer journey': [
      'client/src/pages/Employer/EmployerIntelligence.jsx',
      'client/src/pages/Employer/EmployerCandidates.jsx',
      'client/src/pages/Employer/EmployerCandidateDetail.jsx',
      'client/src/pages/Employer/EmployerPipeline.jsx',
      'server/src/services/career/EmployerIntelligenceService.js',
    ],
    'dashboard journey': [
      'client/src/dashboard/CareerDashboardPage.jsx',
      'server/src/services/career/DashboardCompositionService.js',
      'server/src/services/career/ScoringService.js',
    ],
  };
  for (const [name, files] of Object.entries(journeys)) {
    if (files.every((f) => exists(f))) pass(name);
    else fail(name);
  }

  const talentEditor = read('client/src/pages/TalentProfile/TalentProfileEditor.jsx');
  if (talentEditor.includes('isTalentProfileEnabled')) pass('talent client flag gate');
  else fail('talent client flag gate');
}

// ---------------------------------------------------------------------------
// Thin controller boundary sample
// ---------------------------------------------------------------------------
{
  const controllers = [
    'server/src/controllers/career/employerIntelligenceController.js',
    'server/src/controllers/career/assessmentController.js',
    'server/src/controllers/career/scoringController.js',
    'server/src/controllers/career/careerDashboardController.js',
  ];
  let leak = false;
  for (const f of controllers) {
    const c = read(f);
    if (c.includes('scheduleAnalyticsEvent') || c.includes('notifyUser(')
      || c.includes('TimelineService.') || c.includes('emitCareerEvent')) {
      leak = true;
    }
  }
  if (!leak) pass('controllers thin — no cross-cutting side effects');
  else fail('controllers thin — no cross-cutting side effects');
}

// ---------------------------------------------------------------------------
// Nested verification suites (release gate)
// ---------------------------------------------------------------------------
{
  const suites = [
    'verify:career-platform',
    'verify:career-domain',
    'verify:talent-profile',
    'verify:opportunity-application',
    'verify:application-tracker',
    'verify:timeline',
    'verify:documents',
    'verify:readiness',
    'verify:assessments',
    'verify:career-dashboard-v2',
    'verify:employer-intelligence',
    'verify:migration',
    'verify:search',
    'verify:analytics',
    'verify:security',
  ];
  for (const script of suites) {
    const r = runNpm(script);
    if (r.ok) pass(script);
    else fail(script, r.out.slice(-600));
  }
}

// Client build (final)
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nCareer launch readiness: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('LAUNCH READY — Career Intelligence platform gate PASS');
process.exit(0);
