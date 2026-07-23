import { isAnalyticsEventType } from './eventTypes.js';
import { ANALYTICS_RANGE_PRESETS } from './dateRanges.js';

/**
 * @param {object} body
 */
export function validateAnalyticsEvent(body = {}) {
  const errors = [];
  const eventType = String(body.eventType || '').trim();
  if (!eventType) errors.push('eventType is required');
  else if (!isAnalyticsEventType(eventType) && eventType.length > 64) {
    errors.push('eventType is too long');
  }
  if (body.sessionId && String(body.sessionId).length > 128) {
    errors.push('sessionId too long');
  }
  return errors;
}

/**
 * @param {object} query
 */
export function validateAnalyticsQuery(query = {}) {
  const errors = [];
  if (query.range && !ANALYTICS_RANGE_PRESETS.includes(query.range)) {
    errors.push(`range must be one of: ${ANALYTICS_RANGE_PRESETS.join(', ')}`);
  }
  if (query.range === 'custom') {
    if (!query.from) errors.push('from is required for custom range');
    if (!query.to) errors.push('to is required for custom range');
  }
  return errors;
}
