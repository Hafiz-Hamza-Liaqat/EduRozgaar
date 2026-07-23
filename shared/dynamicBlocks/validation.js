import { DYNAMIC_SOURCES } from './registry.js';

/**
 * @param {string} source
 * @param {object} query
 */
export function validateDynamicQuery(source, query = {}) {
  const errors = [];
  if (!DYNAMIC_SOURCES.includes(source)) errors.push(`Unknown dynamic source: ${source}`);
  const count = Number(query.count);
  if (query.count != null && (Number.isNaN(count) || count < 1 || count > 24)) {
    errors.push('count must be between 1 and 24');
  }
  return errors;
}
