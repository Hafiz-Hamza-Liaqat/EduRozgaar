#!/usr/bin/env node
/**
 * TalentProfile backend foundation verification (C.8.0.2A)
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  TALENT_PROFILE_STATUSES,
  CAREER_DOMAIN_EVENTS,
} from '../shared/career/constants.js';
import {
  parseTalentProfileInput,
  validateTalentProfileInput,
  validateResumeVersionInput,
  validateProfileDocumentInput,
} from '../shared/career/validation.js';
import { ANALYTICS_EVENT_TYPES } from '../shared/analytics/eventTypes.js';
import { SEARCH_ENTITY_TYPES } from '../shared/search/entityTypes.js';
import { emitCareerEvent, resetCareerEventBus, getRecentCareerEvents } from '../server/src/services/career/CareerEventBus.js';
import { ProfileValidationService } from '../server/src/services/career/ProfileValidationService.js';
import {
  isTalentProfileEnabled,
  isTalentProfileDualWrite,
} from '../server/src/config/careerFeatureFlags.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// Shared constants
{
  if (TALENT_PROFILE_STATUSES.includes('draft') && TALENT_PROFILE_STATUSES.includes('active')) {
    pass('talent profile statuses');
  } else fail('talent profile statuses');
  if (CAREER_DOMAIN_EVENTS.includes('TalentProfileCreated') && CAREER_DOMAIN_EVENTS.includes('ApplicationCreated')) {
    pass('career domain events');
  } else fail('career domain events', `count=${CAREER_DOMAIN_EVENTS.length}`);
}

// Shared validation
{
  const parsed = parseTalentProfileInput({ displayName: 'Test User', headline: 'Engineer' });
  const errors = validateTalentProfileInput(parsed);
  if (!errors.length) pass('validate talent profile input');
  else fail('validate talent profile input', errors.join('; '));

  const bad = validateTalentProfileInput({ status: 'invalid' }, { partial: true });
  if (bad.length) pass('reject invalid profile status');
  else fail('reject invalid profile status');

  const resumeErr = validateResumeVersionInput({ title: 'CV', template: 'modern-professional' });
  if (!resumeErr.length) pass('validate resume version');
  else fail('validate resume version', resumeErr.join('; '));

  const docErr = validateProfileDocumentInput({ label: 'Transcript', documentType: 'transcript' });
  if (!docErr.length) pass('validate profile document');
  else fail('validate profile document', docErr.join('; '));

  try {
    ProfileValidationService.assertTalentProfile({ displayName: 'A' });
    pass('ProfileValidationService.assertTalentProfile');
  } catch (e) {
    fail('ProfileValidationService.assertTalentProfile', e.message);
  }
}

// Event bus
{
  resetCareerEventBus();
  const event = emitCareerEvent('TalentProfileCreated', { userId: 'abc' }, {
    aggregateType: 'TalentProfile',
    aggregateId: '507f1f77bcf86cd799439011',
    actor: { type: 'talent', id: 'abc' },
  });
  if (event.eventId && event.eventType === 'TalentProfileCreated') pass('CareerEventBus.emit');
  else fail('CareerEventBus.emit');
  const recent = getRecentCareerEvents(5);
  if (recent.length >= 1) pass('CareerEventBus history');
  else fail('CareerEventBus history');
}

// Feature flags
{
  const prev = process.env.TALENT_PROFILE_ENABLED;
  process.env.TALENT_PROFILE_ENABLED = '0';
  if (!isTalentProfileEnabled()) pass('feature flag disabled');
  else fail('feature flag disabled');
  process.env.TALENT_PROFILE_ENABLED = '1';
  if (isTalentProfileEnabled()) pass('feature flag enabled');
  else fail('feature flag enabled');
  process.env.TALENT_PROFILE_DUAL_WRITE = '1';
  if (isTalentProfileDualWrite()) pass('dual write flag');
  else fail('dual write flag');
  if (prev === undefined) delete process.env.TALENT_PROFILE_ENABLED;
  else process.env.TALENT_PROFILE_ENABLED = prev;
}

// Models
for (const f of [
  'server/src/models/career/TalentProfile.js',
  'server/src/models/career/ResumeVersion.js',
  'server/src/models/career/ProfileDocument.js',
  'server/src/models/career/Credential.js',
  'server/src/models/career/SocialProfile.js',
  'server/src/models/career/CareerPreference.js',
  'server/src/models/career/LanguageSkill.js',
  'server/src/models/career/CertificationReference.js',
  'server/src/models/career/PortfolioReference.js',
]) {
  if (exists(f)) pass(`model ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Repositories
for (const f of [
  'server/src/repositories/career/TalentProfileRepository.js',
  'server/src/repositories/career/ResumeVersionRepository.js',
  'server/src/repositories/career/ProfileDocumentRepository.js',
  'server/src/repositories/career/CredentialRepository.js',
]) {
  if (exists(f)) pass(`repository ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Services
for (const f of [
  'server/src/services/career/TalentProfileService.js',
  'server/src/services/career/ResumeVersionService.js',
  'server/src/services/career/ProfileHydrationService.js',
  'server/src/services/career/ProfileValidationService.js',
  'server/src/services/career/CareerEventBus.js',
  'server/src/services/career/careerAnalyticsBridge.js',
  'server/src/services/career/ProfileDocumentService.js',
]) {
  if (exists(f)) pass(`service ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Controllers thin — delegate to services
{
  const ctrl = read('server/src/controllers/career/talentProfileController.js');
  if (ctrl.includes('TalentProfileService') && !ctrl.includes('TalentProfile.create')) {
    pass('thin talentProfileController');
  } else fail('thin talentProfileController');
}

// Routes
{
  const routes = read('server/src/routes/talent.js');
  if (routes.includes("talentRouter.get('/talent/me'") && routes.includes('requireUserAuth')) {
    pass('talent routes auth');
  } else fail('talent routes auth');
  if (read('server/src/index.js').includes('talentRouter')) pass('talent router mounted');
  else fail('talent router mounted');
}

// Integration hub
{
  const hub = read('server/src/utils/contentIntegration.js');
  if (hub.includes('onCareerEntitySaved') && hub.includes('CAREER_TO_SEARCH_ENTITY')) {
    pass('contentIntegration career hooks');
  } else fail('contentIntegration career hooks');
  const svc = read('server/src/services/career/TalentProfileService.js');
  if (svc.includes('onCareerEntitySaved') && svc.includes('emitCareerEvent')) {
    pass('service uses hub + events');
  } else fail('service uses hub + events');
}

// Search indexing hooks
{
  if (SEARCH_ENTITY_TYPES.includes('talent-profile')) pass('search entity type');
  else fail('search entity type');
  const mappers = read('server/src/services/search/documentMappers.js');
  if (mappers.includes('mapTalentProfileToSearchDocument')) pass('talent profile search mapper');
  else fail('talent profile search mapper');
  const indexer = read('server/src/services/search/SearchIndexer.js');
  if (indexer.includes('talent-profile')) pass('SearchIndexer talent-profile');
  else fail('SearchIndexer talent-profile');
}

// Analytics events
{
  for (const t of ['profile_created', 'profile_updated', 'resume_version_created', 'resume_published']) {
    if (ANALYTICS_EVENT_TYPES.includes(t)) pass(`analytics event ${t}`);
    else fail(`analytics event ${t}`);
  }
  const bridge = read('server/src/services/career/careerAnalyticsBridge.js');
  if (bridge.includes('scheduleAnalyticsEvent')) pass('career analytics bridge');
  else fail('career analytics bridge');
}

// Migration script
{
  if (exists('server/src/scripts/hydrateTalentProfiles.js')) pass('hydration script');
  else fail('hydration script');
  if (exists('server/src/config/careerFeatureFlags.js')) pass('career feature flags');
  else fail('career feature flags');
}

// Indexes in models
{
  const tp = read('server/src/models/career/TalentProfile.js');
  if (tp.includes('userId') && tp.includes('unique: true')) pass('TalentProfile userId index');
  else fail('TalentProfile userId index');
  const rv = read('server/src/models/career/ResumeVersion.js');
  if (rv.includes('talentProfileId: 1')) pass('ResumeVersion indexes');
  else fail('ResumeVersion indexes');
}

// Localization fields
{
  const tp = read('server/src/models/career/TalentProfile.js');
  if (tp.includes('locale') && tp.includes('market')) pass('localization fields on profile');
  else fail('localization fields on profile');
}

// Out of scope guard — no UI/dashboard/scoring in this sprint
{
  const clientTalent = exists('client/src/pages/Career/TalentProfile.jsx');
  if (!clientTalent) pass('no talent profile UI (expected)');
  else fail('unexpected talent profile UI file');
  const scoring = read('server/src/services/career/TalentProfileService.js');
  if (!scoring.includes('ScoringService') && !scoring.includes('readiness')) {
    pass('no scoring in talent service');
  } else fail('no scoring in talent service');
}

// User model unchanged
{
  const user = read('server/src/models/User.js');
  if (!user.includes('talentProfileId') && !user.includes('skills')) pass('User model unchanged');
  else fail('User model should not gain career fields');
}

console.log(`\nC.8.0.2A TalentProfile verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
