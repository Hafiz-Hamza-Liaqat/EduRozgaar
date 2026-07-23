# Sprint C.7.0.3 — Dynamic Content Blocks Platform

**Status:** Implemented  
**Date:** July 2026  
**Milestone:** C.7.0 — Platform Content Services

## Summary

Built a **reusable query-driven Dynamic Block framework** that powers all listing blocks in the Page Builder. Page Builder never queries MongoDB directly — all data flows through `DynamicBlockResolver` and `DynamicContentService`. Eight block types ship in the first generation, with visual settings UI, caching, SEO hooks, and graceful empty states.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Page Builder       │     │  DynamicBlockSettings    │
│  (8 block types)    │────▶│  Editor (visual config)  │
└──────────┬──────────┘     └──────────────────────────┘
           │
           ▼
┌─────────────────────┐     GET /api/dynamic-content/:source
│ DynamicBlockRenderer│────▶┌──────────────────────────┐
│ (client runtime)    │     │ dynamicContentController │
└─────────────────────┘     └───────────┬──────────────┘
                                        │
                                        ▼
                            ┌──────────────────────────┐
                            │   DynamicBlockResolver   │
                            │ fetch → transform →      │
                            │ cacheKey → renderModel   │
                            └───────────┬──────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
         ┌──────────────────┐  ┌─────────────┐  ┌─────────────────┐
         │DynamicContent    │  │ memoryCache │  │ MongoDB models  │
         │Service (queries) │  │ (TTL 60s)   │  │ Job, Scholarship│
         └──────────────────┘  └─────────────┘  │ Blog, etc.      │
                                                └─────────────────┘
```

## Resolver Flow

1. **Block config** (title, filters, layout) stored in page layout JSON.
2. **`buildDynamicQuery()`** converts config → API query params.
3. **`DynamicBlockResolver.fetch()`** checks memory cache, validates query, calls `DynamicContentService`.
4. **`transform()`** normalizes items (`id`, `title`, `href`, `meta`, `deadline`).
5. **`renderModel()`** returns `{ items, total, display, empty }` to client or batch endpoint.
6. **`DynamicBlockRenderer`** handles loading skeleton, error, empty (preview vs public hide).

## Supported Dynamic Blocks

| Block Type | Source Key | Filters |
|------------|------------|---------|
| `featured-jobs` | `latest-jobs` | count, featured, government, province, category, remote, sort |
| `featured-scholarships` | `featured-scholarships` | count, country, degree, featured, deadline sort |
| `featured-admissions` | `admissions` | university, province, degree, upcoming only, count |
| `dynamic-universities` | `universities` | featured, public/private, province, ranking, count |
| `dynamic-blogs` | `latest-blogs` | category, featured, count |
| `dynamic-career` | `career-guidance` | category, popular/latest, count |
| `dynamic-testimonials` | `testimonials` | featured, random, limit |
| `dynamic-partners` | `partners` | logos, grid size, carousel-ready |

Legacy block type names (`featured-jobs`, etc.) are preserved for backward compatibility; they now delegate to `DynamicBlockRenderer`.

## APIs (additive)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dynamic-content/:source` | Resolve single block (accepts block type or source key) |
| POST | `/api/dynamic-content/batch` | Batch resolve multiple blocks (avoids N+1 round-trips) |
| POST | `/api/dynamic-content/invalidate-cache` | Invalidate by source or clear all (admin/dev) |

## Cache Strategy

- **In-memory TTL cache** (`DYNAMIC_CACHE_TTL_MS`, default 60s).
- Keys: `dynamic:{source}:{normalizedQueryJSON}`.
- **Invalidation hooks** on admin writes via `invalidateDynamicContentForEntity()`:
  - Jobs → `latest-jobs`
  - Scholarships → `featured-scholarships`
  - Admissions → `admissions`
  - Blogs → `latest-blogs`
  - Career articles → `career-guidance`
- Interface is Redis-ready (`cacheGet` / `cacheSet` / `invalidateDynamicSourceCache`).

## Page Builder Integration

- **`DynamicBlockSettingsEditor`** — visual config (filters, layout, card style, metadata toggles, button, empty message). No raw JSON.
- **`BlockConfigFields`** — renders settings editor for all dynamic block types.
- **Empty states:** preview shows configurable placeholder; public runtime hides block when no data.
- **SEO:** `collectDynamicBlockJsonLd()` emits `ItemList` schemas; deduped in `resolvePageBuilderSeo()`.

## Files Changed / Added

### Shared
- `shared/dynamicBlocks/registry.js`
- `shared/dynamicBlocks/validation.js`
- `shared/dynamicBlocks/seo.js`
- `shared/blockRegistry.js` — 8 dynamic blocks, settings via editor
- `shared/pageBuilderSeo.js` — `dynamicSchemas`

### Server
- `server/src/services/dynamicContent/DynamicContentService.js`
- `server/src/services/dynamicContent/DynamicBlockResolver.js`
- `server/src/services/dynamicContent/memoryCache.js`
- `server/src/controllers/dynamicContentController.js`
- `server/src/routes/dynamicContent.js`
- `server/src/utils/dynamicContentCache.js`
- Admin cache hooks: jobs, scholarships, admissions, blogs, career articles

### Client
- `client/src/services/dynamicContentApi.js`
- `client/src/components/pageBuilder/dynamic/DynamicBlockRenderer.jsx`
- `client/src/components/pageBuilder/dynamic/DynamicBlockSettingsEditor.jsx`
- `client/src/components/pageBuilder/dynamic/dynamicBlockLayouts.jsx`
- `client/src/components/pageBuilder/BlockConfigFields.jsx`
- `client/src/components/pageBuilder/blockComponentMap.js`
- `client/src/components/pageBuilder/blocks/index.jsx` — legacy `FeaturedListingBlock` removed
- `client/src/components/pageBuilder/PageBuilderPageView.jsx`

### Tooling
- `scripts/verify-dynamic-blocks.mjs`
- `package.json` — `verify:dynamic-blocks`

## Verification

```bash
npm run verify:dynamic-blocks
npm run verify:blocks
cd client && npm run build
```

## Manual QA Checklist

- [ ] Add **Latest Jobs** block → filter Government → show 6 → publish
- [ ] Add **Featured Scholarships** → Country = UK → publish
- [ ] Add **Admissions** → Upcoming only → publish
- [ ] Add **Latest Blogs** → Category = Career → publish
- [ ] Remove all matching content → verify graceful empty state (hidden on public, placeholder in preview)
- [ ] Update a job/scholarship in admin → verify cache refresh within TTL / after save
- [ ] Confirm responsive layouts and live preview in Page Builder
- [ ] Confirm JSON-LD `ItemList` in page source (no duplicates with FAQ)

## Constraints Met

- Additive only — no changes to ads, forms, media library, slug system, or routing
- Backward compatible — existing `featured-*` block types still work
- Page Builder does not query MongoDB directly

## Recommended Next Sprints

| Sprint | Focus |
|--------|-------|
| C.7.0.4 | Global Search & Intelligent Indexing |
| C.7.0.5 | Analytics & Content Insights |
| C.7.0.6 | Workflow, Permissions & Editorial Approvals |
| C.7.0.7 | Localization & Multi-language |
| C.7.0.8 | Production Deployment & Scalability |
