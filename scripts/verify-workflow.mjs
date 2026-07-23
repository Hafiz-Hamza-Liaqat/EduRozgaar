#!/usr/bin/env node
/**
 * Workflow, Permissions & Editorial Approvals verification (C.7.0.6)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WORKFLOW_STATES, canTransitionWorkflow } from '../shared/workflow/states.js';
import { WORKFLOW_RESOURCES, WORKFLOW_ACTIONS } from '../shared/workflow/resources.js';
import {
  WORKFLOW_PERMISSIONS,
  resolveRequiredPermissions,
  canPerformWorkflowAction,
  buildPermissionMatrix,
} from '../shared/workflow/permissions.js';
import { validateWorkflowTransition } from '../shared/workflow/validation.js';
import {
  getPermissionsForRoles,
  canPerformAction,
} from '../server/src/services/workflow/PermissionService.js';
import * as WorkflowService from '../server/src/services/workflow/WorkflowService.js';
import * as ContentLockService from '../server/src/services/workflow/ContentLockService.js';
import { CONTENT_LOCK_TTL_MS } from '../server/src/models/ContentLock.js';
import { processScheduledWorkflowJob } from '../server/src/services/workflow/workflowSchedulerService.js';
import { ADMIN_RESOURCE_WORKFLOW_MAP } from '../server/src/services/workflow/workflowIntegration.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// States & transitions
{
  if (WORKFLOW_STATES.length === 7) pass('seven workflow states');
  else fail('seven workflow states', String(WORKFLOW_STATES.length));
  if (canTransitionWorkflow('draft', 'in_review')) pass('draft → in_review');
  else fail('draft → in_review');
  if (!canTransitionWorkflow('published', 'in_review')) pass('published ↛ in_review');
  else fail('published ↛ in_review');
  if (canTransitionWorkflow('scheduled', 'published')) pass('scheduled → published');
  else fail('scheduled → published');
}

// Resources & actions
{
  if (WORKFLOW_RESOURCES.includes('blogs') && WORKFLOW_RESOURCES.includes('page-builder')) {
    pass('workflow resources');
  } else fail('workflow resources');
  if (WORKFLOW_ACTIONS.includes('approve') && WORKFLOW_ACTIONS.includes('schedule')) {
    pass('workflow actions');
  } else fail('workflow actions');
}

// Permission matrix
{
  const matrix = buildPermissionMatrix();
  if (matrix.jobs?.edit?.includes('content:jobs')) pass('jobs edit permission');
  else fail('jobs edit permission');
  if (matrix.jobs?.approve?.includes('moderate:jobs')) pass('jobs approve maps moderate');
  else fail('jobs approve maps moderate');
  const modPerms = getPermissionsForRoles(['Moderator']);
  if (modPerms.includes('workflow:approve')) pass('moderator workflow approve');
  else fail('moderator workflow approve');
  if (canPerformWorkflowAction(modPerms, 'blogs', 'review')) pass('moderator can review blogs');
  else fail('moderator can review blogs');
}

// Validation
{
  if (!validateWorkflowTransition({ from: 'draft', to: 'in_review', resource: 'blogs' }).length) {
    pass('valid transition validation');
  } else fail('valid transition validation');
  if (validateWorkflowTransition({ from: 'draft', to: 'published', resource: 'blogs' }).length === 0) {
    pass('draft → published allowed');
  } else fail('draft → published');
  if (validateWorkflowTransition({ from: 'published', to: 'in_review' }).length) {
    pass('invalid transition rejected');
  } else fail('invalid transition rejected');
}

// Models
{
  for (const f of [
    'server/src/models/EditorialWorkflow.js',
    'server/src/models/ContentLock.js',
    'server/src/models/EditorialComment.js',
    'server/src/models/UserRoleAssignment.js',
  ]) {
    if (exists(f)) pass(`model ${f.split('/').pop()}`);
    else fail(`model ${f.split('/').pop()}`);
  }
}

// Services
{
  const svcChecks = [
    ['WorkflowService.getReviewQueue', typeof WorkflowService.getReviewQueue === 'function'],
    ['WorkflowService.bulkApprove', typeof WorkflowService.bulkApprove === 'function'],
    ['WorkflowService.schedulePublish', typeof WorkflowService.schedulePublish === 'function'],
    ['WorkflowService.addComment', typeof WorkflowService.addComment === 'function'],
    ['ContentLockService.acquireContentLock', typeof ContentLockService.acquireContentLock === 'function'],
    ['ContentLockService.releaseStaleLocks', typeof ContentLockService.releaseStaleLocks === 'function'],
    ['processScheduledWorkflowJob', typeof processScheduledWorkflowJob === 'function'],
  ];
  for (const [name, ok] of svcChecks) {
    if (ok) pass(name);
    else fail(name);
  }
  if (CONTENT_LOCK_TTL_MS >= 600000) pass('lock TTL >= 10 min');
  else fail('lock TTL');
}

// API routes & controller
{
  const adminRoutes = read('server/src/routes/admin.js');
  if (adminRoutes.includes('/review') && adminRoutes.includes('/workflow/dashboard')) pass('admin workflow routes');
  else fail('admin workflow routes');
  if (exists('server/src/controllers/admin/editorialWorkflowController.js')) pass('editorialWorkflowController');
  else fail('editorialWorkflowController');
}

// Integrations
{
  if (ADMIN_RESOURCE_WORKFLOW_MAP.jobs === 'jobs') pass('integration map');
  else fail('integration map');
  const blogsCtrl = read('server/src/controllers/admin/adminBlogsController.js');
  if (blogsCtrl.includes('syncWorkflowAfterSave') || blogsCtrl.includes('onContentSaved')) pass('blogs workflow hook');
  else fail('blogs workflow hook');
  const jobsCtrl = read('server/src/controllers/admin/adminJobsController.js');
  if (jobsCtrl.includes('syncWorkflowAfterSave') || jobsCtrl.includes('onContentSaved')) pass('jobs workflow hook');
  else fail('jobs workflow hook');
}

// Job queue scheduled_publish
{
  const jq = read('server/src/services/jobQueueService.js');
  if (jq.includes("case 'scheduled_publish'")) pass('scheduled_publish job type');
  else fail('scheduled_publish job type');
}

// Client UI
{
  if (exists('client/src/pages/Admin/AdminReviewQueue.jsx')) pass('AdminReviewQueue page');
  else fail('AdminReviewQueue page');
  const routes = read('client/src/routes/index.jsx');
  if (routes.includes("path: 'review'")) pass('review route');
  else fail('review route');
  const nav = read('client/src/config/adminNavConfig.js');
  if (nav.includes('/review')) pass('review nav');
  else fail('review nav');
  if (exists('client/src/components/admin/workflow/ContentLockBanner.jsx')) pass('ContentLockBanner');
  else fail('ContentLockBanner');
}

// RBAC additive permissions
{
  const rbac = read('server/src/config/rbac.js');
  if (rbac.includes('WORKFLOW_VIEW') && rbac.includes('workflow:view')) pass('rbac workflow permissions');
  else fail('rbac workflow permissions');
}

// Audit actions documented in service
{
  const wf = read('server/src/services/workflow/WorkflowService.js');
  const auditActions = ['workflow_assign_reviewer', 'workflow_comment', 'workflow_schedule'];
  const missing = auditActions.filter((a) => !wf.includes(a));
  if (!missing.length) pass('workflow audit actions');
  else fail('workflow audit actions', missing.join(', '));
}

// Notifications
{
  if (exists('server/src/services/workflow/EditorialNotificationService.js')) pass('EditorialNotificationService');
  else fail('EditorialNotificationService');
}

// Permission service async API
{
  const editorPerms = getPermissionsForRoles(['Editor']);
  if (editorPerms.includes('content:blogs') && resolveRequiredPermissions('blogs', 'edit').length) {
    pass('PermissionService role flatten');
  } else fail('PermissionService role flatten');
}

console.log(`\nWorkflow verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log('All workflow checks passed.');
