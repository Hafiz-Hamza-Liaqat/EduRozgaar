/**
 * Canonical date/time helpers (C.7.0.7.1).
 */

/**
 * Parse user/API date input to Date or null.
 * @param {string|Date|number|null|undefined} value
 */
export function parseDateInput(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Start of local day for range queries.
 * @param {Date} [date]
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * End of local day (exclusive next midnight).
 * @param {Date} [date]
 */
export function endOfDay(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * ISO date string for API responses (date portion only).
 * @param {Date|string|null|undefined} value
 */
export function toISODateString(value) {
  const d = parseDateInput(value);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}
