# Sprint C.6.4.7 — Remaining Placement Coverage & Registry Validation (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Wire remaining legitimate placements, mark planned entries, automated coverage verification

---

## Summary

| Deliverable | Status |
|-------------|--------|
| Wire `blog-inline` on BlogPost detail page | ✅ |
| Mark `home-sidebar` as planned (no layout) | ✅ |
| Mark CMS section entries explicitly | ✅ |
| `shared/placementCoverage.js` validation module | ✅ |
| `npm run verify:placements` | ✅ |
| Integrated into `npm run verify:registry` | ✅ |

---

## Placement State After Sprint

### Wired AdHost (16)

| Placement | Page | File |
|-----------|------|------|
| `home-top`, `home-mid-1`, `home-footer` | Home | `Home.jsx` |
| `jobs-header`, `jobs-sidebar`, `jobs-infeed`, `jobs-footer` | Jobs | `Jobs.jsx` |
| `scholarships-header`, `scholarships-sidebar` | Scholarships | `Scholarships.jsx` |
| `blog-header`, `blog-sidebar` | Blog list | `Blog.jsx` |
| `blog-inline` | Blog post | `BlogPost.jsx` |
| `admissions-header`, `admissions-sidebar` | Admissions | `Admissions.jsx` |
| `career-guidance-header` | Career Guidance | `CareerGuidance.jsx` |

### Wired CMS (not AdHost)

| Placement | Mechanism |
|-----------|-----------|
| `home-promo-strip` | CMS banners via `SiteContentContext` on `Home.jsx` |

### Planned (registry only, not admin-selectable)

| Placement | Reason |
|-----------|--------|
| `home-sidebar` | Homepage has no sidebar layout column |

### CMS sections (not ad slots)

| Placement | Purpose |
|-----------|---------|
| `home-section-featured-jobs` | CMS homepage section metadata |
| `home-section-featured-scholarships` | CMS homepage section metadata |

---

## Registry Changes

- Added `planned?: boolean` to placement definitions
- `home-sidebar`: `planned: true`, `wiredInFrontend: false`
- `blog-inline`: `wiredInFrontend: true`, preview route `/blog/prepare-university-admissions`
- CMS sections: explicit descriptions, `planned: false`

---

## Verification

### `shared/placementCoverage.js`

Checks:

- Every `wiredInFrontend` ad placement has a matching `AdHost` in client pages
- No orphan `AdHost` placementIds (code without registry entry)
- No dead AdHost (code present but `wiredInFrontend: false` and not planned)
- No dead admin mappings (`getSelectableAdPlacementsForPage` ⊆ wired)
- Planned placements have no AdHost in code
- CMS banner placement warns if Home.jsx not in scan set

### Scripts

```bash
npm run verify:placements   # coverage only
npm run verify:registry     # registry + coverage
```

---

## Files Changed

| File | Change |
|------|--------|
| `shared/placementRegistry.js` | `planned` flag, blog-inline wired, descriptions |
| `shared/placementCoverage.js` | **New** — scan + validate |
| `shared/registryUtils.js` | Dynamic wired-required list from registry |
| `client/src/pages/Blog/BlogPost.jsx` | `AdHost` for `blog-inline` |
| `scripts/verify-placement-coverage.mjs` | **New** |
| `scripts/verify-page-registry.mjs` | Runs coverage validation |
| `package.json` | `verify:placements` script |

---

## Manual QA

1. Create ad for **Blog Post → Inline** (`blog-inline-1` slot)
2. Visit a blog post — inline ad appears below featured image
3. Preview → `/blog/prepare-university-admissions?previewAd=blog-inline`
4. Admin → Advertisements — **Home → Sidebar** not in placement dropdown
5. Run `npm run verify:placements` → PASS

---

## Out of Scope

- `home-sidebar` layout (requires homepage redesign)
- Additional `home-mid-2` / `home-mid-3` in-feed slots
- Page Builder (C.6.4.3.6)
