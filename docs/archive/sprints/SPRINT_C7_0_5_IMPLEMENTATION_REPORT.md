# Sprint C.7.0.5 — Analytics & Content Insights Platform

**Status:** Implemented  
**Date:** July 2026  
**Milestone:** C.7.0 — Platform Analytics

## Summary

Built EduRozgaar’s **canonical analytics platform**: a unified event pipeline (`AnalyticsEventService`), reusable aggregations (`AnalyticsAggregator`), Redis-ready caching, and an enhanced `/admin/analytics` dashboard covering search, content, ads, forms, media, and dynamic blocks. All integrations are **additive** — existing runtimes (Page Builder, search, ads, forms, media, dynamic blocks, slug) are only consumed, not modified.

## Architecture

```
Event Sources (public / admin / search / ads / forms)
      │
      ▼
AnalyticsEventService  ──▶  AnalyticsEvent (MongoDB)
      │
      ▼
Analytics Aggregator   ◀──  SearchQueryLog, AdSlotConfig,
      │                     FormSubmission, MediaAsset, …
      ▼
analyticsCache (TTL 120s, Redis-ready)
      │
      ▼
Admin APIs  /api/admin/content-insights/*
      │
      ▼
/admin/analytics  (Insights Dashboard)
```

## Part Coverage

| Part | Deliverable |
|------|-------------|
| 1 Canonical events | Extended `AnalyticsEvent` + `AnalyticsEventService` |
| 2 Aggregation | `AnalyticsAggregator` (overview, search, ads, content, forms, media, blocks) |
| 3 Dashboard | `/admin/analytics` full insights UI |
| 4 Search insights | Reads `SearchQueryLog` |
| 5 Ad insights | Reads `AdSlotConfig` counters (no duplicate counters) |
| 6 Content insights | Views + search clicks by entity |
| 7 Forms insights | Reads `FormSubmission` / `FormDefinition` |
| 8 Media insights | Storage, largest, usage sample via `findMediaAssetUsage` |
| 9 Dynamic blocks | Render/click events + cache size stats |
| 10 Charts | Line, bar, pie, area, trend indicators (no new chart lib) |
| 11 Date filters | Today / Yesterday / 7d / 30d / 90d / Custom |
| 12 Export | CSV, Excel, text summary + print |
| 13 Performance | Cached aggregations, batched Promise.all |
| 14 Accessibility | Tabs, ARIA, sr-only chart tables, dark mode |
| 15 Verification | `npm run verify:analytics` |

## Event Model (additive)

Existing fields kept: `eventType`, `userId`, `listingType`, `listingId`, `metadata`.

New optional fields:

- `entityType`, `entityId`
- `page`, `referrer`, `country`, `province`
- `device`, `browser`, `sessionId`

Supported event types include: `page_view`, `search`, `search_click`, `job_view`, `scholarship_view`, `blog_view`, `form_submit`, `media_view`, `media_download`, `ad_impression`, `ad_click`, `dynamic_block_render`, `dynamic_block_click`, `cta_click`, `newsletter_signup`, plus legacy types.

## APIs

