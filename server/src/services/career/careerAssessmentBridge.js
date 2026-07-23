/**
 * Assessment → analytics via CareerEventBus (C.8.4).
 */
import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';

const ANALYTICS_MAP = {
  AssessmentStarted: 'assessment_started',
  AssessmentCompleted: 'assessment_completed',
  AssessmentPassed: 'assessment_passed',
  AssessmentFailed: 'assessment_failed',
};

export function trackAssessmentAnalytics(event) {
  const eventType = ANALYTICS_MAP[event.eventType];
  if (!eventType) return;
  try {
    scheduleAnalyticsEvent(
      {
        eventType,
        entityType: 'assessment',
        entityId: event.payload?.assessmentId || event.aggregateId,
        locale: event.locale,
        metadata: {
          careerEventId: event.eventId,
          careerEventType: event.eventType,
          attemptId: event.payload?.attemptId,
          score: event.payload?.score,
          passed: event.payload?.passed,
          credentialId: event.payload?.credentialId,
          slug: event.payload?.assessmentSlug || event.payload?.slug,
        },
      },
      { userId: event.payload?.userId || event.actor?.id }
    );
  } catch {
    /* fail-open */
  }
}
