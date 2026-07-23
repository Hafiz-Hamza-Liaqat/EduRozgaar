#!/usr/bin/env node
/**
 * Job Application Tracker MVP verification (C.8.1).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PIPELINE_STAGES, CAREER_DOMAIN_EVENTS } from '../shared/career/constants.js';
import {
  canTransition,
  getAllowedTransitions,
  assertValidTransition,
  resolveStageTemplateId,
} from '../shared/career/applicationStageMachine.js';
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

// --- State machine enforcement (13 stages, no parallel status logic) ---
{
  if (PIPELINE_STAGES.length === 13) pass('13-stage pipeline');
  else fail('13-stage pipeline', `got ${PIPELINE_STAGES.length}`);

  const jobTemplate = resolveStageTemplateId('job');
  if (canTransition(jobTemplate, 'interested', 'preparing')) pass('allowed transition interested→preparing');
  else fail('allowed transition interested→preparing');

  if (!canTransition(jobTemplate, 'interested', 'joined')) pass('illegal join jump blocked');
  else fail('illegal join jump blocked');

  try {
    assertValidTransition(jobTemplate, 'applied', 'viewed');
    pass('assertValidTransition applied→viewed');
  } catch (e) {
    fail('assertValidTransition applied→viewed', e.message);
  }

  try {
    assertValidTransition(jobTemplate, 'applied', 'joined');
    fail('assertValidTransition should reject applied→joined');
  } catch {
    pass('assertValidTransition rejects applied→joined');
  }

  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('assertValidTransition') || svc.includes('ApplicationStageMachineService')) {
    pass('service uses stage machine');
  } else fail('service uses stage machine');

  const kanban = read('client/src/components/applications/ApplicationKanbanBoard.jsx');
  const stageCtrl = read('client/src/components/applications/StageTransitionControl.jsx');
  const detailPage = read('client/src/pages/Applications/ApplicationDetail.jsx');
  if (
    kanban.includes('getAllowedTransitions')
    && stageCtrl.includes('allowedTransitions')
    && detailPage.includes('allowedTransitions')
  ) {
    pass('UI uses stage-machine allowedTransitions');
  } else fail('UI uses stage-machine allowedTransitions');
  if (!kanban.includes('legacyStatus') && !detailPage.includes('pipelineStatus')) {
    pass('no parallel status logic in tracker UI');
  } else fail('no parallel status logic in tracker UI');
}

// --- Tracker UI: Kanban / Table / Calendar placeholder / filters ---
{
  for (const f of [
    'client/src/components/applications/ApplicationKanbanBoard.jsx',
    'client/src/components/applications/ApplicationTable.jsx',
    'client/src/components/applications/ApplicationMetricsStrip.jsx',
    'client/src/components/applications/StageTransitionControl.jsx',
    'client/src/components/applications/NoteComposer.jsx',
    'client/src/components/applications/ReminderForm.jsx',
    'client/src/components/applications/DocumentAttachPanel.jsx',
    'client/src/components/applications/ContactsPanel.jsx',
    'client/src/components/applications/InterviewPanel.jsx',
  ]) {
    if (exists(f)) pass(`component ${f.split('/').pop()}`);
    else fail(`component ${f.split('/').pop()}`);
  }

  const list = read('client/src/pages/Applications/MyApplications.jsx');
  if (list.includes('ApplicationKanbanBoard') && list.includes('ApplicationTable')) pass('kanban + table views');
  else fail('kanban + table views');
  if (list.includes('calendar') && list.includes('calendarPlaceholder')) pass('calendar placeholder');
  else fail('calendar placeholder');
  if (list.includes('stageFilter') && list.includes('search') && list.includes('sortId')) pass('filters search sorting');
  else fail('filters search sorting');
  if (list.includes('ApplicationMetricsStrip') && list.includes('getMetrics')) pass('list metrics strip');
  else fail('list metrics strip');
}

// --- Application detail enhancements ---
{
  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  for (const name of [
    'StageTransitionControl',
    'NoteComposer',
    'ReminderForm',
    'DocumentAttachPanel',
    'ContactsPanel',
    'InterviewPanel',
    'ActivityFeed',
    'StageTimeline',
  ]) {
    if (detail.includes(name)) pass(`detail ${name}`);
    else fail(`detail ${name}`);
  }
  if (detail.includes('transitionStage') && detail.includes('addNote') && detail.includes('addReminder')) {
    pass('detail mutation APIs');
  } else fail('detail mutation APIs');
}

// --- Contacts + interview model + API ---
{
  if (exists('server/src/models/career/ApplicationContact.js')) pass('ApplicationContact model');
  else fail('ApplicationContact model');

  const model = read('server/src/models/career/OpportunityApplication.js');
  if (model.includes('contacts') && model.includes('interview')) pass('OA contacts + interview fields');
  else fail('OA contacts + interview fields');

  const routes = read('server/src/routes/opportunityApplications.js');
  if (routes.includes('/contacts') && routes.includes('/interview') && routes.includes('/metrics')) {
    pass('contacts interview metrics routes');
  } else fail('contacts interview metrics routes');

  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('addContact') && svc.includes('upsertInterview') && svc.includes('addReminder')) {
    pass('service contact interview reminder');
  } else fail('service contact interview reminder');

  const api = read('client/src/services/applicationsApi.js');
  if (api.includes('getMetrics') && api.includes('addContact') && api.includes('upsertInterview')) {
    pass('applicationsApi tracker methods');
  } else fail('applicationsApi tracker methods');
}

// --- Timeline event mapping ---
{
  const handled = listTimelineHandledCareerEvents();
  for (const ev of ['StageChanged', 'ReminderCreated', 'DocumentAttached', 'ContactAdded', 'InterviewScheduled']) {
    if (handled.includes(ev) || read('shared/career/timelineEventMap.js').includes(`${ev}:`)) {
      pass(`timeline maps ${ev}`);
    } else fail(`timeline maps ${ev}`);
  }
  for (const ev of ['ContactAdded', 'InterviewScheduled']) {
    if (CAREER_DOMAIN_EVENTS.includes(ev)) pass(`domain event ${ev}`);
    else fail(`domain event ${ev}`);
  }
}

// --- Notifications (CareerEventBus → notifyUser) ---
{
  const bridge = read('server/src/services/career/careerNotificationBridge.js');
  if (bridge.includes('registerCareerNotificationHandlers') && bridge.includes('notifyUser')) {
    pass('notification bridge');
  } else fail('notification bridge');
  for (const ev of ['StageChanged', 'InterviewScheduled', 'ReminderCreated', 'OfferAccepted']) {
    if (bridge.includes(`'${ev}'`)) pass(`notify on ${ev}`);
    else fail(`notify on ${ev}`);
  }
  const index = read('server/src/index.js');
  if (index.includes('registerCareerNotificationHandlers')) pass('notification handlers registered at boot');
  else fail('notification handlers registered at boot');

  const queue = read('server/src/services/jobQueueService.js');
  if (queue.includes('application_reminder')) pass('reminder job type');
  else fail('reminder job type');
}

// --- Metrics ---
{
  if (exists('server/src/services/career/ApplicationMetricsService.js')) pass('ApplicationMetricsService');
  else fail('ApplicationMetricsService');
  const metrics = read('server/src/services/career/ApplicationMetricsService.js');
  for (const key of ['active', 'interviewsScheduled', 'offersReceived', 'responseRate', 'completionRate']) {
    if (metrics.includes(key)) pass(`metric ${key}`);
    else fail(`metric ${key}`);
  }
  const dash = read('server/src/services/career/DashboardCompositionService.js');
  if (dash.includes('ApplicationMetricsService')) pass('dashboard composition metrics');
  else fail('dashboard composition metrics');
}

// --- Dashboard widget integration ---
{
  const widget = read('client/src/dashboard/widgets/ApplicationsSummaryWidget.jsx');
  if (widget.includes('trackerActive') && widget.includes('openTracker') && widget.includes('trackNew')) {
    pass('dashboard tracker widget CTAs');
  } else fail('dashboard tracker widget CTAs');
  if (widget.includes('metrics.interviewsScheduled') || widget.includes('interviewsScheduled')) {
    pass('dashboard metrics tiles');
  } else fail('dashboard metrics tiles');
  if (!widget.includes('applicationsApi') && !widget.includes('talentApi')) {
    pass('widget uses composition data only');
  } else fail('widget uses composition data only');
}

// --- TalentProfile / Documents ---
{
  const attach = read('client/src/components/applications/DocumentAttachPanel.jsx');
  if (attach.includes('DocumentPicker') || attach.includes('talentApi') || attach.includes('attachDocument')) {
    pass('document attach + TalentProfile');
  } else fail('document attach + TalentProfile');
  const svc = read('server/src/services/career/OpportunityApplicationService.js');
  if (svc.includes('attachDocument') || svc.includes('DocumentAttached')) pass('document attachment service');
  else fail('document attachment service');
}

// --- Localization ---
{
  const en = JSON.parse(read('client/src/i18n/locales/en/applications.json'));
  const ur = JSON.parse(read('client/src/i18n/locales/ur/applications.json'));
  if (PIPELINE_STAGES.every((s) => en.stages?.[s] && ur.stages?.[s])) pass('all stage labels en/ur');
  else fail('all stage labels en/ur');
  for (const key of ['views', 'metrics', 'tracker', 'contactRoles', 'interviewModes']) {
    if (en[key] && ur[key]) pass(`i18n ${key}`);
    else fail(`i18n ${key}`);
  }
  const enDash = read('client/src/i18n/locales/en/dashboard.json');
  const urDash = read('client/src/i18n/locales/ur/dashboard.json');
  if (enDash.includes('trackerActive') && urDash.includes('trackerActive') && urDash.includes('openTracker')) {
    pass('dashboard tracker i18n');
  } else fail('dashboard tracker i18n');
  const enTl = read('client/src/i18n/locales/en/timeline.json');
  const urTl = read('client/src/i18n/locales/ur/timeline.json');
  if (enTl.includes('contact_added') && urTl.includes('contact_added') && urTl.includes('interview_scheduled')) {
    pass('timeline contact/interview i18n');
  } else fail('timeline contact/interview i18n');
}

// --- Permissions + feature flags ---
{
  const routes = read('server/src/routes/opportunityApplications.js');
  if (routes.includes('requireAuth') && routes.includes('requireUserAuth') && routes.includes('requireOpportunityApplicationEnabled')) {
    pass('application route permissions');
  } else fail('application route permissions');
  const list = read('client/src/pages/Applications/MyApplications.jsx');
  if (list.includes('isOpportunityApplicationEnabled')) pass('client feature flag gate');
  else fail('client feature flag gate');
}

// --- Responsive UI ---
{
  const list = read('client/src/pages/Applications/MyApplications.jsx');
  const detail = read('client/src/pages/Applications/ApplicationDetail.jsx');
  if (list.includes('sm:flex-row') || list.includes('flex-col') || list.includes('overflow-x-auto')) {
    pass('responsive list/kanban');
  } else fail('responsive list/kanban');
  if (detail.includes('lg:grid') || detail.includes('grid-cols') || detail.includes('sm:')) {
    pass('responsive detail');
  } else fail('responsive detail');
  if (list.includes('min-h-[44px]') || detail.includes('min-h-[44px]')) pass('touch targets');
  else fail('touch targets');
}

// --- Documentation ---
{
  if (exists('docs/SPRINT_C8_1_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// --- Sub-suites + client build ---
{
  const oa = runNpm('verify:opportunity-application');
  if (oa.ok) pass('verify:opportunity-application sub-suite');
  else fail('verify:opportunity-application sub-suite', oa.out.slice(-500));

  const ui = runNpm('verify:application-ui');
  if (ui.ok) pass('verify:application-ui sub-suite');
  else fail('verify:application-ui sub-suite', ui.out.slice(-500));

  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nverify:application-tracker — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All application tracker checks passed.');
process.exit(0);
