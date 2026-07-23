import { subscribeCareerEvent } from './CareerEventBus.js';
import { enqueueCareerEventForTimeline } from './careerTimelineBridge.js';
import { listTimelineHandledCareerEvents } from '../../../../shared/career/timelineEventMap.js';

let registered = false;

/**
 * Register CareerEventBus → Timeline handlers (C.8.0.4).
 * Call once at server startup.
 */
export function registerCareerTimelineHandlers() {
  if (registered) return;
  registered = true;

  for (const eventType of listTimelineHandledCareerEvents()) {
    subscribeCareerEvent(eventType, (event) => {
      enqueueCareerEventForTimeline(event);
    });
  }
}

export function resetCareerTimelineHandlerRegistration() {
  registered = false;
}
