# Sprint C.6.4.6 — Advertisement Impression & Click Tracking (Implementation Report)

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Public impression/click tracking, limit enforcement, admin CTR analytics  
**Backward compatibility:** Reuses existing `AdSlotConfig` fields; no schema changes

---

## Summary

Completed the advertisement monetization foundation with production-safe, fire-and-forget tracking. Impressions are counted once per page load when an ad enters the viewport; clicks are counted on creative link interaction. Admin sees Impressions, Clicks, and CTR immediately via list refresh.

| Deliverable | Status |
|-------------|--------|
| `POST /api/monetization/impression` | ✅ |
| `POST /api/monetization/click` | ✅ |
| IntersectionObserver impression (one per load) | ✅ |
| Click via `sendBeacon` / `fetch keepalive` | ✅ |
| Preview excluded from tracking | ✅ |
| Impression/click limits stop rendering | ✅ |
| Admin table: Impressions, Clicks, CTR | ✅ |
| Edit form analytics panel | ✅ |
| `npm run verify:ad-tracking` | ✅ |

---

## Architecture

```
Public page
  AdHost (IntersectionObserver ≥50% visible)
    → trackAdImpression() → POST /monetization/impression
  AdImageCreative (link click)
    → trackAdClick() → POST /monetization/click

Server
  monetizationController.trackAdImpression / trackAdClick
    → AdSlotConfig.findOneAndUpdate($inc)
    → rate-limited (adTrackingLimiter)

Admin
  listAdSlots → impressionCount, clickCount
  formatCtr(clicks, impressions) → "12.40%" or "—"
```

---

## API

### `POST /api/monetization/impression`

**Auth:** None (public)  
**Rate limit:** `adTrackingLimiter` (120/min prod, 300/min dev)

**Body:**
```json
{
  "slotId": "blog-header",
  "placementId": "blog-header",
  "pageId": "blog-list"
}
```

**Response (200):**
```json
{ "success": true, "slotId": "blog-header", "impressionCount": 42 }
```

**Response (404):** Slot not found, inactive, or impression limit reached.

### `POST /api/monetization/click`

Same shape; increments `clickCount`.

---

## Data Flow

1. `GET /monetization/ad-slots` returns active slots **within limits** (`isSlotWithinLimits`).
2. `AdHost` renders matching slot; `IntersectionObserver` fires once when ≥50% visible.
3. `trackAdImpression` sends beacon; server atomically increments `impressionCount`.
4. User clicks image link → `trackAdClick` fires before navigation (non-blocking).
5. Admin **Refresh** on Advertisements page shows updated counts.

---

## CTR Calculation

```
CTR = (clicks / impressions) × 100
```

- Display: `12.43%` (two decimal places)
- Zero impressions: `—`
- Implemented in `client/src/utils/adTracking.js` and `server/src/utils/adSlotLimits.js`

---

## Limit Enforcement

| Condition | Behaviour |
|-----------|-----------|
| `impressionCount >= impressionLimit` | Slot excluded from public API; impression POST returns 404 |
| `clickCount >= clickLimit` | Slot excluded from public API; click POST returns 404 |
| Records | Never deleted |

Client mirrors limits in `isSlotRenderable()` via `isSlotWithinLimits()`.

---

## Preview Exclusion

When `?previewAd=` is present on the URL:

- No impression beacons
- No click beacons
- Schedule/active bypass unchanged (existing preview behaviour)

---

## Performance Considerations

- Tracking is fire-and-forget; failures are silent (no console output)
- `sendBeacon` preferred; `fetch` with `keepalive` as fallback
- One impression key per `(slotId, placementId)` per browser tab session
- Observer disconnects after first qualified impression
- Public endpoints return minimal JSON (no admin fields)
- Atomic `$inc` avoids race conditions on concurrent events

---

## Files Changed

| File | Change |
|------|--------|
| `server/src/utils/adSlotLimits.js` | Limit + CTR helpers |
| `server/src/controllers/monetizationController.js` | Tracking endpoints; public slot filter |
| `server/src/routes/monetization.js` | POST routes + limiter |
| `server/src/middleware/rateLimit.js` | `adTrackingLimiter` |
| `client/src/utils/adTracking.js` | Beacon client + CTR format |
| `client/src/utils/adSlotUtils.js` | Client limit checks |
| `client/src/components/ads/AdHost.jsx` | IntersectionObserver |
| `client/src/components/ads/AdImageCreative.jsx` | Click tracking |
| `client/src/pages/Admin/AdminAdvertisements.jsx` | Analytics columns + edit panel |
| `client/src/i18n/locales/en/admin.json` | Labels |
| `scripts/verify-ad-tracking.mjs` | Verification script |
| `package.json` | `verify:ad-tracking` script |

---

## Regression Checklist

- [ ] Existing ads render without tracking configured
- [ ] Preview mode still scrolls/highlights; counts unchanged
- [ ] Schedule filtering unchanged (Date/Time Infrastructure deferred)
- [ ] Registry, routes, CMS, SlugService untouched
- [ ] Ads without limits behave as before
- [ ] Tracking failure does not hide advertisement

---

## Manual QA Checklist

1. Create active ad with image on `/blog` header
2. Visit `/blog` — scroll until ad visible; wait 2s
3. Admin → Advertisements → **Refresh** — Impressions ≥ 1
4. Click ad link — Refresh — Clicks ≥ 1, CTR shown
5. Set `impressionLimit` to current count — ad disappears on `/blog` (after refresh)
6. Open `/blog?previewAd=blog-header` — click ad — counts must not increase
7. Run `npm run verify:ad-tracking`

---

## Build & Verify

```bash
npm run verify:ad-tracking   # PASS
npm run verify:registry      # PASS
cd client && npm run build   # PASS
```

---

## Out of Scope (unchanged)

- Date/Time Infrastructure / schedule timezone fix
- Page Registry, Placement Registry, routing, CMS, Page Builder
- Separate analytics collection / event log table
- AdSense slot click tracking (image creatives only)
