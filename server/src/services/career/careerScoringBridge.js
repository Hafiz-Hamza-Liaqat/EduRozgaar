import { subscribeCareerEvent } from './CareerEventBus.js';
import { ScoringService } from './ScoringService.js';
import { isScoringEnabled } from '../../config/careerFeatureFlags.js';

let registered = false;

const RECOMPUTE_TRIGGERS = [
  'TalentProfileUpdated',
  'ResumePublished',
  'DocumentCreated',
  'DocumentUpdated',
  'CredentialIssued',
  'CredentialVerified',
  'ApplicationCreated',
  'StageChanged',
  'AssessmentCompleted',
  'AssessmentPassed',
];

const debounceMap = new Map();
const DEBOUNCE_MS = 5_000;

function scheduleRecompute(userId) {
  if (!userId || !isScoringEnabled()) return;
  const key = String(userId);
  const existing = debounceMap.get(key);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(async () => {
    debounceMap.delete(key);
    try {
      await ScoringService.compute(userId, 'career_readiness', {}, { type: 'system', id: null });
    } catch {
      /* soft-fail: profile may not exist yet */
    }
  }, DEBOUNCE_MS);
  debounceMap.set(key, timer);
}

function userIdFromEvent(event) {
  return event.payload?.userId
    || (event.actor?.type === 'talent' ? event.actor?.id : null)
    || null;
}

/**
 * CareerEventBus → debounced score recompute (C.8.2).
 */
export function registerCareerScoringHandlers() {
  if (registered) return;
  registered = true;
  ScoringService.ensureProviders();

  for (const eventType of RECOMPUTE_TRIGGERS) {
    subscribeCareerEvent(eventType, (event) => {
      const userId = userIdFromEvent(event);
      if (userId) scheduleRecompute(userId);
    });
  }
}

export function resetCareerScoringHandlerRegistration() {
  registered = false;
  for (const t of debounceMap.values()) clearTimeout(t);
  debounceMap.clear();
}
