/**
 * Analytics Aggregator — single place for all insight queries (C.7.0.5).
 * Reads existing collections; no duplicated counters.
 */
import { AnalyticsEvent } from '../../models/AnalyticsEvent.js';
import { SearchQueryLog } from '../../models/SearchQueryLog.js';
import { AdSlotConfig } from '../../models/AdSlotConfig.js';
import { FormDefinition } from '../../models/FormDefinition.js';
import { FormSubmission } from '../../models/FormSubmission.js';
import { MediaAsset } from '../../models/MediaAsset.js';
import { resolveAnalyticsDateRange, buildDailyBuckets } from '../../../../shared/analytics/dateRanges.js';
import {
  analyticsCacheGet,
  analyticsCacheSet,
  buildAnalyticsCacheKey,
} from './analyticsCache.js';
import { cacheStats as dynamicCacheStats } from '../dynamicContent/memoryCache.js';
import { searchCacheStats } from '../search/searchCache.js';
import { findMediaAssetUsage } from '../mediaUsageService.js';

function matchRange(start, end) {
  return { createdAt: { $gte: start, $lte: end } };
}

async function dailySeries(Model, match, start, end) {
  const buckets = buildDailyBuckets(start, end);
  const rows = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return buckets.map((d) => ({ label: d, value: map[d] || 0 }));
}

/**
 * @param {{ range?: string; from?: string; to?: string }} query
 */
