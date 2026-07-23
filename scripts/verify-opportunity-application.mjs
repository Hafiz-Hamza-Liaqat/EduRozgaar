#!/usr/bin/env node
/**
 * OpportunityApplication backend foundation verification (C.8.0.3A).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  PIPELINE_STAGES,
  CAREER_DOMAIN_EVENTS,
  OPPORTUNITY_TYPES,
} from '../shared/career/constants.js';
import {
  canTransition,
  assertValidTransition,
  getInitialStage,
  resolveStageTemplateId,
  listStageTemplates,
  STAGE_TEMPLATES,
} from '../shared/career/applicationStageMachine.js';
import {
  validateOpportunityApplicationInput,
  validateStageTransitionInput,
  parseOpportunityApplicationInput,
} from '../shared/career/validation.js';
import {
  emitCareerEvent,
  resetCareerEventBus,
  getRecentCareerEvents,
} from '../server/src/services/career/CareerEventBus.js';
import { ApplicationStageMachineService } from '../server/src/services/career/ApplicationValidationService.js';
import {
  isOpportunityApplicationEnabled,
} from '../server/src/config/careerFeatureFlags.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// Canonical model
{
  if (exists('server/src/models/career/OpportunityApplication.js')) pass('OpportunityApplication model');
  else fail('OpportunityApplication model');

  const legacy = read('server/src/models/Application.js');
  if (legacy.includes("mongoose.model('Application'") && !legacy.includes('OpportunityApplication')) {
    pass('legacy Application preserved separately');
  } else fail('legacy Application model check');

  const opp = read('server/src/models/career/OpportunityApplication.js');
  if (opp.includes('opportunityRef') && opp.includes('collection: \'opportunityApplications\'')) {
    pass('canonical collection name');
  } else fail('canonical collection name');

  if (!opp.includes('new mongoose.Schema') || !read('server/src/models/career/OpportunityApplication.js').includes('Job')) {
    pass('no duplicated Job/Scholarship fields');
  } else fail('no duplicated listing fields');
}

// OpportunityReference embedded
{
  const ref = read('server/src/models/career/OpportunityReference.js');
  if (ref.includes('opportunityType') && ref.includes('opportunityId')) pass('OpportunityReference');
  else fail('OpportunityReference');
}

// Supporting embedded schemas
for (const f of [
  'StageHistory.js',
  'ApplicationNote.js',
  'ApplicationDocumentReference.js',
  'ReminderReference.js',
  'ApplicationActivityReference.js',
]) {
  if (exists(`server/src/models/career/${f}`)) pass(`schema ${f}`);
  else fail(`schema ${f}`);
}

// 13-stage pipeline
{
  if (PIPELINE_STAGES.length === 13) pass('13 pipeline stages');
  else fail('13 pipeline stages', `count=${PIPELINE_STAGES.length}`);

  const expected = ['interested', 'preparing', 'applied', 'viewed', 'screening', 'assessment', 'interview', 'offer', 'negotiation', 'accepted', 'joined', 'rejected', 'withdrawn'];
  if (expected.every((s) => PIPELINE_STAGES.includes(s))) pass('stage names match sprint spec');
  else fail('stage names match sprint spec');
}

// State machine integrity
{
  if (getInitialStage('job') === 'interested') pass('job initial stage');
  else fail('job initial stage');

  if (canTransition('job_default', 'interested', 'preparing')) pass('valid transition interested→preparing');
  else fail('valid transition interested→preparing');

  if (!canTransition('job_default', 'interested', 'offer')) pass('invalid transition blocked');
  else fail('invalid transition blocked');

  if (!canTransition('scholarship_default', 'assessment', 'interview')) pass('scholarship template skips interview');
  else fail('scholarship template skips interview');

  try {
    assertValidTransition('job_default', 'interested', 'offer');
    fail('assertValidTransition throws on invalid');
  } catch (e) {
    if (e.code === 'INVALID_STAGE_TRANSITION') pass('assertValidTransition throws on invalid');
    else fail('assertValidTransition throws on invalid', e.message);
  }

  if (listStageTemplates().length >= 4) pass('stage templates listed');
  else fail('stage templates listed');

  if (ApplicationStageMachineService.getAllowedTransitions('job_default', 'applied').includes('viewed')) {
    pass('ApplicationStageMachineService');
  } else fail('ApplicationStageMachineService');
}

// Domain events
{
  const applicationEvents = [
    'ApplicationCreated',
    'ApplicationUpdated',
    'StageChanged',
    'ApplicationWithdrawn',
    'NoteAdded',
    'ReminderCreated',
    'DocumentAttached',
    'OfferAccepted',
    'ApplicationArchived',
  ];
  for (const ev of applicationEvents) {
    if (CAREER_DOMAIN_EVENTS.includes(ev)) pass(`event ${ev}`);
    else fail(`event ${ev}`);
  }

  resetCareerEventBus();
  const event = emitCareerEvent('ApplicationCreated', { applicationId: 'abc' }, {
    aggregateType: 'OpportunityApplication',
    aggregateId: '507f1f77bcf86cd799439011',
    actor: { type: 'talent', id: 'user1' },
  });
  if (event.aggregateType === 'OpportunityApplication') pass('CareerEventBus aggregate type');
  else fail('CareerEventBus aggregate type');
  if (getRecentCareerEvents(1).length === 1) pass('CareerEventBus history');
  else fail('CareerEventBus history');
}

// Service/controller boundaries
{
  const ctrl = read('server/src/controllers/career/opportunityApplicationController.js');
  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (ctrl.includes('OpportunityApplicationService') && !ctrl.includes('emitCareerEvent')) {
    pass('thin controller');
  } else fail('thin controller');
  if (svc.includes('emitApplicationEvent') && svc.includes('ApplicationStageMachineService')) {
    pass('service owns mutations');
  } else fail('service owns mutations');
  if (!svc.includes('scheduleAnalyticsEvent') && !svc.includes('notificationService')) {
    pass('no controller-side cross-cutting in service via direct notification');
  } else fail('service cross-cutting leak');
}

// Bridge handles analytics
{
  const bridge = read('server/src/services/career/careerApplicationBridge.js');
  if (bridge.includes('scheduleAnalyticsEvent') && bridge.includes('application_created')) {
    pass('analytics bridge');
  } else fail('analytics bridge');
}

// Feature flags
{
  const prev = process.env.OPPORTUNITY_APPLICATION_ENABLED;
  process.env.OPPORTUNITY_APPLICATION_ENABLED = '0';
  if (!isOpportunityApplicationEnabled()) pass('feature flag off');
  else fail('feature flag off');
  process.env.OPPORTUNITY_APPLICATION_ENABLED = '1';
  if (isOpportunityApplicationEnabled()) pass('feature flag on');
  else fail('feature flag on');
  if (prev === undefined) delete process.env.OPPORTUNITY_APPLICATION_ENABLED;
  else process.env.OPPORTUNITY_APPLICATION_ENABLED = prev;
}

// API routes
{
  const routes = read('server/src/routes/opportunityApplications.js');
  for (const ep of [
    '/applications',
    '/applications/:id',
    '/applications/:id/stage',
    '/applications/:id/notes',
    '/applications/:id/documents',
    '/applications/:id/reminders',
  ]) {
    if (routes.includes(ep)) pass(`route ${ep}`);
    else fail(`route ${ep}`);
  }
  if (routes.includes('requireOpportunityApplicationEnabled')) pass('route feature gating');
  else fail('route feature gating');
}

// Repository
{
  if (exists('server/src/repositories/career/OpportunityApplicationRepository.js')) pass('repository');
  else fail('repository');
}

// TalentProfile integration
{
  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('TalentProfileRepository') && svc.includes('talentProfileId')) pass('TalentProfile integration');
  else fail('TalentProfile integration');
}

// Documents integration
{
  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('ProfileDocumentRepository')) pass('documents integration');
  else fail('documents integration');
}

// Opportunity resolver — no duplication
{
  const resolver = read('server/src/services/career/OpportunityResolverService.js');
  if (resolver.includes('Job.findById') && resolver.includes('Scholarship.findById')) pass('opportunity resolver');
  else fail('opportunity resolver');
}

// Localization
{
  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('normalizeLocale')) pass('localization');
  else fail('localization');
}

// Permissions — auth middleware on routes
{
  const routes = read('server/src/routes/opportunityApplications.js');
  if (routes.includes('requireAuth') && routes.includes('requireUserAuth')) pass('permissions middleware');
  else fail('permissions middleware');
}

// Search/cache integration hook
{
  const integration = read('server/src/utils/contentIntegration.js');
  if (integration.includes('opportunity-application')) pass('search integration registry');
  else fail('search integration registry');
}

// Analytics event types registered
{
  const types = read('shared/analytics/eventTypes.js');
  if (types.includes('application_created') && types.includes('application_stage_changed')) {
    pass('analytics event types');
  } else fail('analytics event types');
}

// Shared validation
{
  const parsed = parseOpportunityApplicationInput({
    opportunityType: 'job',
    opportunityId: '507f1f77bcf86cd799439011',
  });
  const errors = validateOpportunityApplicationInput(parsed, { partial: false });
  if (!errors.length) pass('validation create payload');
  else fail('validation create payload', errors.join('; '));

  const bad = validateStageTransitionInput({ toStage: 'offer' }, 'interested', 'job');
  if (bad.length) pass('validation rejects bad transition');
  else fail('validation rejects bad transition');
}

// Opportunity types cover platform listings
{
  for (const t of ['job', 'scholarship', 'admission', 'internship']) {
    if (OPPORTUNITY_TYPES.includes(t) && resolveStageTemplateId(t)) pass(`opportunity type ${t}`);
    else fail(`opportunity type ${t}`);
  }
}

// Env template
{
  const env = read('.env.template');
  if (env.includes('OPPORTUNITY_APPLICATION_ENABLED')) pass('env template flag');
  else fail('env template flag');
}

console.log(`\nOpportunityApplication verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
