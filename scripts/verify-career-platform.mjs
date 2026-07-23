#!/usr/bin/env node
/**
 * Career Platform integration & quality audit gate (C.8.0.5A).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { CAREER_DOMAIN_EVENTS } from '../shared/career/constants.js';
import {
  registerCareerTimelineHandlers,
  resetCareerTimelineHandlerRegistration,
} from '../server/src/services/career/careerEventHandlers.js';
import {
  resetCareerEventBus,
  getCareerEventSubscriberCount,
  emitCareerEvent,
} from '../server/src/services/career/CareerEventBus.js';
import { listTimelineHandledCareerEvents } from '../shared/career/timelineEventMap.js';

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

function runClientBuild() {
  const viteBin = join(root, 'client/node_modules/vite/bin/vite.js');
  const r = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: join(root, 'client'),
    encoding: 'utf8',
    shell: false,
    env: process.env,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

function runNpm(script, cwd = root) {
  const map = {
    'verify:career-domain': 'scripts/verify-career-domain.mjs',
  };
  if (map[script]) return runNodeScript(map[script], cwd);
  if (script === 'build' && String(cwd).endsWith('client')) return runClientBuild();
  const nodeDir = dirname(process.execPath);
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd,
    encoding: 'utf8',
    shell: true,
    env: {
      ...process.env,
      PATH: `${nodeDir}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`,
    },
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Audit deliverable
if (exists('docs/SPRINT_C8_0_5A_CAREER_PLATFORM_AUDIT.md')) pass('audit report exists');
else fail('audit report exists');

// Canonical service layers
const CANONICAL_SERVICES = [
  ['TalentProfile', 'server/src/services/career/TalentProfileService.js'],
  ['OpportunityApplication', 'server/src/services/career/OpportunityApplicationService.js'],
  ['Timeline', 'server/src/services/career/TimelineService.js'],
  ['Document', 'server/src/services/career/DocumentService.js'],
  ['Credential', 'server/src/services/career/CredentialPlatformService.js'],
];

for (const [name, path] of CANONICAL_SERVICES) {
  if (exists(path)) pass(`canonical service ${name}`);
  else fail(`canonical service ${name}`);
}

// Canonical models (single collection each)
{
  const models = {
    TalentProfile: 'talentProfiles',
    OpportunityApplication: 'opportunityApplications',
    TimelineEvent: 'timelineEvents',
    Document: 'documents',
    Credential: 'credentials',
  };
  for (const [model, collection] of Object.entries(models)) {
    const file = read(`server/src/models/career/${model}.js`);
    const ok = file.includes(`collection: '${collection}'`)
      || file.includes(`mongoose.model('${model}'`)
      || (model === 'TalentProfile' && file.includes('talentProfileSchema'))
      || (model === 'Credential' && file.includes('credentialSchema'));
    if (ok) pass(`model ${model}`);
    else fail(`model ${model} collection`);
  }
}

// No duplicate activity/timeline collections
{
  const forbidden = [
    "collection: 'activities'",
    "collection: 'platformActivities'",
    "collection: 'applicationActivities'",
    "mongoose.model('Activity'",
  ];
  let leaked = false;
  for (const rel of [
    'server/src/models/career/TimelineEvent.js',
    'server/src/models/career/OpportunityApplication.js',
    'server/src/models/career/Document.js',
  ]) {
    const c = read(rel);
    for (const f of forbidden) {
      if (c.includes(f)) leaked = true;
    }
  }
  if (!leaked) pass('no duplicate activity collections');
  else fail('no duplicate activity collections');
}

// Document storage: canonical write path
{
  const profileSvc = read('server/src/services/career/ProfileDocumentService.js');
  const upload = read('server/src/controllers/career/profileDocumentUploadController.js');
  const docSvc = read('server/src/services/career/DocumentService.js');
  if (profileSvc.includes('DocumentService') && !profileSvc.includes('ProfileDocumentRepository.create')) {
    pass('ProfileDocumentService delegates to DocumentService');
  } else fail('ProfileDocumentService delegates to DocumentService');
  if (upload.includes('DocumentService.createFromUpload') && !upload.includes('uploadFile(')) {
    pass('talent upload uses DocumentService + MediaAsset');
  } else fail('talent upload uses DocumentService + MediaAsset');
  if (docSvc.includes('createMediaAssetFromBuffer')) pass('DocumentService MediaAsset integration');
  else fail('DocumentService MediaAsset integration');
}

// No duplicate credential issue path in controllers
{
  const credCtrl = read('server/src/controllers/career/credentialController.js');
  if (credCtrl.includes('CredentialPlatformService') && !credCtrl.includes('CredentialRepository')) {
    pass('credential controller thin');
  } else fail('credential controller thin');
}

// Career controllers: no repository / emitCareerEvent
{
  const careerControllers = [
    'server/src/controllers/career/talentProfileController.js',
    'server/src/controllers/career/opportunityApplicationController.js',
    'server/src/controllers/career/timelineController.js',
    'server/src/controllers/career/documentController.js',
    'server/src/controllers/career/credentialController.js',
    'server/src/controllers/career/profileDocumentController.js',
  ];
  let bad = false;
  for (const f of careerControllers) {
    const c = read(f);
    if (c.includes('emitCareerEvent') || c.match(/Repository\./)) bad = true;
  }
  if (!bad) pass('career controllers no business logic');
  else fail('career controllers no business logic');
}

// CareerEventBus authoritative + timeline handlers
{
  resetCareerEventBus();
  resetCareerTimelineHandlerRegistration();
  registerCareerTimelineHandlers();
  const handled = listTimelineHandledCareerEvents();
  if (handled.length >= 13) pass('timeline handlers registered');
  else fail('timeline handlers registered');
  if (getCareerEventSubscriberCount('TalentProfileUpdated') >= 1) pass('TalentProfileUpdated handler');
  else fail('TalentProfileUpdated handler');
  if (getCareerEventSubscriberCount('ApplicationCreated') >= 1) pass('ApplicationCreated handler');
  else fail('ApplicationCreated handler');
  if (getCareerEventSubscriberCount('DocumentCreated') >= 1) pass('DocumentCreated handler');
  else fail('DocumentCreated handler');
  if (getCareerEventSubscriberCount('CredentialIssued') >= 1) pass('CredentialIssued handler');
  else fail('CredentialIssued handler');

  const evt = emitCareerEvent('TalentProfileUpdated', { userId: 'u1', changedSections: ['headline'] }, {
    aggregateId: 'tp1',
    actor: { type: 'talent', id: 'u1' },
  });
  if (evt.eventType === 'TalentProfileUpdated') pass('CareerEventBus emit');
  else fail('CareerEventBus emit');
}

// Analytics bridges (inline from services — acceptable; timeline async)
{
  for (const f of [
    'server/src/services/career/careerAnalyticsBridge.js',
    'server/src/services/career/careerApplicationBridge.js',
    'server/src/services/career/careerDocumentBridge.js',
  ]) {
    const c = read(f);
    if (c.includes('scheduleAnalyticsEvent')) pass(`analytics bridge ${f.split('/').pop()}`);
    else fail(`analytics bridge ${f.split('/').pop()}`);
  }
}

// Search integration
{
  const hub = read('server/src/utils/contentIntegration.js');
  const mappers = read('server/src/services/search/documentMappers.js');
  const indexer = read('server/src/services/search/SearchIndexer.js');
  const types = read('shared/search/entityTypes.js');
  if (hub.includes('onCareerEntitySaved') && hub.includes('credential')) pass('career search hook');
  else fail('career search hook');
  if (mappers.includes('mapTalentProfileToSearchDocument') && mappers.includes('mapCredentialToSearchDocument')) {
    pass('search mappers');
  } else fail('search mappers');
  if (indexer.includes('credential: Credential') && types.includes("'credential'")) pass('credential indexer');
  else fail('credential indexer');
}

// Media library integration
{
  const media = read('server/src/services/mediaService.js');
  if (media.includes('createMediaAssetFromBuffer') && media.includes('MediaAsset.create')) pass('MediaAsset helper');
  else fail('MediaAsset helper');
}

// Workflow integration (platform-wide)
{
  const wf = read('server/src/services/workflow/workflowIntegration.js');
  if (wf.includes('syncWorkflowAfterSave')) pass('workflow integration available');
  else fail('workflow integration available');
}

// Localization namespaces
{
  const i18n = read('client/src/i18n/config.js');
  for (const ns of ['talent', 'applications', 'timeline', 'documents-platform']) {
    if (i18n.includes(`'${ns}'`)) pass(`i18n namespace ${ns}`);
    else fail(`i18n namespace ${ns}`);
  }
}

// Feature flags on all career routes
{
  const flags = read('server/src/config/careerFeatureFlags.js');
  const routes = [
    ['talent.js', 'requireTalentProfileEnabled'],
    ['opportunityApplications.js', 'requireOpportunityApplicationEnabled'],
    ['timeline.js', 'requireTimelineEnabled'],
    ['documents.js', 'requireDocumentsPlatformEnabled'],
    ['credentials.js', 'requireDocumentsPlatformEnabled'],
  ];
  for (const [file, middleware] of routes) {
    const c = read(`server/src/routes/${file}`);
    if (c.includes(middleware)) pass(`flag gate ${file}`);
    else fail(`flag gate ${file}`);
  }
  if (flags.includes('isDocumentsPlatformEnabled') && flags.includes('isTimelineEnabled')) pass('server feature flags');
  else fail('server feature flags');
}

// Permissions: auth on career APIs
{
  for (const file of ['talent.js', 'documents.js', 'credentials.js', 'timeline.js', 'opportunityApplications.js']) {
    const c = read(`server/src/routes/${file}`);
    if (c.includes('requireAuth') && c.includes('requireUserAuth')) pass(`auth ${file}`);
    else fail(`auth ${file}`);
  }
}

// Ownership in services
{
  const checks = [
    ['TimelineService.js', 'findByIdForUser'],
    ['DocumentService.js', 'findByIdForUser'],
    ['CredentialPlatformService.js', 'findByIdForUser'],
    ['OpportunityApplicationService.js', 'getOwnedApplication'],
  ];
  for (const [file, pattern] of checks) {
    if (read(`server/src/services/career/${file}`).includes(pattern)) pass(`ownership ${file}`);
    else fail(`ownership ${file}`);
  }
}

// Mongo indexes on hot paths
{
  const indexChecks = [
    ['TimelineEvent.js', 'occurredAt'],
    ['Document.js', 'versionGroupId'],
    ['Credential.js', 'verificationStatus'],
    ['OpportunityApplication.js', 'pipelineStage'],
    ['TalentProfile.js', 'visibility'],
  ];
  for (const [file, field] of indexChecks) {
    if (read(`server/src/models/career/${file}`).includes(field)) pass(`index ${file}`);
    else fail(`index ${file}`);
  }
}

// Timeline pagination
{
  const repo = read('server/src/repositories/career/TimelineEventRepository.js');
  if (repo.includes('nextCursor') && repo.includes('encodeCursor')) pass('timeline cursor pagination');
  else fail('timeline cursor pagination');
}

// Domain events registry complete
{
  for (const evt of ['DocumentCreated', 'CredentialIssued', 'CredentialVerified', 'TimelineEventCreated']) {
    if (CAREER_DOMAIN_EVENTS.includes(evt)) pass(`domain event ${evt}`);
    else fail(`domain event ${evt}`);
  }
}

// Client API surface (canonical)
{
  for (const f of ['talentApi.js', 'applicationsApi.js', 'timelineApi.js', 'documentsApi.js', 'credentialsApi.js']) {
    if (exists(`client/src/services/${f}`)) pass(`client API ${f}`);
    else fail(`client API ${f}`);
  }
}

// Application attach uses canonical document resolution
{
  const app = read('server/src/services/career/OpportunityApplicationService.js');
  if (app.includes('DocumentRepository') && app.includes('documentId')) pass('application document attach canonical');
  else fail('application document attach canonical');
}

// Startup wiring
{
  const index = read('server/src/index.js');
  if (index.includes('registerCareerTimelineHandlers')) pass('timeline handlers at startup');
  else fail('timeline handlers at startup');
  for (const router of ['timelineRouter', 'documentsRouter', 'credentialsRouter', 'opportunityApplicationsRouter', 'talentRouter', 'careerDashboardRouter']) {
    if (index.includes(router)) pass(`mounted ${router}`);
    else fail(`mounted ${router}`);
  }
}

// Sub-suite: career-domain (includes all C.8 verify scripts)
{
  const domain = runNpm('verify:career-domain');
  if (domain.ok) pass('verify:career-domain sub-suite');
  else fail('verify:career-domain sub-suite', domain.out.slice(-500));
}

// Client build
{
  const build = runNpm('build', join(root, 'client'));
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-400));
}

console.log(`\nCareer platform verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
