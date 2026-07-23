#!/usr/bin/env node
/**
 * Timeline Platform verification (C.8.0.4).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { TIMELINE_VERBS } from '../shared/career/timelineVerbs.js';
import {
  mapCareerEventToTimelineInput,
  listTimelineHandledCareerEvents,
  CAREER_EVENT_TO_TIMELINE,
} from '../shared/career/timelineEventMap.js';
import {
  parseTimelineQueryInput,
  validateTimelineQueryInput,
} from '../shared/career/validation.js';
import { CAREER_DOMAIN_EVENTS } from '../shared/career/constants.js';
import {
  emitCareerEvent,
  resetCareerEventBus,
  getCareerEventSubscriberCount,
} from '../server/src/services/career/CareerEventBus.js';
import {
  registerCareerTimelineHandlers,
  resetCareerTimelineHandlerRegistration,
} from '../server/src/services/career/careerEventHandlers.js';
import { isTimelineEnabled } from '../server/src/config/careerFeatureFlags.js';

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

// Canonical TimelineEvent model
{
  const model = read('server/src/models/career/TimelineEvent.js');
  if (model.includes("collection: 'timelineEvents'") && model.includes('careerEventId')) pass('TimelineEvent model');
  else fail('TimelineEvent model');
  if (model.includes('subjectTalentProfileId') && model.includes('verb')) pass('TimelineEvent schema fields');
  else fail('TimelineEvent schema fields');
}

// No duplicate standalone activity collections
{
  const forbidden = [
    'mongoose.model(\'Activity\'',
    'mongoose.model(\'ApplicationActivity\'',
    'collection: \'applicationActivities\'',
    'collection: \'platformActivities\'',
  ];
  let dup = false;
  for (const rel of [
    'server/src/models/career/TimelineEvent.js',
    'server/src/models/career/OpportunityApplication.js',
  ]) {
    const c = read(rel);
    for (const f of forbidden) {
      if (c.includes(f)) dup = true;
    }
  }
  if (!dup) pass('no duplicate activity collections');
  else fail('no duplicate activity collections');

  const opp = read('server/src/models/career/OpportunityApplication.js');
  if (opp.includes('activityReferences') && opp.includes('ApplicationActivityReference')) {
    pass('activityReferences remain denormalized hook only');
  } else fail('activityReferences hook');
}

// Repository / service / controller separation
{
  for (const f of [
    'server/src/repositories/career/TimelineEventRepository.js',
    'server/src/services/career/TimelineService.js',
    'server/src/controllers/career/timelineController.js',
    'server/src/routes/timeline.js',
  ]) {
    if (exists(f)) pass(`layer ${f.split('/').pop()}`);
    else fail(`layer ${f.split('/').pop()}`);
  }

  const controller = read('server/src/controllers/career/timelineController.js');
  const service = read('server/src/services/career/TimelineService.js');
  if (controller.includes('TimelineService') && !controller.includes('TimelineEventRepository')) {
    pass('thin timeline controller');
  } else fail('thin timeline controller');
  if (service.includes('TimelineEventRepository') && !service.includes('res.json')) pass('service owns persistence');
  else fail('service owns persistence');
}

// Event map + verbs
{
  if (TIMELINE_VERBS.length >= 10) pass('timeline verb registry');
  else fail('timeline verb registry');
  if (CAREER_DOMAIN_EVENTS.includes('TimelineEventCreated')) pass('TimelineEventCreated domain event');
  else fail('TimelineEventCreated domain event');

  const sample = mapCareerEventToTimelineInput({
    eventType: 'ApplicationCreated',
    eventId: 'evt-1',
    occurredAt: new Date().toISOString(),
    aggregateId: 'app-1',
    actor: { type: 'talent', id: 'user-1' },
    payload: {
      talentProfileId: 'tp-1',
      opportunityType: 'job',
      pipelineStage: 'interested',
    },
  });
  if (sample?.verb === 'application.created' && sample.careerEventId === 'evt-1') pass('event map ApplicationCreated');
  else fail('event map ApplicationCreated');

  const handled = listTimelineHandledCareerEvents();
  if (handled.length === Object.keys(CAREER_EVENT_TO_TIMELINE).length) pass('handled career events listed');
  else fail('handled career events listed');
}

// CareerEventBus handlers registered
{
  resetCareerEventBus();
  resetCareerTimelineHandlerRegistration();
  registerCareerTimelineHandlers();
  if (getCareerEventSubscriberCount('ApplicationCreated') >= 1) pass('ApplicationCreated handler registered');
  else fail('ApplicationCreated handler registered');
  if (getCareerEventSubscriberCount('TalentProfileUpdated') >= 1) pass('TalentProfile handler registered');
  else fail('TalentProfile handler registered');
}

// No controller-side timeline writes
{
  const controller = read('server/src/controllers/career/timelineController.js');
  const oppController = read('server/src/controllers/career/opportunityApplicationController.js');
  if (!controller.includes('appendFromCareerEvent') && !controller.includes('.create(')) {
    pass('timeline controller read-only');
  } else fail('timeline controller read-only');
  if (!oppController.includes('TimelineService') && !oppController.includes('appendFromCareerEvent')) {
    pass('application controller no timeline writes');
  } else fail('application controller no timeline writes');
}

// Pagination and filtering validation
{
  const parsed = parseTimelineQueryInput({ limit: '200', verb: 'application.created', cursor: 'abc' });
  if (parsed.limit === 100) pass('query limit cap');
  else fail('query limit cap');
  const errors = validateTimelineQueryInput({ verb: 'invalid.verb' });
  if (errors.length > 0) pass('invalid verb rejected');
  else fail('invalid verb rejected');

  const repo = read('server/src/repositories/career/TimelineEventRepository.js');
  if (repo.includes('nextCursor') && repo.includes('encodeCursor')) pass('cursor pagination');
  else fail('cursor pagination');
  if (repo.includes('verb') && repo.includes('objectType')) pass('filter fields in repository');
  else fail('filter fields in repository');
}

// Async handler via bridge (not sync in controller)
{
  const bridge = read('server/src/services/career/careerTimelineBridge.js');
  const handlers = read('server/src/services/career/careerEventHandlers.js');
  if (bridge.includes('handleCareerEventForTimeline') && bridge.includes('enqueueCareerEventForTimeline')) {
    pass('async timeline handler');
  } else fail('async timeline handler');
  if (handlers.includes('subscribeCareerEvent') && handlers.includes('enqueueCareerEventForTimeline')) {
    pass('bus subscription wiring');
  } else fail('bus subscription wiring');
}

// Permissions + routes
{
  const routes = read('server/src/routes/timeline.js');
  if (routes.includes('requireAuth') && routes.includes('requireUserAuth') && routes.includes('requireTimelineEnabled')) {
    pass('timeline route auth + flag');
  } else fail('timeline route auth + flag');

  const service = read('server/src/services/career/TimelineService.js');
  if (service.includes('findByIdForUser') || service.includes('findByUserId')) pass('ownership checks in service');
  else fail('ownership checks in service');
}

// Feature flags
{
  const prev = process.env.TIMELINE_ENABLED;
  process.env.TIMELINE_ENABLED = '0';
  if (!isTimelineEnabled()) pass('TIMELINE_ENABLED off');
  else fail('TIMELINE_ENABLED off');
  process.env.TIMELINE_ENABLED = '1';
  if (isTimelineEnabled()) pass('TIMELINE_ENABLED on');
  else fail('TIMELINE_ENABLED on');
  process.env.TIMELINE_ENABLED = prev;

  const env = read('.env.template');
  if (env.includes('TIMELINE_ENABLED') && env.includes('VITE_TIMELINE_ENABLED')) pass('env template flags');
  else fail('env template flags');

  const clientFlags = read('client/src/config/careerFeatureFlags.js');
  if (clientFlags.includes('VITE_TIMELINE_ENABLED')) pass('client timeline flag');
  else fail('client timeline flag');
}

// Analytics integration
{
  const bridge = read('server/src/services/career/careerTimelineBridge.js');
  const service = read('server/src/services/career/TimelineService.js');
  if (bridge.includes('trackTimelineAnalyticsFromEvent') || service.includes('timeline_event_created')) {
    pass('timeline analytics hook');
  } else fail('timeline analytics hook');
}

// Localization (client)
{
  const i18n = read('client/src/i18n/config.js');
  if (i18n.includes("'timeline'") && exists('client/src/i18n/locales/en/timeline.json')) pass('timeline i18n namespace');
  else fail('timeline i18n namespace');

  const en = JSON.parse(read('client/src/i18n/locales/en/timeline.json'));
  if (TIMELINE_VERBS.every((v) => en.verbs?.[v])) pass('all verb labels localized');
  else fail('all verb labels localized');
}

// Client widget + API
{
  if (exists('client/src/services/timelineApi.js') && exists('client/src/components/timeline/ActivityFeed.jsx')) {
    pass('client timeline widget');
  } else fail('client timeline widget');

  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  if (detail.includes('ActivityFeed') && detail.includes('timelineApi') === false) {
    pass('ApplicationDetail uses ActivityFeed');
  } else if (detail.includes('ActivityFeed')) {
    pass('ApplicationDetail uses ActivityFeed');
  } else fail('ApplicationDetail uses ActivityFeed');

  const api = read('client/src/services/timelineApi.js');
  if (api.includes('/timeline') && !api.includes('.post(')) pass('timelineApi read-only');
  else fail('timelineApi read-only');
}

// Startup registration
{
  const index = read('server/src/index.js');
  if (index.includes('registerCareerTimelineHandlers') && index.includes('timelineRouter')) pass('server startup wiring');
  else fail('server startup wiring');
}

// Domain event emit still works with TimelineEventCreated
{
  resetCareerEventBus();
  resetCareerTimelineHandlerRegistration();
  registerCareerTimelineHandlers();
  const event = emitCareerEvent('TalentProfileCreated', { userId: 'u1' }, {
    aggregateId: 'tp1',
    actor: { type: 'talent', id: 'u1' },
  });
  if (event.eventType === 'TalentProfileCreated') pass('CareerEventBus emit after handler registration');
  else fail('CareerEventBus emit after handler registration');
}

console.log(`\nTimeline verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
console.log('PASS');
process.exit(0);
