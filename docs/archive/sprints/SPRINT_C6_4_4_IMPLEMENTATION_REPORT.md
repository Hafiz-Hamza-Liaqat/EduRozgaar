# Sprint C.6.4.4 — Advertisement Rendering & Preview System (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented (C.6.4.4.1 diagnostic audit accepted)  
**Scope:** Public ad rendering (`AdHost`), preview workflow, registry-driven placement filtering  
**Backward compatibility:** Slot IDs, registry IDs, routes, and existing ad records unchanged (additive only)

---

## Summary

Converted the C.6.4.3 advertisement foundation into a working end-to-end system. Admin-created image advertisements now render on public pages. Preview opens the correct route, scrolls to the placement anchor, and highlights the creative for 4 seconds.

| Deliverable | Status |
|-------------|--------|
| `AdHost` reusable component | ✅ |
| Registry-driven public page wiring (15 ad placements) | ✅ |
| Image creative rendering (image, title/alt, click URL) | ✅ |
| Admin Preview button (`Edit \| Preview \| Delete`) | ✅ |
| Preview scroll + yellow pulse highlight | ✅ |
| Anchor IDs (`ad-{placementId}`) | ✅ |
| Admin blocks unwired (“dead”) placements | ✅ |
| Empty state = `null` (no placeholders) | ✅ |
| `npm run verify:registry` | ✅ PASS |
| Client production build | ✅ PASS |

---

## Architecture

```
shared/placementRegistry.js     ← wiredInFrontend flags, getSelectableAdPlacementsForPage()
        │
        ▼
client/src/context/AdSlotsContext.jsx   ← GET /api/monetization/ad-slots (once per session)
        │
        ▼
client/src/components/ads/AdHost.jsx    ← placementId → slot match → render
        │
        ├── AdImageCreative.jsx         ← imageUrl + targetUrl (direct-sold)
        └── AdBanner.jsx                ← AdSense fallback (legacy slots, prod-safe)
```

**Preview flow**

```
AdminAdvertisements → Preview
  → sessionStorage[`adPreviewSlot:{placementId}`] = row JSON
  → window.open(`{previewRoute}?previewAd={placementId}`)
AdHost (preview mode)
  → reads sessionStorage OR live API slot
  → bypasses active/date filters
  → scrollIntoView + ring-yellow pulse (4s)
```

---

## Components Added

| File | Purpose |
|------|---------|
| `client/src/components/ads/AdHost.jsx` | Registry-driven host; anchor `id="ad-{placementId}"`; schedule filtering; preview highlight |
| `client/src/components/ads/AdImageCreative.jsx` | Responsive image ad with `alt`, `title`, and linked `targetUrl` |
| `client/src/context/AdSlotsContext.jsx` | Shared provider fetching public ad slots |
| `client/src/hooks/useAdPreview.js` | Reads `?previewAd=` query param |
| `client/src/utils/adSlotUtils.js` | Slot ID resolution, schedule checks, anchor helper |

---

## Files Changed (C.6.4.4 slice)

| File | Change |
|------|--------|
| `shared/placementRegistry.js` | Added `admissions-header`, `career-guidance-header`, `blog-sidebar`; `getSelectableAdPlacementsForPage()`; `wiredInFrontend` flags |
| `shared/registryUtils.js` | Wired-slot validation list updated (15 wired ad placements) |
| `client/src/layouts/MainLayout.jsx` | Wraps app in `AdSlotsProvider` |
| `client/src/components/ads/index.js` | Exports `AdHost`, `AdImageCreative` |
| `client/src/pages/Home/Home.jsx` | `home-top`, `home-mid-1`, `home-footer` |
| `client/src/pages/Jobs/Jobs.jsx` | `jobs-header`, `jobs-sidebar`, `jobs-infeed`, `jobs-footer` |
| `client/src/pages/Blog/Blog.jsx` | `blog-header`, `blog-sidebar` (layout with aside) |
| `client/src/pages/Admissions/Admissions.jsx` | `admissions-header`, `admissions-sidebar` |
| `client/src/pages/CareerGuidance/CareerGuidance.jsx` | `career-guidance-header` |
| `client/src/pages/Scholarships/Scholarships.jsx` | `scholarships-header`, `scholarships-sidebar` |
| `client/src/pages/Admin/AdminAdvertisements.jsx` | Preview action; selectable placements only |
| `client/src/i18n/locales/en/admin.json` | `adSlotPreview`, `adSlotPreviewUnavailable` |

---

## Public Pages Wired

All registry placements with `wiredInFrontend: true` and ad capability are integrated:

| Page | Route | Placements |
|------|-------|------------|
| Home | `/` | `home-top`, `home-mid-1`, `home-footer` |
| Jobs | `/jobs` | `jobs-header`, `jobs-sidebar`, `jobs-infeed` (every 5 cards), `jobs-footer` |
| Scholarships | `/scholarships` | `scholarships-header`, `scholarships-sidebar` |
| Blog | `/blog` | `blog-header`, `blog-sidebar` |
| Admissions | `/admissions` | `admissions-header`, `admissions-sidebar` |
| Career Guidance | `/career-guidance` | `career-guidance-header` |

