/**
 * Cross-cutting reactions for Employer Intelligence events (C.8.5).
 * Controllers MUST NOT call Analytics / Search cache / Notifications directly.
 */
import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { platformCacheInvalidateNamespace } from '../../config/cache.js';
import { searchCacheInvalidatePrefix } from '../search/searchCache.js';

const ANALYTICS_MAP = {
  CandidateViewed: 'employer_candidate_viewed',
  CandidateShortlisted: 'employer_candidate_shortlisted',
  InterviewScheduled: 'employer_interview_scheduled',
  InterviewCompleted: 'employer_interview_completed',
  OfferSent: 'employer_offer_sent',
  OfferAccepted: 'employer_offer_accepted',
  OfferRejected: 'employer_offer_rejected',
  CandidateRejected: 'employer_candidate_rejected',
  CandidateHired: 'employer_candidate_hired',
  HiringNoteAdded: 'employer_hiring_note_added',
};

export function trackEmployerAnalyticsFromEvent(event, context = {}) {
  const eventType = ANALYTICS_MAP[event.eventType];
  if (!eventType) return;

  scheduleAnalyticsEvent(
    {
      eventType,
      entityType: 'employer-hiring',
      entityId: event.aggregateId,
      locale: event.locale || context.locale,
      metadata: {
        careerEventId: event.eventId,
        careerEventType: event.eventType,
        employerId: context.employerId || null,
        ...event.payload,
      },
    },
    { userId: context.userId || event.payload?.candidateUserId }
  );

  invalidateEmployerCaches(context.employerId, context.userId, event.aggregateId);
}

function invalidateEmployerCaches(employerId, candidateUserId, applicationId) {
  if (employerId) {
    void platformCacheInvalidateNamespace(`employer:dashboard:${employerId}`).catch(() => {});
    void platformCacheInvalidateNamespace(`employer:intelligence:${employerId}`).catch(() => {});
  }
  if (candidateUserId) {
    void platformCacheInvalidateNamespace(`career:dashboard:${candidateUserId}`).catch(() => {});
  }
  if (applicationId) {
    void platformCacheInvalidateNamespace(`career:application:${applicationId}`).catch(() => {});
  }
  void searchCacheInvalidatePrefix('employer').catch(() => {});
  void searchCacheInvalidatePrefix('candidates').catch(() => {});
}
