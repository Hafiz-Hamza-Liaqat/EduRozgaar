/**
 * Editorial workflow notifications (C.7.0.6).
 */
import { notifyUser } from '../notificationService.js';
import { enqueueJob } from '../jobQueueService.js';
import { workflowResourceLabel } from '../../../../shared/workflow/resources.js';
import { workflowStateLabel } from '../../../../shared/workflow/states.js';

function buildLink(entityType, entityId) {
  const base = '/admin/review';
  return `${base}?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`;
}

async function sendInApp(userId, payload) {
  if (!userId) return null;
  return notifyUser(userId, {
    category: 'workflow',
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    metadata: payload.metadata,
  });
}

/** Email abstraction — queued for future delivery. */
async function queueEmail(userId, payload) {
  if (!userId || !payload.email) return null;
  return enqueueJob({
    type: 'notification',
    payload: {
      userId,
      recipientType: 'user',
      category: 'workflow',
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      metadata: { ...payload.metadata, emailChannel: true },
    },
    dedupKey: payload.dedupKey,
  });
}

export async function notifyReviewAssigned({ reviewerId, reviewerEmail, entityType, entityId, title, assignerEmail }) {
  const label = workflowResourceLabel(entityType);
  const payload = {
    type: 'workflow_assigned',
    title: `Review assigned: ${title || label}`,
    body: `${assignerEmail || 'An editor'} assigned you to review ${label} content.`,
    link: buildLink(entityType, entityId),
    metadata: { entityType, entityId },
    email: reviewerEmail,
    dedupKey: `wf-assign:${entityType}:${entityId}:${reviewerId}`,
  };
  await sendInApp(reviewerId, payload);
  await queueEmail(reviewerId, payload);
}

export async function notifyWorkflowStatus({ userId, email, entityType, entityId, title, status, reason }) {
  const label = workflowResourceLabel(entityType);
  const stateLabel = workflowStateLabel(status);
  const payload = {
    type: `workflow_${status}`,
    title: `${label}: ${stateLabel}`,
    body: reason ? `${title || 'Content'} — ${reason}` : `${title || 'Content'} is now ${stateLabel}.`,
    link: buildLink(entityType, entityId),
    metadata: { entityType, entityId, status },
    email,
    dedupKey: `wf-status:${entityType}:${entityId}:${status}:${userId}`,
  };
  await sendInApp(userId, payload);
  await queueEmail(userId, payload);
}

export async function notifyScheduledPublish({ userId, email, entityType, entityId, title, scheduledAt }) {
  const payload = {
    type: 'workflow_scheduled',
    title: `Scheduled: ${title || workflowResourceLabel(entityType)}`,
    body: `Publishing scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
    link: buildLink(entityType, entityId),
    metadata: { entityType, entityId, scheduledAt },
    email,
    dedupKey: `wf-schedule:${entityType}:${entityId}:${scheduledAt}`,
  };
  await sendInApp(userId, payload);
  await queueEmail(userId, payload);
}

export async function notifyPublishCompleted({ userId, email, entityType, entityId, title }) {
  const payload = {
    type: 'workflow_published',
    title: `Published: ${title || workflowResourceLabel(entityType)}`,
    body: 'Your content is now live.',
    link: buildLink(entityType, entityId),
    metadata: { entityType, entityId },
    email,
    dedupKey: `wf-published:${entityType}:${entityId}`,
  };
  await sendInApp(userId, payload);
  await queueEmail(userId, payload);
}
