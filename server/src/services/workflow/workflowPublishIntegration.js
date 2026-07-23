/**
 * Workflow sync on direct publish paths (C.7.0.7.1).
 */
import { EditorialWorkflow } from '../../models/EditorialWorkflow.js';
import { ensureEditorialWorkflow } from './workflowIntegration.js';
import { logAudit } from '../auditService.js';

/**
 * Sync editorial workflow overlay to published when content is published directly.
 * Additive — does not block legacy publish paths.
 */
export async function syncWorkflowPublished(entityType, entityId, actor, options = {}) {
  if (!entityType || !entityId) return null;

  let wf = await EditorialWorkflow.findOne({ entityType, entityId: String(entityId) });
  if (!wf) {
    wf = await ensureEditorialWorkflow(entityType, String(entityId), {
      title: options.title,
      status: 'published',
    });
    return wf;
  }

  if (wf.status !== 'published') {
    const before = wf.status;
    wf.status = 'published';
    wf.publishedAt = wf.publishedAt || new Date();
    wf.lastActionAt = new Date();
    wf.lastActionBy = actor?.userId || actor?._id;
    wf.lastActionByEmail = actor?.email || '';
    if (options.title) wf.title = options.title;
    await wf.save();

    await logAudit({
      actor: actor || { email: 'system' },
      action: 'workflow_published',
      targetType: entityType,
      targetId: String(entityId),
      targetLabel: wf.title,
      before: { status: before },
      after: { status: 'published' },
      metadata: { directPublish: true },
    });
  }

  return wf;
}
