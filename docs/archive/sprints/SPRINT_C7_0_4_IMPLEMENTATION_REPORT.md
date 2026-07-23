# Sprint C.7.0.4 — Global Search & Intelligent Indexing

**Status:** Implemented  
**Date:** July 2026  
**Milestone:** C.7.0 — Platform Search Infrastructure

## Summary

Built the **canonical search infrastructure** for EduRozgaar: a unified `SearchDocument` index, incremental `SearchIndexer`, weighted ranking, instant suggestions, related content service, admin global search, homepage `GlobalSearch` combobox, and search analytics foundation. All changes are **additive** — existing per-listing `?search=` APIs are unchanged.

## Architecture

```
┌──────────────────┐     ┌─────────────────────┐
│  GlobalSearch    │────▶│ GET /search/suggestions │
│  (Homepage)      │     └──────────┬──────────┘
└────────┬─────────┘                │
         │                          ▼
         ▼               ┌─────────────────────┐
┌──────────────────┐     │  searchController   │
│ SearchResults    │────▶│ GET /search         │
└──────────────────┘     └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  SearchIndexService │
                         │  query · upsert ·   │
                         │  facets · cache     │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
    ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
    │ SearchDocument  │  │ searchCache  │  │ SearchQueryLog   │
    │ (MongoDB)       │  │ (TTL 60s)    │  │ (analytics)      │
    └─────────────────┘  └──────────────┘  └──────────────────┘
              ▲
              │ incremental
    ┌─────────┴─────────┐
    │    SearchIndexer    │
    │ indexEntity ·       │
    │ removeEntity ·      │
    │ rebuildEntityType   │
    └─────────┬───────────┘
              │
    Admin write hooks (jobs, scholarships, blogs, …)
```

## Index Lifecycle

1. **Admin publishes/updates** content → `scheduleSearchIndexUpdate(entity, id)`
2. **SearchIndexer** loads source document → `documentMappers` normalize to canonical shape
3. **SearchIndexService.upsertSearchDocument** writes to `SearchDocument` collection
4. **searchCache** invalidated (`search:` prefix)
5. **Delete** → `scheduleSearchIndexRemoval` removes index entry

Full rebuild available via `POST /api/admin/search/reindex` (all types or single `entityType`).

## Canonical Document Shape

```json
{
  "entityType": "job",
  "entityId": "...",
  "title": "...",
  "slug": "...",
  "url": "/jobs/...",
  "summary": "...",
  "keywords": [],
  "category": "...",
  "province": "...",
  "country": "...",
  "tags": [],
  "publishedAt": "...",
  "featured": false,
  "status": "active",
  "searchable": true,
  "metadata": { "adminEditUrl": "/admin/jobs", "icon": "job" },
  "searchText": "…includes synonyms…"
}
```

### Indexed Entity Types (10)

| Type | Source |
|------|--------|
| `job` | Job |
| `scholarship` | Scholarship |
| `admission` | Admission |
| `university` | University |
| `blog` | Blog |
| `career-guidance` | CareerArticle |
| `cms-page` | CmsStaticPage |
| `page-builder-page` | CmsPageLayout (published blocks text extracted) |
| `form` | FormDefinition (optional) |
| `media` | MediaAsset (metadata only) |

## APIs (additive)

### Public

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/search` | Full search with filters, facets, pagination |
| GET | `/api/search/suggestions` | Grouped autocomplete |
| POST | `/api/search/click` | Analytics click tracking |
| GET | `/api/search/related/:entityType/:entityId` | Related content |

**Query params:** `q`, `type`, `category`, `province`, `country`, `featured`, `page`, `limit`, `sort` (`relevance` \| `newest` \| `oldest` \| `alphabetical`)

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/search` | Cross-entity admin search (includes drafts) |
| GET | `/api/admin/search/stats` | Index document counts |
| POST | `/api/admin/search/reindex` | Rebuild index |

## Ranking Algorithm

