/**
 * Admin Content Insights APIs (C.7.0.5).
 */
import XLSX from 'xlsx';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateAnalyticsQuery } from '../../../../shared/analytics/validation.js';
import { flattenDashboardForExport, rowsToCsv } from '../../../../shared/analytics/exportHelpers.js';
import {
  getOverviewCards,
  getSearchInsights,
  getAdInsights,
  getContentInsights,
  getFormsInsights,
  getMediaInsights,
  getDynamicBlockInsights,
  getPlatformInsightsDashboard,
} from '../../services/analytics/AnalyticsAggregator.js';
import { analyticsCacheClear, analyticsCacheStats } from '../../services/analytics/analyticsCache.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';

function parseQuery(req) {
  return {
    range: req.query.range || '7d',
    from: req.query.from,
    to: req.query.to,
  };
}

export const getInsightsDashboard = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  const errors = validateAnalyticsQuery(q);
  if (errors.length) return res.status(400).json({ error: 'Invalid query', details: errors });
  const data = await getPlatformInsightsDashboard(q);
  res.json(data);
});

export const getOverview = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  res.json(await getOverviewCards(q));
});

export const getSearch = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  res.json(await getSearchInsights(q));
});

export const getAds = asyncHandler(async (req, res) => {
  res.json(await getAdInsights());
});

export const getContent = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  res.json(await getContentInsights(q));
});

export const getForms = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  res.json(await getFormsInsights(q));
});

export const getMedia = asyncHandler(async (req, res) => {
  res.json(await getMediaInsights());
});

export const getDynamicBlocks = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  res.json(await getDynamicBlockInsights(q));
});

export const getCacheStats = asyncHandler(async (_req, res) => {
  res.json(analyticsCacheStats());
});

export const clearCache = asyncHandler(async (req, res) => {
  analyticsCacheClear();
  await logAudit({
    ...auditFromRequest(req),
    action: 'analytics.cache_clear',
    targetType: 'analytics',
  });
  res.json({ ok: true });
});

export const exportInsights = asyncHandler(async (req, res) => {
  const q = parseQuery(req);
  const format = String(req.query.format || 'csv').toLowerCase();
  const dashboard = await getPlatformInsightsDashboard(q);
  const flat = flattenDashboardForExport({
    cards: dashboard.overview?.cards,
    topPages: dashboard.content?.topPages,
    topSearches: dashboard.search?.topSearches,
    topAds: dashboard.ads?.topAds,
  });

  await logAudit({
    ...auditFromRequest(req),
    action: 'export.data',
    targetType: 'content-insights',
    metadata: { format, count: flat.length },
  });

  if (format === 'xlsx' || format === 'excel') {
    const sheet = XLSX.utils.json_to_sheet(flat);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Insights');
    const buf = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="content-insights.xlsx"');
    return res.send(buf);
  }

  if (format === 'pdf' || format === 'summary') {
    // Lightweight text summary (print-friendly); full PDF via browser print
    const cards = dashboard.overview?.cards || {};
    const lines = [
      'EduRozgaar Content Insights Summary',
      `Generated: ${dashboard.generatedAt}`,
      '',
      `Views today: ${cards.viewsToday ?? 0}`,
      `Views 7d: ${cards.views7d ?? 0}`,
      `Views 30d: ${cards.views30d ?? 0}`,
      `Searches: ${cards.searches ?? 0}`,
      `Form submissions: ${cards.formSubmissions ?? 0}`,
      `Ad CTR: ${cards.adCtr ?? 0}%`,
      '',
      'Top searches:',
      ...(dashboard.search?.topSearches || []).slice(0, 10).map((s) => `- ${s.label}: ${s.value}`),
    ];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="content-insights-summary.txt"');
    return res.send(lines.join('\n'));
  }

  const csv = rowsToCsv(flat, ['section', 'key', 'value']);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="content-insights.csv"');
  res.send(csv);
});
