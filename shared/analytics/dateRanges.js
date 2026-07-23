/**
 * Analytics date range helpers (C.7.0.5).
 */

export const ANALYTICS_RANGE_PRESETS = [
  'today',
  'yesterday',
  '7d',
  '30d',
  '90d',
  'custom',
];

/**
 * @param {string} preset
 * @param {string|Date} [from]
 * @param {string|Date} [to]
 * @returns {{ start: Date; end: Date; preset: string }}
 */
export function resolveAnalyticsDateRange(preset = '7d', from, to) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday': {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case '30d':
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case '90d':
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom': {
      const s = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
      const e = to ? new Date(to) : new Date();
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e, preset: 'custom' };
    }
    case '7d':
    default:
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end, preset: ANALYTICS_RANGE_PRESETS.includes(preset) ? preset : '7d' };
}

/**
 * Build daily buckets between start and end (inclusive calendar days).
 * @param {Date} start
 * @param {Date} end
 * @returns {string[]} YYYY-MM-DD
 */
export function buildDailyBuckets(start, end) {
  const days = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
