#!/usr/bin/env node
/**
 * Analytics & Content Insights verification (C.7.0.5)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ANALYTICS_EVENT_TYPES, isAnalyticsEventType, resolveCanonicalEventType } from '../shared/analytics/eventTypes.js';
import { resolveAnalyticsDateRange, buildDailyBuckets, ANALYTICS_RANGE_PRESETS } from '../shared/analytics/dateRanges.js';
import { validateAnalyticsEvent, validateAnalyticsQuery } from '../shared/analytics/validation.js';
import { flattenDashboardForExport, rowsToCsv } from '../shared/analytics/exportHelpers.js';
import { AnalyticsEventService, parseUserAgent } from '../server/src/services/analytics/AnalyticsEventService.js';
import { AnalyticsAggregator } from '../server/src/services/analytics/AnalyticsAggregator.js';
import {
  analyticsCacheGet,
  analyticsCacheSet,
  analyticsCacheClear,
  buildAnalyticsCacheKey,
} from '../server/src/services/analytics/analyticsCache.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

// Event types
{
  if (ANALYTICS_EVENT_TYPES.includes('page_view') && ANALYTICS_EVENT_TYPES.includes('search_click')) {
    pass('canonical event types');
  } else fail('canonical event types');
  if (isAnalyticsEventType('job_view')) pass('isAnalyticsEventType');
  else fail('isAnalyticsEventType');
  if (resolveCanonicalEventType('view', 'job') === 'job_view') pass('legacy event mapping');
  else fail('legacy event mapping');
}

// Date ranges
{
  if (ANALYTICS_RANGE_PRESETS.includes('7d') && ANALYTICS_RANGE_PRESETS.includes('custom')) {
    pass('range presets');
  } else fail('range presets');
  const r = resolveAnalyticsDateRange('7d');
  if (r.start < r.end) pass('resolve 7d range');
  else fail('resolve 7d range');
  const buckets = buildDailyBuckets(r.start, r.end);
  if (buckets.length >= 7) pass('daily buckets');
  else fail('daily buckets', String(buckets.length));
}

// Validation
{
  if (!validateAnalyticsEvent({ eventType: 'page_view' }).length) pass('event validation ok');
  else fail('event validation ok');
  if (validateAnalyticsEvent({}).length) pass('event validation requires type');
  else fail('event validation requires type');
  if (!validateAnalyticsQuery({ range: '30d' }).length) pass('query validation');
  else fail('query validation');
  if (validateAnalyticsQuery({ range: 'custom' }).length) pass('custom requires from/to');
  else fail('custom requires from/to');
}

// Export helpers
{
  const csv = rowsToCsv([{ a: 1, b: 'x' }], ['a', 'b']);
  if (csv.includes('a,b') && csv.includes('1,x')) pass('csv helper');
  else fail('csv helper');
  const flat = flattenDashboardForExport({ cards: { viewsToday: 3 }, topSearches: [{ label: 'jobs', value: 2 }] });
  if (flat.length >= 2) pass('flatten dashboard');
  else fail('flatten dashboard');
}

// UA parse
{
  const mobile = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) AppleWebKit Mobile Safari');
  if (mobile.device === 'mobile') pass('UA device parse');
  else fail('UA device parse');
}

// Service API surface
{
  if (typeof AnalyticsEventService.record === 'function'
    && typeof AnalyticsEventService.schedule === 'function') {
    pass('AnalyticsEventService');
  } else fail('AnalyticsEventService');
  if (typeof AnalyticsAggregator.getPlatformInsightsDashboard === 'function'
    && typeof AnalyticsAggregator.getSearchInsights === 'function'
    && typeof AnalyticsAggregator.getAdInsights === 'function'
    && typeof AnalyticsAggregator.getFormsInsights === 'function'
    && typeof AnalyticsAggregator.getMediaInsights === 'function'
    && typeof AnalyticsAggregator.getDynamicBlockInsights === 'function') {
    pass('AnalyticsAggregator methods');
  } else fail('AnalyticsAggregator methods');
}

// Cache
{
  await analyticsCacheClear();
  const key = buildAnalyticsCacheKey('test', { range: '7d' });
  await analyticsCacheSet(key, { ok: true });
  const hit = await analyticsCacheGet(key);
  if (hit?.ok) pass('analytics cache');
  else fail('analytics cache');
  await analyticsCacheClear();
}

// Files
const required = [
  'shared/analytics/eventTypes.js',
  'shared/analytics/dateRanges.js',
  'shared/analytics/validation.js',
  'shared/analytics/exportHelpers.js',
  'server/src/services/analytics/AnalyticsEventService.js',
  'server/src/services/analytics/AnalyticsAggregator.js',
  'server/src/services/analytics/analyticsCache.js',
  'server/src/controllers/admin/contentInsightsController.js',
  'server/src/routes/analytics.js',
  'client/src/services/contentInsightsApi.js',
  'client/src/components/analytics/InsightCharts.jsx',
  'client/src/components/analytics/AnalyticsDateRangeFilter.jsx',
  'client/src/pages/Admin/AnalyticsDashboard.jsx',
];
for (const f of required) {
  if (exists(f)) pass(`file ${f.split('/').pop()}`);
  else fail(`missing ${f}`);
}

// Routes
{
  const index = read('server/src/index.js');
  if (index.includes('analyticsRouter')) pass('analytics router mounted');
  else fail('analytics router mounted');
  const admin = read('server/src/routes/admin.js');
  if (admin.includes('/content-insights') && admin.includes('exportInsights')) {
    pass('admin content-insights routes');
  } else fail('admin content-insights routes');
  const analyticsRoute = read('server/src/routes/analytics.js');
  if (analyticsRoute.includes('/analytics/event')) pass('public event endpoint');
  else fail('public event endpoint');
}

// Client dashboard
{
  const dash = read('client/src/pages/Admin/AnalyticsDashboard.jsx');
  if (dash.includes('contentInsightsApi') && dash.includes('AnalyticsDateRangeFilter')) {
    pass('dashboard wired');
  } else fail('dashboard wired');
  if (dash.includes('SimpleLineChart') && dash.includes('SimplePieChart')) pass('charts present');
  else fail('charts present');
  if (dash.includes('role="tablist"') && dash.includes('print')) pass('a11y + print');
  else fail('a11y + print');
  const charts = read('client/src/components/analytics/InsightCharts.jsx');
  if (charts.includes('sr-only') && charts.includes('aria-label')) pass('chart a11y fallbacks');
  else fail('chart a11y fallbacks');
}

// Model additive fields
{
  const model = read('server/src/models/AnalyticsEvent.js');
  if (model.includes('entityType') && model.includes('sessionId') && model.includes('listingType')) {
    pass('additive AnalyticsEvent schema');
  } else fail('additive AnalyticsEvent schema');
}

// recordEvent uses service
{
  const ctrl = read('server/src/controllers/analyticsController.js');
  if (ctrl.includes('recordAnalyticsEvent')) pass('event pipeline unified');
  else fail('event pipeline unified');
}

// Export registered
{
  const exp = read('server/src/controllers/admin/exportController.js');
  if (exp.includes("'content-insights'")) pass('export content-insights');
  else fail('export content-insights');
}

console.log(`\nAnalytics verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('All checks passed.');
process.exit(0);
