# Sprint C.6.4.9 — Page Builder Runtime Integration (Pilot) (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Feature-flagged public runtime for pilot static pages; legacy CMS fallback preserved

---

## Summary

| Deliverable | Status |
|-------------|--------|
| Reusable runtime loader → `BlockRenderer` | ✅ |
| Feature flag per page (`usePageBuilder`) | ✅ |
| Pilot pages: About, Services, Privacy, Terms | ✅ |
| Published vs draft separation | ✅ |
| Legacy CMS / i18n fallback | ✅ |
| SEO via existing `SeoHead` patterns | ✅ |
| Unsupported block safety (preview vs public) | ✅ |
| `npm run verify:registry` | ✅ PASS |
| `npm run verify:blocks` | ✅ PASS |
| Client build | ✅ PASS |

---

## Runtime Architecture

```
Static route (e.g. /about)
        ↓
StaticCmsPage (StaticCmsPageRuntime)
        ↓
getPageBuilderConfig(slug) → usePageBuilder?
        ↓ yes
usePageBuilderLayout(pageKey)
        ↓
GET /api/cms/site/page-layouts/:pageKey  (published)
   OR admin preview API (staff + ?pageBuilderPreview=1)
        ↓
isRenderablePageLayout() validation
        ↓ valid
PageBuilderPageView → BlockListRenderer → BlockRenderer → block components
        ↓ invalid / disabled / 404
Site CMS (CmsPageView) → legacy i18n Fallback component
```

All block rendering goes through the existing `BlockRenderer` from C.6.4.8 — no duplicated render logic.

---

## Feature Flag Design

**File:** `shared/pageBuilderConfig.js`

Each page entry:

```javascript
{
  pageKey: 'about',
  legacySlug: 'about',
  usePageBuilder: true,   // false by default for non-pilot pages
  canonicalPath: '/about',
  displayName: 'About',
}
```

| Helper | Purpose |
|--------|---------|
| `getPageBuilderConfig(slug)` | Resolve config by slug or pageKey |
| `isPageBuilderEnabled(slug)` | Gate runtime loader |
| `listPilotPageBuilderPages()` | Admin pilot picker |

**Pilot pages enabled:**

| pageKey | Route | usePageBuilder |
|---------|-------|----------------|
| `about` | `/about` | `true` |
| `services` | `/services` | `true` |
| `privacy-policy` | `/privacy-policy` | `true` |
| `terms` | `/terms` | `true` |

All other pages: flag absent / `false` — unchanged legacy behaviour.

---

## Fallback Flow

Automatic fallback to existing implementation when **any** of:

| Condition | Fallback target |
|-----------|-----------------|
| `usePageBuilder: false` | Site CMS → i18n |
| No published layout (404) | Site CMS → i18n |
| Layout not `published` (public) | Site CMS → i18n |
| Zero enabled blocks | Site CMS → i18n |
| Block validation fails | Site CMS → i18n |
| Block render throws (public) | Block skipped silently |

**No blank pages. No user-facing errors.**

Validation shared in `shared/pageBuilderRuntime.js` (`isRenderablePageLayout`).

Server public API returns **404** for invalid/unpublished layouts so the client cleanly falls back.

---

## Draft vs Published

| Context | Source | API |
|---------|--------|-----|
| **Public** | `publishedBlocks` only | `GET /api/cms/site/page-layouts/:pageKey` |
| **Admin editor** | `draftBlocks` inline preview | Admin Page Builder UI |
| **Staff route preview** | `draftBlocks` | `GET /admin/page-layouts/:pageKey/preview` when `?pageBuilderPreview=1` + staff auth |

**Publish** atomically copies `draftBlocks` → `publishedBlocks` in a single save (unchanged from C.6.4.8).

Draft edits never affect the live site until Publish.

---

## Block Support

- All 14 C.6.4.8 block types render via existing `blockComponentMap`
- **Public:** unknown/missing/crashing blocks → skipped (`null`)
- **Preview/admin:** `UnsupportedBlockPlaceholder` + `BlockRenderErrorBoundary`

---

## SEO & Analytics

`PageBuilderPageView` reuses existing patterns from `CmsPageView`:

- `SeoHead` (title, description, canonical, OG, Twitter)
- `breadcrumbSchema` + `webPageSchema` JSON-LD
- Breadcrumb nav in page shell

SEO fields on `CmsPageLayout` (additive): `seoTitle`, `metaDescription`, `canonicalUrl`, `ogImageUrl`, `twitterCard`.

When layout SEO fields are empty, runtime falls back to Site CMS static page metadata if available.

---

## API Additions

| Method | Path | Auth | Returns |
|--------|------|------|---------|
| GET | `/api/cms/site/page-layouts/:pageKey?locale=` | Public | Published layout or 404 |

---

## Files Added / Modified

### Added
- `shared/pageBuilderConfig.js`
- `shared/pageBuilderRuntime.js`
- `shared/pageBuilderRuntimeValidation.js`
- `client/src/hooks/usePageBuilderLayout.js`
- `client/src/components/pageBuilder/PageBuilderPageView.jsx`
- `client/src/components/pageBuilder/StaticCmsPageRuntime.jsx`
- `client/src/components/pageBuilder/BlockRenderErrorBoundary.jsx`

### Modified
- `client/src/components/static/StaticCmsPage.jsx` — re-exports runtime
- `client/src/components/pageBuilder/BlockRenderer.jsx` — error boundary + placeholders
- `client/src/services/siteContentApi.js` — `getPageLayout`
- `server/src/models/CmsPageLayout.js` — SEO fields
- `server/src/controllers/pageLayoutController.js` — public validation + SEO
- `server/src/routes/cms.js` — public layout route
- `client/src/pages/Admin/AdminPageBuilder.jsx` — pilot page picker + preview link
- `scripts/verify-page-registry.mjs` — runtime pilot check

### Unchanged (by design)
- Home, Jobs, Blog, Scholarships, Admissions, Dashboard, Admin routes
- Site CMS admin (`AdminSiteCms.jsx`) — not replaced
- Advertisements, SlugService, page/placement registries
- Public routing table

---

## Verification Results

```bash
npm run verify:registry   # PASS (includes Page Builder Runtime section)
npm run verify:blocks     # PASS
cd client && npm run build   # PASS
```

### Manual test plan

1. Visit `/about` with no published layout → legacy About page (i18n/CMS)
2. Admin Page Builder → create blocks for `about` → Publish → `/about` shows blocks
3. Edit draft without publish → public `/about` unchanged
4. Staff: `/about?pageBuilderPreview=1` → draft layout with banner
5. Visit `/faq` → no Page Builder flag → existing CMS path only
6. Disable all blocks / invalid layout → falls back to CMS/legacy

---

## Enabling Additional Pages

Add an entry to `PAGE_BUILDER_PAGES` in `shared/pageBuilderConfig.js` with `usePageBuilder: true`. No routing changes required if the page already uses `StaticCmsPage`.