### Public (additive)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/analytics/event` | Canonical event ingest |
| POST | `/api/v1/analytics/event` | Legacy path — now delegates to same service |

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/content-insights` | Full dashboard payload |
| GET | `/api/admin/content-insights/overview` | KPI cards |
| GET | `/api/admin/content-insights/search` | Search insights |
| GET | `/api/admin/content-insights/ads` | Ad CTR / placements |
| GET | `/api/admin/content-insights/content` | Content performance |
| GET | `/api/admin/content-insights/forms` | Form submissions |
| GET | `/api/admin/content-insights/media` | Media storage & usage |
| GET | `/api/admin/content-insights/dynamic-blocks` | Block renders / CTR |
| GET | `/api/admin/content-insights/export?format=csv\|xlsx\|summary` | Export |
| GET/POST | `/api/admin/content-insights/cache` | Cache stats / clear |

Query params: `range`, `from`, `to`.

## Cache Strategy

- In-memory TTL (`ANALYTICS_CACHE_TTL_MS`, default 120s)
- Keys: `analytics:{section}:{params}`
- Cleared on new event write
- Interface is Redis-ready (`analyticsCacheGet` / `analyticsCacheSet`)

## Dashboard UI

Route: **`/admin/analytics`** (existing nav entry; page fully replaced with insights platform).

Tabs: Overview · Search · Content · Ads · Forms · Media · Dynamic Blocks

Exports: CSV · Excel · Summary · Print

## Files Added

### Shared
- `shared/analytics/eventTypes.js`
- `shared/analytics/dateRanges.js`
- `shared/analytics/validation.js`
- `shared/analytics/exportHelpers.js`

### Server
- `server/src/services/analytics/AnalyticsEventService.js`
- `server/src/services/analytics/AnalyticsAggregator.js`
- `server/src/services/analytics/analyticsCache.js`
- `server/src/controllers/admin/contentInsightsController.js`
- `server/src/routes/analytics.js`

### Client
- `client/src/services/contentInsightsApi.js`
- `client/src/components/analytics/InsightCharts.jsx`
- `client/src/components/analytics/AnalyticsDateRangeFilter.jsx`

### Tooling
- `scripts/verify-analytics.mjs`
- `docs/SPRINT_C7_0_5_IMPLEMENTATION_REPORT.md`

## Files Modified

- `server/src/models/AnalyticsEvent.js` — additive fields only
- `server/src/controllers/analyticsController.js` — delegates to `AnalyticsEventService`
- `server/src/routes/index.js`, `server/src/index.js` — mount `analyticsRouter`
- `server/src/routes/admin.js` — content-insights routes
- `server/src/controllers/admin/exportController.js` — `content-insights` exporter
- `client/src/pages/Admin/AnalyticsDashboard.jsx` — full insights UI
- `package.json` — `verify:analytics`

## Constraints Met

- No changes to Page Builder runtime, search engine, ad rendering, forms runtime, media uploads, slug system, or dynamic block rendering
- No schema-breaking migrations (new fields optional)
- Existing `/api/v1/analytics/dashboard` contract preserved
- Ad counters read from existing `AdSlotConfig` only

## Verification

```bash
npm run verify:analytics   # 39 passed
npm run verify:search      # 47 passed
npm run verify:dynamic-blocks
npm run verify:blocks
npm run verify:registry
cd client && npm run build # PASS
```

## Screenshots

Open after admin login:

1. Navigate to **Admin → Analytics** (`/admin/analytics`)
2. Capture Overview (KPI cards + charts)
3. Capture Search / Ads / Forms tabs with date filter set to **30 Days**
4. Use **Print** or **CSV** export for print-friendly / offline review

*(Screenshots are environment-specific; capture locally after seeding or live traffic.)*

## Manual QA

- [ ] `/admin/analytics` loads with KPI cards
- [ ] Date filter Today → 90 Days updates all tabs
- [ ] Search tab shows top / zero-result queries from `SearchQueryLog`
- [ ] Ads tab matches Advertisement manager CTR
- [ ] Forms tab reflects recent submissions
- [ ] Media tab shows storage MB and largest files
- [ ] CSV / Excel / Summary export downloads
- [ ] Print stylesheet usable
- [ ] Keyboard tab navigation + screen-reader chart tables
- [ ] Dark mode charts readable

## Future Extension Points

| Area | Extension |
|------|-----------|
| Redis | Swap `analyticsCache.js` backend |
| Heat maps | Add calendar heatmap for daily series |
| Real-time | WebSocket push for live counters |
| Semantic | Join SearchQueryLog with AI recommendations (C.7.0+) |
| PDF | Server-side PDF via puppeteer if needed |

## Recommended Next Sprint

**C.7.0.6 — Workflow, Permissions & Editorial Approvals**
