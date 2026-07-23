# Sprint C.6.4.7.1 — Homepage Advertisement Placement Improvements (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Reposition homepage banner ads; CMS footer promotional column

---

## Summary

| Deliverable | Status |
|-------------|--------|
| Top banner immediately after Hero (`home-top`) | ✅ |
| Bottom banner immediately before site Footer (`home-footer`) | ✅ |
| Reused existing registry placement IDs | ✅ |
| Both use `AdHost` (preview, tracking, limits unchanged) | ✅ |
| Registry / placement verification | ✅ PASS |
| Footer promotional column via Site CMS | ✅ |
| Graceful hide when promo not configured | ✅ |
| Client build | ✅ PASS |

---

## Homepage Ad Placements

Reused existing registry IDs — no new placement IDs required.

| Placement ID | Position | Registry slot |
|--------------|----------|---------------|
| `home-top` | Immediately after Hero section | `home-top` |
| `home-footer` | Last block in homepage content, before `<Footer />` | `home-footer` |

### Page flow (after change)

```
CMS promo strip (if banners configured)
  ↓
Hero
  ↓
home-top (AdHost)          ← moved here from mid-page
  ↓
Homepage content sections
  ↓
home-mid-1 (in-feed, unchanged)
  ↓
Newsletter (if enabled)
  ↓
home-footer (AdHost)       ← moved to end of page content
  ↓
Site Footer (MainLayout)
```

### What did NOT change

- `AdHost`, tracking, limits, preview session logic — untouched
- `placementRegistry.js` structure / validation logic — untouched (descriptions updated only)
- `home-mid-1` inline placement — retained between content sections

---

## Footer Promotional Column

### CMS schema (`CmsNavigation.promoColumn`)

| Field | Purpose |
|-------|---------|
| `enabled` | Toggle (default true when editing) |
| `title`, `titleUr`, `titleAr` | Column heading |
| `description`, `descriptionUr`, `descriptionAr` | Body copy |
| `ctaLabel`, `ctaLabelUr`, `ctaLabelAr` | Button text |
| `ctaUrl`, `ctaExternal` | Link target |
| `imageUrl` | Optional image |
| `icon` | Optional short text badge when no image |

### Admin

**Site CMS → Footer tab → Promotional column** editor added in `AdminSiteCms.jsx`.

Save + publish footer navigation as before.

### Public rendering

- `FooterPromoColumn.jsx` renders in the previously unused grid column (before newsletter).
- Shown only when `hasFooterPromoContent()` is true (title, description, CTA pair, image, or icon).
- Hidden when empty or `enabled: false`.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/pages/Home/Home.jsx` | Repositioned `home-top` and `home-footer` AdHosts |
| `shared/placementRegistry.js` | Updated placement descriptions (metadata only) |
| `server/src/models/CmsNavigation.js` | Added `promoColumn` sub-schema |
| `server/src/controllers/cmsController.js` | Persist `promoColumn` on footer nav upsert |
| `client/src/utils/cmsNav.js` | `resolvePromoField`, `hasFooterPromoContent` |
| `client/src/components/layout/FooterPromoColumn.jsx` | New promo renderer |
| `client/src/components/layout/Footer.jsx` | Conditional promo column |
| `client/src/pages/Admin/AdminSiteCms.jsx` | Footer promo editor |

---

## Verification

```bash
npm run verify:registry   # PASS — home-top & home-footer AdHost wired
cd client && npm run build   # PASS
```

### Manual checks

1. **Home top banner** — Visit `/`; ad slot appears directly under hero search/CTA area.
2. **Home bottom banner** — Scroll to bottom of homepage content; banner appears above dark site footer.
3. **Preview** — Admin → Advertisements → Preview on `home-top` or `home-footer`; scroll/highlight works.
4. **Tracking** — Impressions fire on 50% viewport intersection; clicks use existing beacon path.
5. **Footer promo** — Site CMS → Footer → fill promotional column → publish → column appears site-wide.
6. **Footer promo empty** — Clear all promo fields → column not rendered.

---

## Notes

- Bottom banner is the last element inside `Home.jsx`; the global `Footer` component in `MainLayout` follows immediately after.
- Promo column appears on all pages using the site footer, not homepage-only — appropriate for a global footer CMS field.
