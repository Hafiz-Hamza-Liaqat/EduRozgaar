/**
 * Analytics export helpers (C.7.0.5).
 */

/**
 * @param {object[]} rows
 * @param {string[]} columns
 */
export function rowsToCsv(rows = [], columns = []) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c])).join(','));
  return [header, ...lines].join('\n');
}

/**
 * Flatten dashboard payload for CSV export.
 * @param {object} dashboard
 */
export function flattenDashboardForExport(dashboard = {}) {
  const rows = [];
  const cards = dashboard.cards || {};
  Object.entries(cards).forEach(([key, value]) => {
    rows.push({ section: 'cards', key, value });
  });
  (dashboard.topPages || []).forEach((r, i) => {
    rows.push({ section: 'topPages', key: r.label || r.page || i, value: r.value ?? r.count });
  });
  (dashboard.topSearches || []).forEach((r, i) => {
    rows.push({ section: 'topSearches', key: r.label || r.query || i, value: r.value ?? r.count });
  });
  (dashboard.topAds || []).forEach((r, i) => {
    rows.push({ section: 'topAds', key: r.label || r.name || i, value: r.ctr ?? r.clicks });
  });
  return rows;
}
