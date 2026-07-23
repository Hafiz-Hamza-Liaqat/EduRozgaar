import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { platformCacheInvalidateNamespace } from '../../config/cache.js';
import { enqueueJob } from '../jobQueueService.js';

const ANALYTICS_MAP = {
  ApplicationCreated: 'application_created',
  ApplicationUpdated: 'application_updated',
  StageChanged: 'application_stage_changed',
  ApplicationWithdrawn: 'application_withdrawn',
  NoteAdded: 'application_note_added',
  ReminderCreated: 'application_reminder_created',
  DocumentAttached: 'application_document_attached',
  OfferAccepted: 'application_offer_accepted',
  ApplicationArchived: 'application_archived',
};

/**
 * Cross-cutting reactions for OpportunityApplication events (C.8.0.3A).
 * Controllers MUST NOT call these directly.
 */
export function trackApplicationAnalyticsFromEvent(event, context = {}) {
  const eventType = ANALYTICS_MAP[event.eventType];
  if (!eventType) return;

  scheduleAnalyticsEvent(
    {
      eventType,
      entityType: 'opportunity-application',
      entityId: event.aggregateId,
      locale: event.locale || context.locale,
      metadata: {
        careerEventId: event.eventId,
        careerEventType: event.eventType,
        ...event.payload,
      },
    },
    { userId: context.userId || event.actor?.id }
  );

  invalidateApplicationCaches(context.userId || event.actor?.id, event.aggregateId);
}

function invalidateApplicationCaches(userId, applicationId) {
  if (userId) {
    void platformCacheInvalidateNamespace(`career:dashboard:${userId}`).catch(() => {});
    void platformCacheInvalidateNamespace(`career:applications:${userId}`).catch(() => {});
  }
  if (applicationId) {
    void platformCacheInvalidateNamespace(`career:application:${applicationId}`).catch(() => {});
  }
}

export function scheduleApplicationReminderJob(reminder, applicationId, userId) {
  if (!reminder?.remindAt || reminder.status !== 'scheduled') return;
  const delayMs = new Date(reminder.remindAt).getTime() - Date.now();
  if (delayMs <= 0) return;

  enqueueJob({
    type: 'application_reminder',
    payload: {
      applicationId: String(applicationId),
      userId: String(userId),
      reminderId: String(reminder._id),
      title: reminder.title,
    },
    scheduledAt: new Date(reminder.remindAt),
    dedupKey: `application_reminder:${applicationId}:${reminder._id}`,
  }).catch(() => {});
}