**Not wired (excluded from admin picker):**

- `home-sidebar` — no layout slot yet
- `blog-inline` — blog detail page (future slice)
- `home-section-*` — CMS sections, not ad slots
- `home-promo-strip` — rendered via existing `CmsBanner`, not `AdHost`

---

## AdHost Behaviour

1. Resolves `placementId` from `shared/placementRegistry.js`
2. Loads slots from `AdSlotsContext`
3. Matches by `slotId` (supports indexed patterns e.g. `jobs-infeed-5`)
4. Filters: `active`, `status === 'active'`, `startDate`, `endDate`
5. **No match → returns `null`** (no empty boxes on public site)
6. **Image creative** when `imageUrl` is set
7. **AdSense fallback** via `AdBanner` when slot exists but no image (backward compatible; prod returns `null` without AdSense config)
8. **Preview mode** (`?previewAd=blog-header`): bypasses schedule/active checks; uses `sessionStorage` for draft/inactive ads; smooth scroll + yellow ring pulse for 4s

Anchor format: `id="ad-blog-header"`, `id="ad-home-top"`, etc.

---

## Admin Changes

- Table actions: **Edit | Preview | Delete**
- Preview URL: `{APP_BASE}{previewRoute}?previewAd={placementId}`
- Placement dropdown uses `getSelectableAdPlacementsForPage()` — only wired ad placements
- CMS sections and unwired placements cannot be selected

---

## Build & Registry Verification

```bash
npm run verify:registry   # PASS — 71 pages, 19 placements, 15 wired slots
cd client && npm run build  # PASS (7.3s)
```

---

## Manual Verification

### Blog header (verified in browser)

1. Admin → Advertisements → create **Blog → Header Banner** with `imageUrl`, `targetUrl`, active
2. Click **Preview** → opens `/blog?previewAd=blog-header`
3. Page scrolls to `#ad-blog-header`
4. Yellow pulse highlight + “Advertisement preview” label
5. Image creative visible with click-through link

**Screenshot captured:** Blog preview with highlight (session test, 2026-07-13).

### Additional checks

| Check | Expected | Result |
|-------|----------|--------|
| Preview URL format | `/blog?previewAd=blog-header` | ✅ |
| Anchor ID | `ad-blog-header` | ✅ |
| Highlight animation | Yellow ring + pulse ~4s | ✅ |
| No ad / outside schedule | `null` (no placeholder) | ✅ |
| API returns active slots | `GET /api/monetization/ad-slots` | ✅ |
| Unwired placement in admin | Not in placement dropdown | ✅ |

### Recommended QA (Home, Jobs, Admissions)

Repeat preview flow for:

- Home: `/?previewAd=home-top`
- Jobs: `/jobs?previewAd=jobs-header`
- Admissions: `/admissions?previewAd=admissions-header`

Ensure `startDate` ≤ today for live (non-preview) visibility.

---

## C.6.4.4.1 Diagnostic Audit (Accepted)

Pipeline verified end-to-end: registry lookup, placement mapping, API response, `AdHost` rendering, preview scroll/highlight, and client-side filtering all behave as designed.

**Root cause of “preview works, public does not” (isolated case):** schedule boundary — `startDate` stored as UTC midnight (`2026-07-13T00:00:00.000Z`) while the browser clock at local Jul 13 02:07 PKT is still Jul 12 21:07 UTC, so `isSlotRenderable()` correctly rejects until UTC start time passes.

**No fix applied in this sprint.** Temporary diagnostics from C.6.4.4.1 have been removed.

### Known limitation — schedule date interpretation

| Topic | Current behaviour |
|-------|-------------------|
| Comparison | `Date.now()` vs ISO `startDate` / `endDate` (UTC instant) |
| Admin intent | “Start on Jul 13” may mean local calendar day |
| Preview | Bypasses schedule via `previewBypass` |
| Public API | Returns `active: true` slots; client applies schedule |

**Backlog (Date/Time Infrastructure milestone):** Shared canonical timezone/date utility for advertisement scheduling, admissions deadlines, scholarship deadlines, countdowns, and other calendar features. Until then, set `startDate` to the prior UTC day or earlier local evening when targeting a local calendar start date.

---

## Remaining TODOs (future slices)

| Item | Notes |
|------|-------|
| Date/Time Infrastructure | Canonical timezone utility for schedules, deadlines, countdowns (see limitation above) |
| `home-sidebar` | Registry entry exists; layout not wired |
| `blog-inline` | Blog post detail page in-feed placement |
| Server-side date filtering | Client filters today; optional API hardening |
| Impression/click tracking | Fields exist on model; no public beacon yet |
| HTML/affiliate creative types | Registry flags exist; only image path implemented |
| Dev AdSense placeholder | `AdBanner` shows dashed box in dev when no image — only when legacy AdSense slot configured |

---

## Backward Compatibility

- No changes to `AdSlotConfig` schema
- No route or slug changes
- Existing `slotId` values preserved (`home-top`, `jobs-infeed`, etc.)
- Hardcoded `AdBanner`/`AdInFeed` removed from listing pages; behaviour moved into `AdHost`
- `home-promo-strip` / CMS banners unchanged
