import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { platformCacheInvalidateNamespace } from '../../config/cache.js';
import { onCareerEntitySaved } from '../../utils/contentIntegration.js';

const ANALYTICS_MAP = {
  DocumentCreated: 'document_uploaded',
  DocumentUpdated: 'document_updated',
  DocumentVersionCreated: 'document_version_created',
  DocumentArchived: 'document_archived',
  CredentialIssued: 'credential_issued',
  CredentialVerified: 'credential_verified',
  CredentialRevoked: 'credential_revoked',
};

/**
 * Cross-cutting reactions for Document & Credential events (C.8.0.5).
 * Controllers MUST NOT call these directly.
 */
export function trackDocumentPlatformFromEvent(event, context = {}) {
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

  const userId = context.userId || event.actor?.id;
  if (userId) {
    void platformCacheInvalidateNamespace(`career:documents:${userId}`).catch(() => {});
    void platformCacheInvalidateNamespace(`career:credentials:${userId}`).catch(() => {});
  }

  if (event.eventType === 'CredentialVerified') {
    onCareerEntitySaved('credential', event.aggregateId, { locale: event.locale });
  }
}
