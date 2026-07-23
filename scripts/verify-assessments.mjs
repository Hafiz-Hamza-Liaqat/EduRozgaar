#!/usr/bin/env node
/**
 * Assessment Platform foundation verification (C.8.4).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { CAREER_DOMAIN_EVENTS } from '../shared/career/constants.js';
import { ASSESSMENT_DOMAIN_EVENTS, DEFAULT_ASSESSMENT_CATEGORIES } from '../shared/career/assessmentConstants.js';
import {
  validateAssessmentInput,
  parseAssessmentInput,
  validateQuestionInput,
  parseAttemptSubmitInput,
} from '../shared/career/assessmentValidation.js';
import { TIMELINE_VERBS } from '../shared/career/timelineVerbs.js';
import { listTimelineHandledCareerEvents } from '../shared/career/timelineEventMap.js';
import { ANALYTICS_EVENT_TYPES } from '../shared/analytics/eventTypes.js';
import {
  isAssessmentsEnabled,
  isAssessmentResultsEnabled,
  isVerifiedCredentialsEnabled,
} from '../server/src/config/careerFeatureFlags.js';
import { DASHBOARD_WIDGET_TYPES, DASHBOARD_WIDGET_DEFINITIONS } from '../shared/career/dashboardWidgetRegistry.js';
import { parseCredentialInput } from '../shared/career/validation.js';

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

// Canonical domain ownership
{
  for (const f of [
    'server/src/models/career/Assessment.js',
    'server/src/models/career/QuestionBank.js',
    'server/src/models/career/Question.js',
    'server/src/models/career/AssessmentAttempt.js',
    'server/src/models/career/AssessmentCategory.js',
  ]) {
    if (exists(f)) pass(`model ${f.split('/').pop()}`);
    else fail(`model ${f.split('/').pop()}`);
  }
  const assessment = read('server/src/models/career/Assessment.js');
  if (assessment.includes('assessmentSectionSchema') && assessment.includes('assessmentRuleSchema')
    && assessment.includes('assessmentCredentialRuleSchema')) {
    pass('Assessment Section/Rule/CredentialRule schemas');
  } else fail('Assessment Section/Rule/CredentialRule schemas');
  const attempt = read('server/src/models/career/AssessmentAttempt.js');
  if (attempt.includes('assessmentResultSchema') && attempt.includes('employerVisibleSummary')) {
    pass('AssessmentResult embedded');
  } else fail('AssessmentResult embedded');
  if (DEFAULT_ASSESSMENT_CATEGORIES.length >= 18) pass('default categories configured');
  else fail('default categories configured');
}

// No duplicate quiz engines — wrap legacyQuizId / Mcq
{
  const quiz = exists('server/src/models/Quiz.js') && exists('server/src/models/Mcq.js');
  if (quiz) pass('legacy Quiz/Mcq preserved');
  else fail('legacy Quiz/Mcq preserved');
  const svc = read('server/src/services/career/AssessmentService.js');
  if (svc.includes('legacyQuizId') && svc.includes('Mcq.find') && svc.includes('QuestionBank')) {
    pass('Assessment wraps Quiz/Mcq when bridging');
  } else fail('Assessment wraps Quiz/Mcq when bridging');
  if (!svc.includes('computeResumeScore') && !svc.includes('ScoringEngine.compute')) {
    pass('no readiness/scoring duplication in AssessmentService');
  } else fail('no readiness/scoring duplication in AssessmentService');
}

// Validation / workflow integrity
{
  const parsed = parseAssessmentInput({
    title: 'JS Basics',
    slug: 'js-basics',
    categorySlug: 'javascript',
    passingScore: 70,
    durationMinutes: 20,
  });
  if (!validateAssessmentInput(parsed).length) pass('assessment input validation');
  else fail('assessment input validation');
  if (validateQuestionInput({ prompt: 'Q?', options: ['a'], correctIndex: 0 }).length) {
    pass('question validation rejects short options');
  } else fail('question validation rejects short options');
  const submit = parseAttemptSubmitInput({ answers: [{ questionId: '1', selectedIndex: 0 }] });
  if (submit.answers.length === 1) pass('attempt submit parse');
  else fail('attempt submit parse');
}

// CareerEventBus + timeline + analytics
{
  for (const ev of ASSESSMENT_DOMAIN_EVENTS) {
    if (CAREER_DOMAIN_EVENTS.includes(ev)) pass(`domain event ${ev}`);
    else fail(`domain event ${ev}`);
  }
  for (const verb of ['assessment.started', 'assessment.completed', 'assessment.passed', 'assessment.failed']) {
    if (TIMELINE_VERBS.includes(verb)) pass(`timeline verb ${verb}`);
    else fail(`timeline verb ${verb}`);
  }
  const handled = listTimelineHandledCareerEvents();
  for (const ev of ['AssessmentStarted', 'AssessmentCompleted', 'AssessmentPassed', 'AssessmentFailed']) {
    if (handled.includes(ev)) pass(`timeline maps ${ev}`);
    else fail(`timeline maps ${ev}`);
  }
  for (const name of ['assessment_started', 'assessment_completed', 'assessment_passed', 'assessment_failed']) {
    if (ANALYTICS_EVENT_TYPES.includes(name)) pass(`analytics type ${name}`);
    else fail(`analytics type ${name}`);
  }
  const bridge = read('server/src/services/career/careerAssessmentBridge.js');
  if (bridge.includes('scheduleAnalyticsEvent')) pass('assessment analytics bridge');
  else fail('assessment analytics bridge');
}

// Credential integration
{
  const parsed = parseCredentialInput({
    title: 'JS Verified',
    source: 'assessment',
    skillName: 'JavaScript',
    assessmentAttemptId: '507f1f77bcf86cd799439011',
    score: 90,
  });
  if (parsed.assessmentAttemptId && parsed.skillName === 'JavaScript') pass('credential parse assessmentAttemptId');
  else fail('credential parse assessmentAttemptId');
  const credSvc = read('server/src/services/career/CredentialPlatformService.js');
  if (credSvc.includes('assessmentAttemptId')) pass('CredentialPlatform writes assessmentAttemptId');
  else fail('CredentialPlatform writes assessmentAttemptId');
  const svc = read('server/src/services/career/AssessmentService.js');
  if (svc.includes('CredentialPlatformService.issue') && svc.includes("source: 'assessment'")) {
    pass('auto credential issuance on pass');
  } else fail('auto credential issuance on pass');
}

// Readiness integration (events only)
{
  const scoring = read('server/src/services/career/careerScoringBridge.js');
  if (scoring.includes('AssessmentCompleted') && scoring.includes('AssessmentPassed')) {
    pass('readiness recompute on assessment events');
  } else fail('readiness recompute on assessment events');
}

// Service boundaries
{
  for (const f of [
    'server/src/services/career/AssessmentService.js',
    'server/src/repositories/career/AssessmentRepository.js',
    'server/src/repositories/career/AssessmentAttemptRepository.js',
    'server/src/repositories/career/QuestionBankRepository.js',
    'server/src/controllers/career/assessmentController.js',
    'server/src/routes/assessments.js',
  ]) {
    if (exists(f)) pass(`layer ${f.split('/').pop()}`);
    else fail(`layer ${f.split('/').pop()}`);
  }
  const ctrl = read('server/src/controllers/career/assessmentController.js');
  if (!ctrl.includes('TimelineService') && !ctrl.includes('scheduleAnalyticsEvent') && !ctrl.includes('ScoringService')) {
    pass('thin controllers (no timeline/analytics/scoring)');
  } else fail('thin controllers (no timeline/analytics/scoring)');
}

// Feature flags + permissions
{
  if (typeof isAssessmentsEnabled() === 'boolean') pass('isAssessmentsEnabled');
  else fail('isAssessmentsEnabled');
  if (typeof isAssessmentResultsEnabled() === 'boolean') pass('isAssessmentResultsEnabled');
  else fail('isAssessmentResultsEnabled');
  if (typeof isVerifiedCredentialsEnabled() === 'boolean') pass('isVerifiedCredentialsEnabled');
  else fail('isVerifiedCredentialsEnabled');
  const env = read('.env.template');
  if (env.includes('ASSESSMENTS_ENABLED') && env.includes('VITE_ASSESSMENTS_ENABLED')
    && env.includes('ASSESSMENT_RESULTS_ENABLED') && env.includes('VERIFIED_CREDENTIALS_ENABLED')) {
    pass('env assessment flags');
  } else fail('env assessment flags');
  const routes = read('server/src/routes/assessments.js');
  if (routes.includes('requireAuth') && routes.includes('requireUserAuth') && routes.includes('requireAssessmentsEnabled')) {
    pass('assessment route permissions');
  } else fail('assessment route permissions');
  if (routes.includes('requireAdmin') && routes.includes('staffAuth')) {
    pass('assessment authoring staff-gated');
  } else fail('assessment authoring staff-gated');
  const index = read('server/src/index.js');
  if (index.includes('assessmentsRouter')) pass('assessments mounted');
  else fail('assessments mounted');
}

// Dashboard + localization + client
{
  if (DASHBOARD_WIDGET_TYPES.includes('recent-assessments') && DASHBOARD_WIDGET_TYPES.includes('verified-skills')) {
    pass('assessment dashboard widgets registered');
  } else fail('assessment dashboard widgets registered');
  if (DASHBOARD_WIDGET_DEFINITIONS['recent-assessments']?.flags?.includes('assessments')) {
    pass('assessments flag on recent-assessments widget');
  } else fail('assessments flag on recent-assessments widget');
  if (exists('client/src/dashboard/widgets/RecentAssessmentsWidget.jsx')
    && exists('client/src/dashboard/widgets/VerifiedSkillsWidget.jsx')) {
    pass('assessment widget components');
  } else fail('assessment widget components');
  const map = read('client/src/dashboard/widgetComponentMap.js');
  if (map.includes('RecentAssessmentsWidget') && map.includes('VerifiedSkillsWidget')) pass('widget map entries');
  else fail('widget map entries');
  if (exists('client/src/i18n/locales/en/assessments.json') && exists('client/src/i18n/locales/ur/assessments.json')) {
    pass('assessments i18n en/ur');
  } else fail('assessments i18n en/ur');
  const i18n = read('client/src/i18n/config.js');
  if (i18n.includes("'assessments'")) pass('assessments namespace registered');
  else fail('assessments namespace registered');
  const enTl = JSON.parse(read('client/src/i18n/locales/en/timeline.json'));
  const urTl = JSON.parse(read('client/src/i18n/locales/ur/timeline.json'));
  if (enTl.verbs?.['assessment.completed'] && urTl.verbs?.['assessment.passed']) pass('timeline assessment i18n');
  else fail('timeline assessment i18n');
  if (exists('client/src/pages/Assessments/AssessmentsCatalog.jsx')
    && exists('client/src/pages/Assessments/AssessmentTake.jsx')) {
    pass('assessment talent UI');
  } else fail('assessment talent UI');
  const routes = read('client/src/routes/index.jsx');
  if (routes.includes('AssessmentsCatalog') && routes.includes('ROUTES.ASSESSMENTS')) pass('client routes');
  else fail('client routes');
}

// Employer readiness data (no UI)
{
  const svc = read('server/src/services/career/AssessmentService.js');
  if (svc.includes('getEmployerVisibleSkills') && svc.includes('employerVisibleSummary')) {
    pass('employer-ready verified skills API data');
  } else fail('employer-ready verified skills API data');
}

// Docs
{
  if (exists('docs/SPRINT_C8_4_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// Builds + regression
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));

  const dash = runNpm('verify:career-dashboard-v2');
  if (dash.ok) pass('verify:career-dashboard-v2 sub-suite');
  else fail('verify:career-dashboard-v2 sub-suite', dash.out.slice(-500));

  const readiness = runNpm('verify:readiness');
  if (readiness.ok) pass('verify:readiness sub-suite');
  else fail('verify:readiness sub-suite', readiness.out.slice(-500));

  const platform = runNpm('verify:career-platform');
  if (platform.ok) pass('verify:career-platform sub-suite');
  else fail('verify:career-platform sub-suite', platform.out.slice(-500));
}

console.log(`\nverify:assessments — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All assessment platform checks passed.');
process.exit(0);
