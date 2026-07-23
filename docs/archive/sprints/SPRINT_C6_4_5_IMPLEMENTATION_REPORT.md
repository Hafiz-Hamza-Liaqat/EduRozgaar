# Sprint C.6.4.5 — CMS Block Picker Foundation (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Banner placement admin + API filter, homepage section parity, footer column editor  
**Follows:** C.6.4.4 (Ad rendering), C.6.4.4.1 (diagnostic audit accepted)

---

## Summary

Implemented Phase 4 from the C.6.4.3 pre-implementation audit: CMS placements are now registry-driven in admin, filterable on the public API, and editable for homepage sections and footer columns.

| Deliverable | Status |
|-------------|--------|
| Banner `placement` field in Site CMS admin | ✅ |
| Public banner API `?placement=` filter (default `homepage`) | ✅ |
| Admin banner list placement filter support | ✅ |
| Homepage `studentResources` admin + public CMS wiring | ✅ |
| Homepage `foreignStudyCountries` admin + public CMS wiring | ✅ |
| Homepage `newsletter` title/subtitle/enabled admin | ✅ |
| Footer column editor (nested links) | ✅ |
| Registry helper `getCmsBannerPlacements()` | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `shared/placementRegistry.js` | `getCmsBannerPlacements()` — maps `home-cms-banner` → stored `homepage` |
| `server/src/controllers/cmsController.js` | `listPublicBanners` + admin `listBanners` filter by `placement` |
| `client/src/services/siteContentApi.js` | `getBanners(locale, placement)` |
| `client/src/context/SiteContentContext.jsx` | Fetches banners with `placement=homepage` |
| `client/src/pages/Admin/AdminSiteCms.jsx` | Placement dropdown, section editors, `FooterColumnsEditor` |
| `client/src/pages/Home/Home.jsx` | CMS-first `studentResources` / `foreignStudyCountries` with i18n fallback |

---

## Banner Placement

- Admin Banners tab: placement dropdown from registry (`getCmsBannerPlacements()`)
- Table shows `placement` column
- Public `GET /cms/site/banners?locale=en&placement=homepage` — defaults to `homepage` for backward compatibility
- Existing banners without explicit placement continue to match (model default `homepage`)

---

## Homepage Section Parity

Admin Homepage tab now edits:

- **Student resources** — enable toggle + items (`label`, `description`, `path`, `icon`)
- **Foreign study countries** — enable toggle + items (`name`, `path`, `query`)
- **Newsletter** — enable toggle + title/subtitle

Public `Home.jsx` reads CMS sections first; falls back to hardcoded i18n arrays when CMS items are empty.

---

## Footer Columns

Footer tab includes nested column editor:

- Column: `title`, `titleUr`, `titleAr`
- Links per column: `label`, `labelUr`, `labelAr`, `path`

Uses existing `upsertNavigation` API — no backend schema changes.

---

## Backward Compatibility

- Default public banner placement remains `homepage`
- Empty CMS section items → existing hardcoded homepage content
- No MongoDB migrations required

---

## Out of Scope (C.6.4.3.6+)

- Full page builder / block renderer
- `CmsBannerStrip` component extraction from `Home.jsx`
- Additional banner placements on non-home pages
- CMS draft preview on public Home (`?preview=cms`)

---

## Verification

```bash
npm run verify:registry   # PASS
cd client && npm run build  # expected PASS
```

Manual QA:

1. Admin → Site CMS → Banners → create banner with placement **Home → CMS Promo Strip**
2. Publish banner → verify appears on `/` above hero
3. Admin → Homepage → add student resource item → save/publish → verify on `/`
4. Admin → Footer → add column with links → save/publish → verify in site footer
