import { TimelineEventRepository } from '../../repositories/career/TimelineEventRepository.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { OpportunityApplicationRepository } from '../../repositories/career/OpportunityApplicationRepository.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { isTimelineEnabled } from '../../config/careerFeatureFlags.js';
import { defaultVisibilityForVerb } from '../../../../shared/career/timelineVerbs.js';
import {
  parseTimelineQueryInput,
  validateTimelineQueryInput,
} from '../../../../shared/career/validation.js';
import { scheduleAnalyticsEvent } from '../analytics/AnalyticsEventService.js';
import { platformCacheInvalidateNamespace } from '../../config/cache.js';

function validationError(messages) {
  const err = new Error(messages.join('; '));
  err.status = 400;
  throw err;
}

async function resolveUserIdForProfile(subjectTalentProfileId, userIdHint) {
  if (userIdHint) return String(userIdHint);
  const profile = await TalentProfileRepository.findById(subjectTalentProfileId);
  return profile?.userId ? String(profile.userId) : null;
}

export const TimelineService = {
  async appendFromCareerEvent(input) {
    if (!isTimelineEnabled()) return null;
    if (!input?.careerEventId || !input?.subjectTalentProfileId || !input?.verb) return null;

    const existing = await TimelineEventRepository.findByCareerEventId(input.careerEventId);
    if (existing) return existing;

    const userId = await resolveUserIdForProfile(input.subjectTalentProfileId, input.userId);
    if (!userId) return null;

    const doc = await TimelineEventRepository.create({
      subjectTalentProfileId: input.subjectTalentProfileId,
      userId,
      actorType: input.actorType || 'system',
      actorId: input.actorId ?? null,
      verb: input.verb,
      objectType: input.objectType,
      objectId: input.objectId || '',
      metadata: input.metadata || {},
      visibility: input.visibility || defaultVisibilityForVerb(input.verb),
      occurredAt: input.occurredAt || new Date(),
      locale: input.locale || 'en',
      careerEventId: input.careerEventId,
      careerEventType: input.careerEventType || '',
    });

    const plain = doc.toObject ? doc.toObject() : doc;

    const metaEvent = emitCareerEvent(
      'TimelineEventCreated',
      {
        timelineEventId: String(plain._id),
        verb: plain.verb,
        objectType: plain.objectType,
        objectId: plain.objectId,
        subjectTalentProfileId: String(plain.subjectTalentProfileId),
      },
      {
        actor: { type: plain.actorType, id: plain.actorId },
        aggregateType: 'TimelineEvent',
        aggregateId: plain._id,
        locale: plain.locale,
      }
    );
    scheduleAnalyticsEvent(
      {
        eventType: 'timeline_event_created',
        entityType: 'timeline-event',
        entityId: metaEvent.aggregateId,
        locale: metaEvent.locale,
        metadata: {
          careerEventId: metaEvent.eventId,
          careerEventType: metaEvent.eventType,
          ...metaEvent.payload,
        },
      },
      { userId }
    );
    void platformCacheInvalidateNamespace(`career:timeline:${userId}`).catch(() => {});

    return plain;
  },

  async listForUser(userId, query = {}) {
    const parsed = parseTimelineQueryInput(query);
    const errors = validateTimelineQueryInput(parsed);
    if (errors.length) validationError(errors);

    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) return { data: [], nextCursor: null, hasMore: false };

    return TimelineEventRepository.listBySubject(profile._id, parsed);
  },

  async listForApplication(userId, applicationId, query = {}) {
    const parsed = parseTimelineQueryInput(query);
    const errors = validateTimelineQueryInput(parsed);
    if (errors.length) validationError(errors);

    const application = await OpportunityApplicationRepository.findByIdForUser(applicationId, userId);
    if (!application) {
      const err = new Error('Application not found');
      err.status = 404;
      throw err;
    }

    return TimelineEventRepository.listBySubject(application.talentProfileId, {
      ...parsed,
      objectType: 'application',
      objectId: String(applicationId),
    });
  },

  assertQuery(query = {}) {
    const parsed = parseTimelineQueryInput(query);
    const errors = validateTimelineQueryInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },
};
