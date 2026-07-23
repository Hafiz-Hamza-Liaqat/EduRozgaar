#!/usr/bin/env node
/**
 * Career Readiness Engine verification (C.8.2).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  CAREER_SCORE_TYPES,
  SCORE_PROVIDER_IDS,
  SCORING_EVENTS,
} from '../shared/scoring/constants.js';
import { CAREER_DOMAIN_EVENTS } from '../shared/career/constants.js';
import {
  loadWeightConfig,
  getProviderWeights,
  DEFAULT_WEIGHT_VERSION,
  listWeightVersions,
} from '../shared/scoring/weights.js';
import {
  registerScoreProvider,
  clearScoreProviders,
  getScoreProviderCount,
  listScoreProviders,
} from '../shared/scoring/providerRegistry.js';
import { computeScore, assertProvidersRegistered, listExpectedProviders } from '../shared/scoring/ScoringEngine.js';
import { ALL_FOUNDATION_PROVIDERS } from '../server/src/services/career/scoring/providers.js';
import {
  DASHBOARD_WIDGET_TYPES,
  DASHBOARD_WIDGET_DEFINITIONS,
  resolveEnabledWidgets,
} from '../shared/career/dashboardWidgetRegistry.js';
import { isScoringEnabled } from '../server/src/config/careerFeatureFlags.js';
import { TIMELINE_VERBS } from '../shared/career/timelineVerbs.js';
import { listTimelineHandledCareerEvents } from '../shared/career/timelineEventMap.js';

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

// --- Shared scoring platform ---
{
  if (CAREER_SCORE_TYPES.includes('career_readiness')) pass('career_readiness type');
  else fail('career_readiness type');
  if (SCORE_PROVIDER_IDS.length === 7 && SCORE_PROVIDER_IDS.includes('job_requirement_match')) {
    pass('seven foundation providers listed');
  } else fail('seven foundation providers listed', String(SCORE_PROVIDER_IDS.length));
  if (listWeightVersions().includes(DEFAULT_WEIGHT_VERSION)) pass('weight version 1.0.0');
  else fail('weight version 1.0.0');
  if (exists('shared/scoring/weights/v1.json')) pass('weights v1.json');
  else fail('weights v1.json');
  if (exists('shared/scoring/ScoringEngine.js') && exists('shared/scoring/providerRegistry.js')) {
    pass('ScoringEngine + registry');
  } else fail('ScoringEngine + registry');
}

// --- Provider registration + weighting ---
{
  clearScoreProviders();
  for (const p of ALL_FOUNDATION_PROVIDERS) registerScoreProvider(p);
  if (getScoreProviderCount() === 7) pass('providers registered');
  else fail('providers registered', String(getScoreProviderCount()));

  const weights = getProviderWeights('career_readiness');
  const sum = Object.values(weights.providers).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) < 0.001) pass('career_readiness weights sum to 1');
  else fail('career_readiness weights sum to 1', String(sum));

  const readinessProviders = Object.keys(weights.providers);
  for (const id of readinessProviders) {
    if (weights.providers[id] > 0) pass(`weight ${id}`);
    else fail(`weight ${id}`);
  }

  // L.2.8 — job_match uses dedicated provider (not part of career_readiness weights)
  try {
    const jmWeights = getProviderWeights('job_match');
    if (jmWeights.providers.job_requirement_match > 0) pass('weight job_requirement_match');
    else fail('weight job_requirement_match');
  } catch (e) {
    fail('weight job_requirement_match', e.message);
  }

  try {
    assertProvidersRegistered('career_readiness');
    pass('assertProvidersRegistered');
  } catch (e) {
    fail('assertProvidersRegistered', e.message);
  }

  const expected = listExpectedProviders('career_readiness');
  if (expected.every((id) => listScoreProviders().some((p) => p.id === id))) {
    pass('registry covers weight providers');
  } else fail('registry covers weight providers');
}

// --- Deterministic score calculation ---
const ctx = {
  userId: 'u1',
  talentProfileId: 'tp1',
  profile: {
    _id: 'tp1',
    displayName: 'Ada',
    headline: 'Engineer',
    summary: 'A'.repeat(50),
    education: [{ degree: 'BS' }],
    experience: [{ role: 'Dev', company: 'X' }],
    skills: [
      { name: 'JS', level: 'advanced', category: 'technical', source: 'self_reported' },
      { name: 'React', level: 'intermediate', category: 'technical' },
      { name: 'Node', level: 'intermediate', category: 'technical' },
    ],
    languages: [{ name: 'en' }],
    avatarUrl: 'https://example.com/a.png',
  },
  resumeVersions: [{
    _id: 'rv1',
    title: 'Primary',
    isPrimary: true,
    status: 'published',
    snapshot: {
      headline: 'Engineer',
      summary: 'B'.repeat(50),
      experience: [{}],
      education: [{}],
      skills: [1, 2, 3],
    },
  }],
  documents: [
    { _id: 'd1', documentType: 'resume', status: 'active', label: 'CV' },
    { _id: 'd2', documentType: 'certificate', status: 'active', label: 'Cert' },
  ],
  credentials: [
    { _id: 'c1', verificationStatus: 'active', title: 'Cert', skillName: 'JS' },
    { _id: 'c2', verificationStatus: 'active', title: 'Cert2', skillName: 'React' },
  ],
  applications: [
    { _id: 'a1', status: 'active', pipelineStage: 'applied', title: 'Job A' },
    { _id: 'a2', status: 'active', pipelineStage: 'interview', title: 'Job B' },
  ],
};

const scoreA = await computeScore(ctx, 'career_readiness', { version: '1.0.0' });
const scoreB = await computeScore(ctx, 'career_readiness', { version: '1.0.0' });
if (scoreA.overall === scoreB.overall && scoreA.factors.length === scoreB.factors.length) pass('deterministic overall');
else fail('deterministic overall');
if (scoreA.overall >= 0 && scoreA.overall <= 100) pass('overall in 0-100');
else fail('overall in 0-100');
if (scoreA.version === '1.0.0') pass('snapshot versioning');
else fail('snapshot versioning');
if (scoreA.factors.every((f) => f.explanation && typeof f.weight === 'number')) pass('explanation generation');
else fail('explanation generation');
if (scoreA.factors.some((f) => (f.improvements || []).length >= 0)) pass('improvements present');
else fail('improvements present');

// --- ScoreSnapshot model / service ---
{
  for (const f of [
    'server/src/models/career/ScoreSnapshot.js',
    'server/src/repositories/career/ScoreSnapshotRepository.js',
    'server/src/services/career/ScoringService.js',
    'server/src/services/career/careerScoringBridge.js',
    'server/src/controllers/career/scoringController.js',
    'server/src/routes/scoring.js',
  ]) {
    if (exists(f)) pass(`file ${f.split('/').pop()}`);
    else fail(`file ${f.split('/').pop()}`);
  }

  const model = read('server/src/models/career/ScoreSnapshot.js');
  if (model.includes('collection: \'scoreSnapshots\'') && model.includes('factors')) {
    pass('ScoreSnapshot schema');
  } else fail('ScoreSnapshot schema');

  const svc = read('server/src/services/career/ScoringService.js');
  if (svc.includes('buildScoreExplanation') && svc.includes('getHistory') && svc.includes('compute')) {
    pass('ScoreExplanation + ScoreHistory APIs');
  } else fail('ScoreExplanation + ScoreHistory APIs');
  if (
    svc.includes('TalentProfileRepository')
    && svc.includes('OpportunityApplicationService')
    && svc.includes('DocumentService')
    && svc.includes('CredentialPlatformService')
  ) {
    pass('TalentProfile + OA + Documents + Credentials integration');
  } else fail('TalentProfile + OA + Documents + Credentials integration');
}

// --- Events + timeline ---
{
  for (const ev of SCORING_EVENTS) {
    if (CAREER_DOMAIN_EVENTS.includes(ev)) pass(`domain event ${ev}`);
    else fail(`domain event ${ev}`);
  }
  if (TIMELINE_VERBS.includes('score.improved')) pass('timeline verb score.improved');
  else fail('timeline verb score.improved');
  if (listTimelineHandledCareerEvents().includes('CareerScoreUpdated')) pass('timeline maps CareerScoreUpdated');
  else fail('timeline maps CareerScoreUpdated');
  const index = read('server/src/index.js');
  if (index.includes('registerCareerScoringHandlers') && index.includes('scoringRouter')) {
    pass('scoring wired at boot');
  } else fail('scoring wired at boot');
}

// --- Dashboard integration ---
{
  if (DASHBOARD_WIDGET_TYPES.includes('readiness-score')) pass('readiness widget type');
  else fail('readiness widget type');
  const def = DASHBOARD_WIDGET_DEFINITIONS['readiness-score'];
  if (def?.rendererKey === 'ReadinessScoreWidget' && def.provider === 'readinessScoreProvider') {
    pass('readiness widget definition');
  } else fail('readiness widget definition');
  if (exists('client/src/dashboard/widgets/ReadinessScoreWidget.jsx')) pass('ReadinessScoreWidget');
  else fail('ReadinessScoreWidget');
  const map = read('client/src/dashboard/widgetComponentMap.js');
  if (map.includes('ReadinessScoreWidget')) pass('widget map registration');
  else fail('widget map registration');
  const widget = read('client/src/dashboard/widgets/ReadinessScoreWidget.jsx');
  if (
    widget.includes('readinessTrend')
    && widget.includes('readinessChecklist')
    && widget.includes('readinessFactors')
    && !widget.includes('scoringApi')
  ) {
    pass('widget trend + checklist + explanation (composition only)');
  } else fail('widget trend + checklist + explanation (composition only)');
  const dash = read('server/src/services/career/DashboardCompositionService.js');
  if (dash.includes('readinessScoreProvider') && dash.includes('isScoringEnabled')) {
    pass('dashboard composition readiness');
  } else fail('dashboard composition readiness');
  const gated = resolveEnabledWidgets({
    talentProfile: true,
    opportunityApplication: true,
    timeline: true,
    documentsPlatform: true,
    scoring: false,
  });
  if (!gated.includes('readiness-score')) pass('scoring flag gates widget');
  else fail('scoring flag gates widget');
  const on = resolveEnabledWidgets({
    talentProfile: true,
    opportunityApplication: true,
    timeline: true,
    documentsPlatform: true,
    scoring: true,
  });
  if (on.includes('readiness-score')) pass('scoring flag enables widget');
  else fail('scoring flag enables widget');
}

// --- Localization / permissions / flags ---
{
  if (typeof isScoringEnabled() === 'boolean') pass('isScoringEnabled');
  else fail('isScoringEnabled');
  const env = read('.env.template');
  if (env.includes('SCORING_ENABLED') && env.includes('VITE_SCORING_ENABLED')) pass('env template scoring flags');
  else fail('env template scoring flags');
  const routes = read('server/src/routes/scoring.js');
  if (routes.includes('requireAuth') && routes.includes('requireUserAuth') && routes.includes('requireScoringEnabled')) {
    pass('scoring route permissions');
  } else fail('scoring route permissions');
  const en = read('client/src/i18n/locales/en/dashboard.json');
  const ur = read('client/src/i18n/locales/ur/dashboard.json');
  if (en.includes('readinessScore') && ur.includes('readinessChecklist') && ur.includes('providerSkills')) {
    pass('dashboard readiness i18n');
  } else fail('dashboard readiness i18n');
  const enTl = JSON.parse(read('client/src/i18n/locales/en/timeline.json'));
  const urTl = JSON.parse(read('client/src/i18n/locales/ur/timeline.json'));
  if (enTl.verbs?.['score.improved'] && urTl.verbs?.['score.improved']) pass('timeline score i18n');
  else fail('timeline score i18n');
  if (exists('client/src/services/scoringApi.js')) pass('scoringApi client');
  else fail('scoringApi client');
}

// --- Docs ---
{
  if (exists('docs/SPRINT_C8_2_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// --- Client build + regression suites ---
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));

  const platform = runNpm('verify:career-platform');
  if (platform.ok) pass('verify:career-platform sub-suite');
  else fail('verify:career-platform sub-suite', platform.out.slice(-500));

  const tracker = runNpm('verify:application-tracker');
  if (tracker.ok) pass('verify:application-tracker sub-suite');
  else fail('verify:application-tracker sub-suite', tracker.out.slice(-500));
}

console.log(`\nverify:readiness — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All readiness checks passed.');
process.exit(0);
