import { asyncHandler } from '../../utils/asyncHandler.js';
import { auditFromRequest, logAudit } from '../../services/auditService.js';
import * as WorkflowService from '../../services/workflow/WorkflowService.js';
import * as ContentLockService from '../../services/workflow/ContentLockService.js';
import {
  getEffectivePermissions,
  canPerformAction,
  assignAdditionalRoles,
} from '../../services/workflow/PermissionService.js';
import { buildPermissionMatrix } from '../../../../shared/workflow/permissions.js';
import { WORKFLOW_RESOURCES } from '../../../../shared/workflow/resources.js';
import { WORKFLOW_STATES } from '../../../../shared/workflow/states.js';

function reqActor(req) {
  return {
    userId: req.user?.userId,
    role: req.user?.role,
    email: req.user?.email,
    name: req.user?.name,
    permissions: req.userPermissions,
  };
}

export const getPermissionModel = asyncHandler(async (req, res) => {
  res.json({
    resources: WORKFLOW_RESOURCES,
    states: WORKFLOW_STATES,
    matrix: buildPermissionMatrix(),
    effectivePermissions: await getEffectivePermissions(req.user?.userId, req.user?.role),
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await WorkflowService.getWorkflowDashboard();
  res.json(stats);
});

export const getReviewQueue = asyncHandler(async (req, res) => {
  const { tab, page, limit } = req.query;
  const data = await WorkflowService.getReviewQueue({
    tab: tab || 'awaiting',
    userId: req.user?.userId,
    page: Number(page) || 1,
    limit: Math.min(Number(limit) || 25, 100),
  });
  res.json(data);
});

export const getWorkflow = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.getOrCreateWorkflow(entityType, entityId);
  const lock = await ContentLockService.getContentLock(entityType, entityId);
  const comments = await WorkflowService.listComments(entityType, entityId);
  res.json({ workflow: wf, lock, comments });
});

export const submitForReview = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.submitForReview(entityType, entityId, reqActor(req), req.body);
  res.json({ workflow: wf });
});

export const assignReviewer = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { reviewerId } = req.body;
  const wf = await WorkflowService.assignReviewer(entityType, entityId, reviewerId, reqActor(req));
  res.json({ workflow: wf });
});

export const approve = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.approveContent(entityType, entityId, reqActor(req), req.body);
  res.json({ workflow: wf });
});

export const reject = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.rejectContent(entityType, entityId, reqActor(req), req.body.reason);
  res.json({ workflow: wf });
});

export const requestChanges = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.requestChanges(entityType, entityId, reqActor(req), req.body.reason);
  res.json({ workflow: wf });
});

export const schedule = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.schedulePublish(entityType, entityId, reqActor(req), req.body);
  res.json({ workflow: wf });
});

export const publish = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.publishNow(entityType, entityId, reqActor(req), req.body);
  res.json({ workflow: wf });
});

export const archive = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const wf = await WorkflowService.archiveContent(entityType, entityId, reqActor(req));
  res.json({ workflow: wf });
});

export const bulkApprove = asyncHandler(async (req, res) => {
  const results = await WorkflowService.bulkApprove(req.body.items || [], reqActor(req));
  res.json({ results });
});

export const bulkReject = asyncHandler(async (req, res) => {
  const results = await WorkflowService.bulkReject(req.body.items || [], reqActor(req), req.body.reason);
  res.json({ results });
});

export const bulkAssign = asyncHandler(async (req, res) => {
  const results = await WorkflowService.bulkAssign(req.body.items || [], req.body.reviewerId, reqActor(req));
  res.json({ results });
});

export const listComments = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const comments = await WorkflowService.listComments(entityType, entityId, req.query);
  res.json({ comments });
});

export const addComment = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const comment = await WorkflowService.addComment(entityType, entityId, reqActor(req), req.body.body, req.body);
  res.json({ comment });
});

export const resolveComment = asyncHandler(async (req, res) => {
  const comment = await WorkflowService.resolveComment(req.params.commentId, reqActor(req), req.body.resolved !== false);
  res.json({ comment });
});

export const acquireLock = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const result = await ContentLockService.acquireContentLock(entityType, entityId, reqActor(req), {
    force: req.body.force === true,
  });
  res.json(result);
});

export const releaseLock = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const result = await ContentLockService.releaseContentLock(entityType, entityId, reqActor(req));
  res.json(result);
});

export const getLock = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const lock = await ContentLockService.getContentLock(entityType, entityId);
  res.json({ lock });
});

export const assignUserRoles = asyncHandler(async (req, res) => {
  const doc = await assignAdditionalRoles(req.params.userId, req.body.roles || []);
  await logAudit({
    ...auditFromRequest(req),
    action: 'workflow_role_assign',
    targetType: 'user',
    targetId: req.params.userId,
    after: { roles: doc.roles },
  });
  res.json({ assignment: doc });
});

export const checkPermission = asyncHandler(async (req, res) => {
  const { resource, action } = req.query;
  const allowed = await canPerformAction(reqActor(req), resource, action);
  res.json({ allowed, resource, action });
});
