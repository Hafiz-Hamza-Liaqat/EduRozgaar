/**
 * Process scheduled workflow publish/archive jobs (C.7.0.6).
 */
import { EditorialWorkflow } from '../../models/EditorialWorkflow.js';
import { publishNow, archiveContent } from './WorkflowService.js';
import { syncEntityPublishState } from './workflowEntitySync.js';
import { logAudit } from '../auditService.js';
import { onContentPublished } from '../../utils/contentIntegration.js';

export async function processScheduledWorkflowJob(payload) {
  const { entityType, entityId, action = 'publish' } = payload;
  const wf = await EditorialWorkflow.findOne({ entityType, entityId: String(entityId) });
  if (!wf) return { skipped: true, reason: 'no_workflow' };

  const systemActor = { userId: null, role: 'SuperAdmin', email: 'system@workflow' };

  if (action === 'archive') {
    if (wf.status !== 'published' && wf.status !== 'scheduled') {
      return { skipped: true, reason: 'not_publishable_state' };
    }
    await archiveContent(entityType, entityId, systemActor);
    return { archived: true };
  }

  if (wf.status !== 'scheduled' && wf.status !== 'approved') {
    return { skipped: true, reason: 'not_scheduled' };
  }

  await publishNow(entityType, entityId, systemActor, { force: true });
  await onContentPublished(entityType, entityId, systemActor).catch(() => {});
  return { published: true };
}

/** Poll workflows due for publish (fallback if queue missed). */
export async function processDueScheduledWorkflows() {
  const now = new Date();
  const due = await EditorialWorkflow.find({
    status: 'scheduled',
    scheduledPublishAt: { $lte: now },
  }).limit(50);

  let processed = 0;
  for (const wf of due) {
    try {
      await processScheduledWorkflowJob({
        entityType: wf.entityType,
        entityId: wf.entityId,
        action: 'publish',
      });
      processed += 1;
    } catch (err) {
      console.error('[workflow-scheduler]', wf.entityType, wf.entityId, err.message);
    }
  }

  const archiveDue = await EditorialWorkflow.find({
    scheduledArchiveAt: { $lte: now },
    status: { $in: ['published', 'scheduled'] },
  }).limit(50);

  for (const wf of archiveDue) {
    try {
      await syncEntityPublishState(wf.entityType, wf.entityId, 'archived');
      wf.status = 'archived';
      wf.archivedAt = new Date();
      wf.scheduledArchiveAt = undefined;
      await wf.save();
      await logAudit({
        actor: { role: 'SuperAdmin', email: 'system@workflow' },
        action: 'workflow_archived',
        targetType: wf.entityType,
        targetId: wf.entityId,
        metadata: { scheduled: true },
      });
      processed += 1;
    } catch (err) {
      console.error('[workflow-scheduler-archive]', err.message);
    }
  }

  return { processed };
}
