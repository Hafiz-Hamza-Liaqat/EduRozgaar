import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { platformCacheInvalidateNamespace } from '../../config/cache.js';
import { mapCareerEventToTimelineInput } from '../../../../shared/career/timelineEventMap.js';
import { TimelineService } from './TimelineService.js';
import { OpportunityApplicationRepository } from '../../repositories/career/OpportunityApplicationRepository.js';
import { isTimelineEnabled } from '../../config/careerFeatureFlags.js';

const APPLICATION_VERBS = new Set([
  'application.created',
  'application.updated',
  'application.stage_changed',
  'application.withdrawn',
  'application.archived',
  'application.note_added',
  'application.reminder_created',
  'application.document_attached',
  'offer.accepted',
]);

/**
 * Timeline reactions for career domain events (C.8.0.4).
 * Controllers MUST NOT call these directly.
 */
export function trackTimelineAnalyticsFromEvent(event, context = {}) {
  scheduleAnalyticsEvent(
    {
      eventType: 'timeline_event_created',
      entityType: 'timeline-event',
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

  const userId = context.userId || event.payload?.subjectTalentProfileId;
  if (userId) {
    void platformCacheInvalidateNamespace(`career:timeline:${userId}`).catch(() => {});
  }
}

async function pushApplicationActivityReference(timelineEvent, input) {
  const applicationId = input.metadata?.applicationId
    || (input.objectType === 'application' ? input.objectId : null);
  if (!applicationId) return;

  await OpportunityApplicationRepository.pushActivityReference(applicationId, {
    activityType: input.verb,
    referenceId: String(timelineEvent._id),
    summary: '',
    occurredAt: timelineEvent.occurredAt,
    metadata: {
      verb: input.verb,
      careerEventId: input.careerEventId,
      ...input.metadata,
    },
  });
}

/**
 * Async handler invoked from CareerEventBus subscribers.
 */
export async function handleCareerEventForTimeline(careerEvent) {
  if (!isTimelineEnabled()) return null;

  const input = mapCareerEventToTimelineInput(careerEvent);
  if (!input) return null;

  const timelineEvent = await TimelineService.appendFromCareerEvent(input);
  if (!timelineEvent) return null;

  if (APPLICATION_VERBS.has(input.verb) || input.metadata?.applicationId) {
    await pushApplicationActivityReference(timelineEvent, input).catch(() => {});
  }

  return timelineEvent;
}

export function enqueueCareerEventForTimeline(careerEvent) {
  void handleCareerEventForTimeline(careerEvent).catch(() => {});
}
