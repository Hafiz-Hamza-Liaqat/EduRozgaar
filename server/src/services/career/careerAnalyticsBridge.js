import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { onCareerEntitySaved } from '../../utils/contentIntegration.js';

const ANALYTICS_MAP = {
  TalentProfileCreated: 'profile_created',
  TalentProfileUpdated: 'profile_updated',
  ResumeVersionCreated: 'resume_version_created',
  ResumePublished: 'resume_published',
};

/**
 * Minimal analytics bridge for career domain events (C.8.0.2A).
 * Full handler registry arrives in later sprints.
 */
export function trackCareerAnalyticsFromEvent(event, context = {}) {
  const eventType = ANALYTICS_MAP[event.eventType];
  if (!eventType) return;

  scheduleAnalyticsEvent(
    {
      eventType,
      entityType: event.aggregateType?.toLowerCase(),
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
}

export function indexCareerEntityFromEvent(event) {
  if (event.eventType === 'TalentProfileUpdated' || event.eventType === 'TalentProfileCreated') {
    if (event.payload?.visibility === 'public' || event.payload?.visibility === undefined) {
      onCareerEntitySaved('talent-profile', event.aggregateId, { locale: event.locale });
    }
  }
}
