#!/usr/bin/env node
/**
 * Documents & Credentials Platform verification (C.8.0.5).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  CANONICAL_DOCUMENT_TYPES,
  DOCUMENT_PARENT_TYPES,
  CREDENTIAL_STATUSES,
  CAREER_DOMAIN_EVENTS,
} from '../shared/career/constants.js';
import {
  parseDocumentInput,
  validateDocumentInput,
  parseCredentialInput,
  validateCredentialInput,
} from '../shared/career/validation.js';
import { TIMELINE_VERBS } from '../shared/career/timelineVerbs.js';
import { CAREER_EVENT_TO_TIMELINE } from '../shared/career/timelineEventMap.js';
import {
  emitCareerEvent,
  resetCareerEventBus,
  getCareerEventSubscriberCount,
} from '../server/src/services/career/CareerEventBus.js';
import {
  registerCareerTimelineHandlers,
  resetCareerTimelineHandlerRegistration,
} from '../server/src/services/career/careerEventHandlers.js';
import { isDocumentsPlatformEnabled } from '../server/src/config/careerFeatureFlags.js';
import { SEARCH_ENTITY_TYPES } from '../shared/search/entityTypes.js';

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

// Canonical Document model
{
  const model = read('server/src/models/career/Document.js');
  if (model.includes("collection: 'documents'") && model.includes('versionGroupId')) pass('Document model');
  else fail('Document model');
  if (model.includes('mediaAssetId') && model.includes('downloadPermission')) pass('Document fields');
  else fail('Document fields');
}

// Credential model
{
  const model = read('server/src/models/career/Credential.js');
  if (model.includes('verificationStatus') && model.includes('documentId') && model.includes('skillName')) {
    pass('Credential model');
  } else fail('Credential model');
}

// No duplicate standalone activity collections for documents
{
  const forbidden = ["collection: 'profileDocuments'", "mongoose.model('UserDocument'"];
  let dup = false;
  for (const f of forbidden) {
    if (read('server/src/models/career/Document.js').includes(f)) dup = true;
  }
  if (!dup) pass('canonical documents collection only');
  else fail('canonical documents collection only');
}

// Repository / service / controller separation
{
  for (const f of [
    'server/src/repositories/career/DocumentRepository.js',
    'server/src/services/career/DocumentService.js',
    'server/src/services/career/CredentialPlatformService.js',
    'server/src/controllers/career/documentController.js',
    'server/src/controllers/career/credentialController.js',
    'server/src/routes/documents.js',
    'server/src/routes/credentials.js',
  ]) {
    if (exists(f)) pass(`layer ${f.split('/').pop()}`);
    else fail(`layer ${f.split('/').pop()}`);
  }

  const docCtrl = read('server/src/controllers/career/documentController.js');
  if (docCtrl.includes('DocumentService') && !docCtrl.includes('DocumentRepository')) pass('thin document controller');
  else fail('thin document controller');
}

// Ownership + permissions
{
  const repo = read('server/src/repositories/career/DocumentRepository.js');
  const svc = read('server/src/services/career/DocumentService.js');
  if (repo.includes('findByIdForUser') && svc.includes('canDownload')) pass('ownership checks');
  else fail('ownership checks');
  if (svc.includes('downloadPermission') || read('server/src/models/career/Document.js').includes('downloadPermission')) {
    pass('download permissions');
  } else fail('download permissions');
}

// Versioning
{
  const svc = read('server/src/services/career/DocumentService.js');
  if (svc.includes('createVersion') && svc.includes('listVersions') && svc.includes('versionNumber')) {
    pass('version history');
  } else fail('version history');
}

// Upload integration (MediaAsset, no new upload route)
{
  const media = read('server/src/services/mediaService.js');
  const upload = read('server/src/controllers/career/profileDocumentUploadController.js');
  if (media.includes('createMediaAssetFromBuffer')) pass('MediaAsset helper');
  else fail('MediaAsset helper');
  if (upload.includes('DocumentService.createFromUpload') && !upload.includes('uploadFile(')) pass('upload delegates to DocumentService');
  else fail('upload delegates to DocumentService');
  const index = read('server/src/index.js');
  if (!index.includes('/documents/upload')) pass('no new global upload route');
  else fail('no new global upload route');
}

// Timeline events
{
  for (const evt of ['DocumentCreated', 'CredentialIssued', 'CredentialVerified']) {
    if (CAREER_DOMAIN_EVENTS.includes(evt)) pass(`domain event ${evt}`);
    else fail(`domain event ${evt}`);
  }
  if (CAREER_EVENT_TO_TIMELINE.DocumentCreated && CAREER_EVENT_TO_TIMELINE.CredentialIssued) {
    pass('timeline event map');
  } else fail('timeline event map');
  const bridge = read('server/src/services/career/careerDocumentBridge.js');
  if (bridge.includes('trackDocumentPlatformFromEvent') && bridge.includes('document_uploaded')) pass('analytics bridge');
  else fail('analytics bridge');
}

// Bus handlers include document events
{
  resetCareerEventBus();
  resetCareerTimelineHandlerRegistration();
  registerCareerTimelineHandlers();
  if (getCareerEventSubscriberCount('DocumentCreated') >= 1) pass('DocumentCreated timeline handler');
  else fail('DocumentCreated timeline handler');
}

// Validation
{
  const docErr = validateDocumentInput({ label: 'Passport', documentType: 'passport', mediaAssetId: '507f1f77bcf86cd799439011' });
  if (docErr.length === 0) pass('document validation');
  else fail('document validation', docErr.join('; '));
  const credErr = validateCredentialInput({ title: 'JavaScript Verified' });
  if (credErr.length === 0) pass('credential validation');
  else fail('credential validation');
  if (CANONICAL_DOCUMENT_TYPES.includes('visa') && DOCUMENT_PARENT_TYPES.includes('talent_profile')) pass('document type registry');
  else fail('document type registry');
}

// API routes
{
  const routes = read('server/src/routes/documents.js');
  const credRoutes = read('server/src/routes/credentials.js');
  if (routes.includes('/documents') && routes.includes('requireDocumentsPlatformEnabled')) pass('documents routes');
  else fail('documents routes');
  if (credRoutes.includes('/credentials') && credRoutes.includes('verify')) pass('credentials routes');
  else fail('credentials routes');
}

// TalentProfile integration
{
  const profile = read('server/src/services/career/ProfileDocumentService.js');
  if (profile.includes('DocumentService')) pass('ProfileDocumentService delegates');
  else fail('ProfileDocumentService delegates');
  const readSvc = read('server/src/services/career/TalentProfileReadService.js');
  if (readSvc.includes('DocumentRepository')) pass('TalentProfileReadService uses canonical docs');
  else fail('TalentProfileReadService uses canonical docs');
}

// Search integration
{
  if (SEARCH_ENTITY_TYPES.includes('credential')) pass('credential search entity type');
  else fail('credential search entity type');
  const mappers = read('server/src/services/search/documentMappers.js');
  if (mappers.includes('mapCredentialToSearchDocument')) pass('credential search mapper');
  else fail('credential search mapper');
}

// Localization
{
  const i18n = read('client/src/i18n/config.js');
  if (i18n.includes("'documents-platform'")) pass('documents-platform i18n');
  else fail('documents-platform i18n');
  const en = JSON.parse(read('client/src/i18n/locales/en/documents-platform.json'));
  if (CANONICAL_DOCUMENT_TYPES.every((t) => en.types?.[t])) pass('document type labels');
  else fail('document type labels');
}

// Feature flags
{
  const prev = process.env.DOCUMENTS_PLATFORM_ENABLED;
  process.env.DOCUMENTS_PLATFORM_ENABLED = '0';
  if (!isDocumentsPlatformEnabled()) pass('DOCUMENTS_PLATFORM_ENABLED off');
  else fail('DOCUMENTS_PLATFORM_ENABLED off');
  process.env.DOCUMENTS_PLATFORM_ENABLED = '1';
  if (isDocumentsPlatformEnabled()) pass('DOCUMENTS_PLATFORM_ENABLED on');
  else fail('DOCUMENTS_PLATFORM_ENABLED on');
  process.env.DOCUMENTS_PLATFORM_ENABLED = prev;
  const env = read('.env.template');
  if (env.includes('DOCUMENTS_PLATFORM_ENABLED')) pass('env template flag');
  else fail('env template flag');
}

// Client APIs
{
  if (exists('client/src/services/documentsApi.js') && exists('client/src/services/credentialsApi.js')) {
    pass('client platform APIs');
  } else fail('client platform APIs');
}

// No controller-side bus writes for documents
{
  const ctrl = read('server/src/controllers/career/documentController.js');
  if (!ctrl.includes('emitCareerEvent')) pass('controller no direct emit');
  else fail('controller no direct emit');
  const svc = read('server/src/services/career/DocumentService.js');
  if (svc.includes('emitCareerEvent') && svc.includes('trackDocumentPlatformFromEvent')) pass('service owns events');
  else fail('service owns events');
}

// Application attach supports documentId
{
  const ref = read('server/src/models/career/ApplicationDocumentReference.js');
  const app = read('server/src/services/career/OpportunityApplicationService.js');
  if (ref.includes('documentId') && app.includes('DocumentRepository')) pass('application document integration');
  else fail('application document integration');
}

// Sub-suite: timeline (includes new verb labels)
{
  const sub = runNpm('verify:timeline');
  if (sub.ok) pass('verify:timeline sub-suite');
  else fail('verify:timeline sub-suite', sub.out.slice(-400));
}

console.log(`\nDocuments platform verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