Weights in `shared/search/rankingWeights.js`:

| Signal | Weight |
|--------|--------|
| Exact title match | 100 |
| Title prefix | 60 |
| Title contains | 40 |
| Slug match | 35 |
| Featured | 25 |
| Keyword match | 20 |
| Tag match | 18 |
| Summary match | 15 |
| Category / province / country | 12 / 10 / 10 |
| Freshness (decay 90d) | up to 15 |

Synonyms from `shared/search/synonyms.js` expand queries (e.g. Govt → Government, BSCS → Computer Science).

## Related Content

`RelatedContentService.findRelated({ entityType, entityId })` matches on tags, category, province, country, keywords — reusable for future "Related Jobs/Scholarships/Blogs" UI without coupling.

## Cache Strategy

- In-memory TTL cache (`SEARCH_CACHE_TTL_MS`, default 60s)
- Keys: `search:{normalizedParamsJSON}`
- Invalidated on index upsert/delete and admin content writes
- Redis-ready interface (`searchCacheGet` / `searchCacheSet`)

## Client

| Component | Path | Purpose |
|-----------|------|---------|
| `GlobalSearch` | `client/src/components/search/GlobalSearch.jsx` | Homepage combobox, 200ms debounce, ARIA, keyboard nav |
| `SearchResults` | `client/src/pages/Search/SearchResults.jsx` | `/search?q=` results, noindex SEO |
| `AdminGlobalSearch` | `client/src/pages/Admin/AdminGlobalSearch.jsx` | `/admin/search` |

## Search Analytics

`SearchQueryLog` stores: `query`, `timestamp`, `resultCount`, `clickedResult`, `responseTimeMs`, `source`. No dashboard yet (C.7.0.5).

## SEO

- Search results pages: `noindex, nofollow`
- Canonical URL with pagination params
- No duplicate structured data on search pages

## Verification

```bash
npm run verify:search
npm run verify:dynamic-blocks
npm run verify:blocks
npm run verify:registry
cd client && npm run build
```

## Files Added

- `shared/search/*` (6 modules)
- `server/src/models/SearchDocument.js`, `SearchQueryLog.js`
- `server/src/services/search/*` (6 modules)
- `server/src/controllers/searchController.js`, `admin/adminSearchController.js`
- `server/src/routes/search.js`
- `server/src/utils/searchIndexHooks.js`
- `client/src/services/searchApi.js`
- `client/src/components/search/GlobalSearch.jsx`
- `client/src/pages/Search/SearchResults.jsx`
- `client/src/pages/Admin/AdminGlobalSearch.jsx`
- `scripts/verify-search.mjs`

## Files Modified (additive hooks only)

- `server/src/index.js`, `routes/index.js`, `routes/admin.js`
- Admin controllers: jobs, scholarships, admissions, blogs, career articles
- `server/src/controllers/pageLayoutController.js` (publish hook)
- `client/src/pages/Home/Home.jsx`, `routes/index.jsx`, `constants/index.js`
- `client/src/config/adminNavConfig.js`, `i18n/locales/en/admin.json`
- `package.json`

## Future Extension Points

| Sprint | Extension |
|--------|-----------|
| C.7.0.5 | Analytics dashboard from `SearchQueryLog` |
| Semantic search | Replace regex scoring with embeddings on `searchText` |
| Redis | Swap `searchCache.js` backend |
| AI recommendations | Consume `RelatedContentService` + index metadata |
| Listing migration | Optionally route per-listing `?search=` through index behind flag |

## Manual QA

1. Run `POST /api/admin/search/reindex` to populate index
2. Homepage: type "government" → see grouped suggestions → Enter → `/search?q=…`
3. Keyboard: ArrowDown, Enter, Esc on homepage search
4. Admin → Global Search → find job/blog → View / Edit links
5. Update a job in admin → verify search results refresh after cache TTL / immediate reindex
6. Empty query on `/search` → friendly message, noindex in page source