export async function getOverviewCards(query = {}) {
  const { start, end, preset } = resolveAnalyticsDateRange(query.range, query.from, query.to);
  const cacheKey = buildAnalyticsCacheKey('overview', { preset, from: start.toISOString(), to: end.toISOString() });
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const todayRange = resolveAnalyticsDateRange('today');
  const range7 = resolveAnalyticsDateRange('7d');
  const range30 = resolveAnalyticsDateRange('30d');

  const [
    viewsToday,
    views7d,
    views30d,
    searches,
    formSubs,
    adSlots,
    eventsInRange,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({
      eventType: { $in: ['page_view', 'view', 'job_view', 'scholarship_view', 'blog_view'] },
      ...matchRange(todayRange.start, todayRange.end),
    }),
    AnalyticsEvent.countDocuments({
      eventType: { $in: ['page_view', 'view', 'job_view', 'scholarship_view', 'blog_view'] },
      ...matchRange(range7.start, range7.end),
    }),
    AnalyticsEvent.countDocuments({
      eventType: { $in: ['page_view', 'view', 'job_view', 'scholarship_view', 'blog_view'] },
      ...matchRange(range30.start, range30.end),
    }),
    SearchQueryLog.countDocuments({ ...matchRange(start, end), source: { $ne: 'admin' } }),
    FormSubmission.countDocuments(matchRange(start, end)),
    AdSlotConfig.find({}).select('impressionCount clickCount name placement status impressionLimit clickLimit').lean(),
    AnalyticsEvent.countDocuments(matchRange(start, end)),
  ]);

  const impressions = adSlots.reduce((n, s) => n + (s.impressionCount || 0), 0);
  const clicks = adSlots.reduce((n, s) => n + (s.clickCount || 0), 0);
  const adCtr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

  const payload = {
    range: { start, end, preset },
    cards: {
      viewsToday,
      views7d,
      views30d,
      searches,
      formSubmissions: formSubs,
      adCtr,
      adImpressions: impressions,
      adClicks: clicks,
      eventsInRange,
    },
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getSearchInsights(query = {}) {
  const { start, end, preset } = resolveAnalyticsDateRange(query.range, query.from, query.to);
  const cacheKey = buildAnalyticsCacheKey('search', { preset, from: start.toISOString() });
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const match = { ...matchRange(start, end), source: { $in: ['public', 'suggestions'] } };

  const [topSearches, zeroResults, avgLatency, total, withClick, byProvince, daily] = await Promise.all([
    SearchQueryLog.aggregate([
      { $match: { ...match, query: { $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 }, avgMs: { $avg: '$responseTimeMs' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    SearchQueryLog.aggregate([
      { $match: { ...match, resultCount: 0, query: { $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    SearchQueryLog.aggregate([
      { $match: match },
      { $group: { _id: null, avg: { $avg: '$responseTimeMs' } } },
    ]),
    SearchQueryLog.countDocuments(match),
    SearchQueryLog.countDocuments({ ...match, 'clickedResult.entityId': { $exists: true, $ne: null } }),
    SearchQueryLog.aggregate([
      { $match: match },
      { $group: { _id: '$locale', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    dailySeries(SearchQueryLog, match, start, end),
  ]);

  const payload = {
    range: { start, end, preset },
    topSearches: topSearches.map((r) => ({
      label: r._id,
      value: r.count,
      avgMs: Math.round(r.avgMs || 0),
    })),
    zeroResultSearches: zeroResults.map((r) => ({ label: r._id, value: r.count })),
    averageResponseTimeMs: Math.round(avgLatency[0]?.avg || 0),
    totalQueries: total,
    clickThroughRate: total > 0 ? Number(((withClick / total) * 100).toFixed(2)) : 0,
    byLocale: byProvince.map((r) => ({ label: r._id || 'en', value: r.count })),
    daily,
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getAdInsights() {
  const cacheKey = buildAnalyticsCacheKey('ads', {});
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const slots = await AdSlotConfig.find({}).lean();
  const topAds = slots
    .map((s) => {
      const impressions = s.impressionCount || 0;
      const clicks = s.clickCount || 0;
      return {
        id: String(s._id),
        label: s.name || s.placement || 'Ad',
        placement: s.placement,
        impressions,
        clicks,
        ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
        status: s.status,
        remainingImpressions: s.impressionLimit != null
          ? Math.max(0, s.impressionLimit - impressions)
          : null,
        remainingClicks: s.clickLimit != null
          ? Math.max(0, s.clickLimit - clicks)
          : null,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);

  const byPlacement = {};
  for (const s of slots) {
    const key = s.placement || 'unknown';
    if (!byPlacement[key]) byPlacement[key] = { label: key, impressions: 0, clicks: 0 };
    byPlacement[key].impressions += s.impressionCount || 0;
    byPlacement[key].clicks += s.clickCount || 0;
  }

  const payload = {
    topAds,
    topPlacements: Object.values(byPlacement)
      .map((p) => ({
        ...p,
        ctr: p.impressions > 0 ? Number(((p.clicks / p.impressions) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions),
    totals: {
      impressions: slots.reduce((n, s) => n + (s.impressionCount || 0), 0),
      clicks: slots.reduce((n, s) => n + (s.clickCount || 0), 0),
      slots: slots.length,
    },
  };
  payload.totals.ctr = payload.totals.impressions > 0
    ? Number(((payload.totals.clicks / payload.totals.impressions) * 100).toFixed(2))
    : 0;

  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getContentInsights(query = {}) {
  const { start, end, preset } = resolveAnalyticsDateRange(query.range, query.from, query.to);
  const cacheKey = buildAnalyticsCacheKey('content', { preset, from: start.toISOString() });
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const viewTypes = ['job_view', 'scholarship_view', 'blog_view', 'admission_view', 'university_view', 'career_view', 'view'];
  const match = {
    eventType: { $in: viewTypes },
    ...matchRange(start, end),
  };

  const [byEntity, topPages, daily, searchAppearances] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            entityType: { $ifNull: ['$entityType', '$listingType'] },
            entityId: { $ifNull: ['$entityId', { $toString: '$listingId' }] },
          },
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 40 },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['page_view', 'page_builder_view', 'view'] },
          page: { $ne: '' },
          ...matchRange(start, end),
        },
      },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    dailySeries(AnalyticsEvent, match, start, end),
    SearchQueryLog.aggregate([
      { $match: { ...matchRange(start, end), 'clickedResult.entityType': { $exists: true } } },
      {
        $group: {
          _id: {
            entityType: '$clickedResult.entityType',
            entityId: '$clickedResult.entityId',
          },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const payload = {
    range: { start, end, preset },
    topContent: byEntity.map((r) => ({
      entityType: r._id.entityType,
      entityId: r._id.entityId,
      label: `${r._id.entityType || 'item'}:${String(r._id.entityId || '').slice(-6)}`,
      value: r.views,
    })),
    topPages: topPages.map((r) => ({ label: r._id, value: r.count })),
    searchClicks: searchAppearances.map((r) => ({
      entityType: r._id.entityType,
      entityId: r._id.entityId,
      value: r.clicks,
      label: `${r._id.entityType}:${String(r._id.entityId || '').slice(-6)}`,
    })),
    daily,
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getFormsInsights(query = {}) {
  const { start, end, preset } = resolveAnalyticsDateRange(query.range, query.from, query.to);
  const cacheKey = buildAnalyticsCacheKey('forms', { preset, from: start.toISOString() });
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const match = matchRange(start, end);
  const [topForms, daily, spamBlocked, fileUploads, formCount] = await Promise.all([
    FormSubmission.aggregate([
      { $match: match },
      { $group: { _id: '$formSlug', count: { $sum: 1 }, withFiles: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$files', []] } }, 0] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    dailySeries(FormSubmission, match, start, end),
    FormSubmission.countDocuments({ ...match, spamScore: { $gte: 0.5 } }),
    FormSubmission.aggregate([
      { $match: match },
      { $unwind: { path: '$files', preserveNullAndEmptyArrays: false } },
      { $count: 'n' },
    ]),
    FormDefinition.countDocuments({ status: 'published' }),
  ]);

  const totalSubs = topForms.reduce((n, r) => n + r.count, 0);
  const payload = {
    range: { start, end, preset },
    topForms: topForms.map((r) => ({
      label: r._id || 'unknown',
      value: r.count,
      withFiles: r.withFiles,
    })),
    daily,
    spamBlocked,
    fileUploads: fileUploads[0]?.n || 0,
    publishedForms: formCount,
    totalSubmissions: totalSubs,
    completionRate: formCount > 0 ? Number(((totalSubs / Math.max(formCount, 1))).toFixed(2)) : 0,
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getMediaInsights() {
  const cacheKey = buildAnalyticsCacheKey('media', {});
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const assets = await MediaAsset.find({}).select('filename originalFilename fileSize mimeType createdAt storageUrl').lean();
  const totalBytes = assets.reduce((n, a) => n + (a.fileSize || 0), 0);
  const largest = [...assets]
    .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    .slice(0, 10)
    .map((a) => ({
      id: String(a._id),
      label: a.originalFilename || a.filename,
      value: a.fileSize || 0,
      mimeType: a.mimeType,
    }));

  // Sample usage for up to 30 newest assets (avoid N+1 explosion)
  const sample = assets.slice(0, 30);
  let unused = 0;
  let used = 0;
  const usageCounts = [];
  for (const asset of sample) {
    try {
      const usage = await findMediaAssetUsage(asset);
      const refs = Array.isArray(usage) ? usage.length : 0;
      if (refs === 0) unused += 1;
      else {
        used += 1;
        usageCounts.push({
          id: String(asset._id),
          label: asset.originalFilename || asset.filename,
          value: refs,
        });
      }
    } catch {
      // usage scan optional
    }
  }

  const downloads = await AnalyticsEvent.countDocuments({
    eventType: { $in: ['media_download', 'media_view'] },
  });

  const payload = {
    totalAssets: assets.length,
    storageBytes: totalBytes,
    storageMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    largest,
    mostUsed: usageCounts.sort((a, b) => b.value - a.value).slice(0, 10),
    sampleUnused: unused,
    sampleUsed: used,
    downloadsAndViews: downloads,
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export async function getDynamicBlockInsights(query = {}) {
  const { start, end, preset } = resolveAnalyticsDateRange(query.range, query.from, query.to);
  const cacheKey = buildAnalyticsCacheKey('dynamic', { preset, from: start.toISOString() });
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return cached;

  const renderMatch = {
    eventType: 'dynamic_block_render',
    ...matchRange(start, end),
  };
  const clickMatch = {
    eventType: 'dynamic_block_click',
    ...matchRange(start, end),
  };

  const [renders, clicks, byType, emptyFreq] = await Promise.all([
    AnalyticsEvent.countDocuments(renderMatch),
    AnalyticsEvent.countDocuments(clickMatch),
    AnalyticsEvent.aggregate([
      { $match: renderMatch },
      { $group: { _id: { $ifNull: ['$metadata.blockType', '$entityType'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    AnalyticsEvent.countDocuments({
      ...renderMatch,
      'metadata.empty': true,
    }),
  ]);

  const dynStats = dynamicCacheStats();
  const searchStats = searchCacheStats();

  const payload = {
    range: { start, end, preset },
    renderCount: renders,
    clickCount: clicks,
    ctr: renders > 0 ? Number(((clicks / renders) * 100).toFixed(2)) : 0,
    topBlockTypes: byType.map((r) => ({ label: r._id || 'unknown', value: r.count })),
    emptyBlockFrequency: emptyFreq,
    cache: {
      dynamic: dynStats,
      search: searchStats,
      // Hit rate not tracked at event level yet — expose size as readiness signal
      note: 'Cache hit/miss counters reserved for Redis backend; size reported now',
    },
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

/**
 * Full platform insights dashboard payload.
 */
export async function getPlatformInsightsDashboard(query = {}) {
  const cacheKey = buildAnalyticsCacheKey('dashboard', query);
  const cached = await analyticsCacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const [overview, search, ads, content, forms, media, dynamic] = await Promise.all([
    getOverviewCards(query),
    getSearchInsights(query),
    getAdInsights(),
    getContentInsights(query),
    getFormsInsights(query),
    getMediaInsights(),
    getDynamicBlockInsights(query),
  ]);

  const payload = {
    overview,
    search,
    ads,
    content,
    forms,
    media,
    dynamic,
    generatedAt: new Date().toISOString(),
    cached: false,
  };
  await analyticsCacheSet(cacheKey, payload);
  return payload;
}

export class AnalyticsAggregator {
  static getOverviewCards = getOverviewCards;
  static getSearchInsights = getSearchInsights;
  static getAdInsights = getAdInsights;
  static getContentInsights = getContentInsights;
  static getFormsInsights = getFormsInsights;
  static getMediaInsights = getMediaInsights;
  static getDynamicBlockInsights = getDynamicBlockInsights;
  static getPlatformInsightsDashboard = getPlatformInsightsDashboard;
}
