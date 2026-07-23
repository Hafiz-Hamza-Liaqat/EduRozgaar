import { randomUUID } from 'crypto';
import { CAREER_DOMAIN_EVENTS } from '../../../../shared/career/constants.js';

const EVENT_SET = new Set(CAREER_DOMAIN_EVENTS);
const subscribers = new Map();
const recentEvents = [];
const MAX_RECENT = 200;

/**
 * In-process career domain event bus (C.8.0.2A).
 * Handlers register in later sprints; emit-only contract for now.
 */
export function subscribeCareerEvent(eventType, handler) {
  if (!EVENT_SET.has(eventType)) {
    throw new Error(`Unknown career event type: ${eventType}`);
  }
  if (!subscribers.has(eventType)) subscribers.set(eventType, new Set());
  subscribers.get(eventType).add(handler);
  return () => subscribers.get(eventType)?.delete(handler);
}

/**
 * @param {string} eventType
 * @param {object} payload
 * @param {{ actor?: object; aggregateType?: string; aggregateId?: string; locale?: string; market?: string }} [meta]
 */
export function emitCareerEvent(eventType, payload = {}, meta = {}) {
  if (!EVENT_SET.has(eventType)) {
    throw new Error(`Unknown career event type: ${eventType}`);
  }

  const event = {
    eventId: randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    aggregateType: meta.aggregateType || inferAggregateType(eventType),
    aggregateId: meta.aggregateId ? String(meta.aggregateId) : undefined,
    actor: meta.actor || { type: 'system', id: null },
    payload,
    locale: meta.locale,
    market: meta.market,
  };

  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT) recentEvents.shift();

  const handlers = subscribers.get(eventType);
  if (handlers) {
    for (const fn of handlers) {
      try {
        fn(event);
      } catch {
        /* fail-open for sync handlers */
      }
    }
  }

  return event;
}

function inferAggregateType(eventType) {
  if (eventType.startsWith('TalentProfile')) return 'TalentProfile';
  if (eventType.startsWith('Resume')) return 'ResumeVersion';
  if (eventType.startsWith('Application') || eventType === 'StageChanged' || eventType === 'NoteAdded'
    || eventType === 'ReminderCreated' || eventType === 'DocumentAttached' || eventType === 'OfferAccepted') {
    return 'OpportunityApplication';
  }
  if (eventType.startsWith('Timeline')) return 'TimelineEvent';
  if (eventType.startsWith('Document')) return 'Document';
  if (eventType.startsWith('Credential')) return 'Credential';
  if (eventType.startsWith('CareerScore') || eventType === 'ScoreSnapshotCreated' || eventType === 'ReadinessUpdated') {
    return 'ScoreSnapshot';
  }
  if (eventType.startsWith('Assessment')) return 'Assessment';
  if (
    eventType.startsWith('Candidate')
    || eventType.startsWith('Offer')
    || eventType === 'HiringNoteAdded'
    || eventType === 'InterviewCompleted'
  ) {
    return 'HiringAction';
  }
  return 'Unknown';
}

export function getRecentCareerEvents(limit = 50) {
  return recentEvents.slice(-limit);
}

export function clearCareerEventHistory() {
  recentEvents.length = 0;
}

export function resetCareerEventBus() {
  subscribers.clear();
  recentEvents.length = 0;
}

export function getCareerEventSubscriberCount(eventType) {
  return subscribers.get(eventType)?.size || 0;
}
