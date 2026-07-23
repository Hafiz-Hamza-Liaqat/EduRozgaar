# Sprint C.6.4.15 — Production Hardening & Enterprise Readiness

**Status:** Implemented  
**Date:** July 13, 2026

## Summary

Hardened the Page Builder for production scale: accessibility audits, SEO resolution at runtime, debounced autosave with offline recovery, editor request guards, diagnostics panel, performance patterns (memoization, lazy-loaded inspector), and optimized images. All changes are additive; draft/publish workflow unchanged.

---

## Architecture

```
Editor (AdminPageBuilder)
  ├── usePageBuilderDraft (baseline + dirty)
  ├── usePageBuilderAutosave (15s debounce, generation token)
  ├── usePageBuilderRecovery (localStorage prompt)
  └── PageBuilderDiagnosticsPanel
        └── computePageBuilderDiagnostics (shared)

Runtime (PageBuilderPageView)
  ├── resolvePageBuilderSeo (canonical, OG, Twitter, meta fallbacks)
  ├── dedupeStructuredData (single FAQPage JSON-LD)
  └── ResolvedBlockListRenderer → BlockLayoutShell → blocks

Shared validation
  ├── pageBuilderAccessibility.js
  ├── pageBuilderSeo.js
  ├── pageBuilderDiagnostics.js
  └── pageBuilderRecovery.js
```

---

## Files Added

| File | Purpose |
|------|---------|
| `shared/pageBuilderAccessibility.js` | Per-block and page a11y audit rules |
| `shared/pageBuilderSeo.js` | SEO resolution, OG image extraction, JSON-LD dedupe |
| `shared/pageBuilderDiagnostics.js` | Diagnostics aggregation |
| `shared/pageBuilderRecovery.js` | localStorage crash recovery |
| `client/src/hooks/usePageBuilderAutosave.js` | Debounced autosave |
| `client/src/hooks/usePageBuilderRecovery.js` | Recovery prompt hook |
| `client/src/components/pageBuilder/PageBuilderDiagnosticsPanel.jsx` | Diagnostics UI |
| `client/src/components/pageBuilder/OptimizedBlockImage.jsx` | Lazy/async images + CLS hints |
| `scripts/verify-page-builder-production.mjs` | Production verification |
| `docs/SPRINT_C6_4_15_IMPLEMENTATION_REPORT.md` | This document |

## Files Modified

| File | Change |
|------|--------|
| `shared/pageBuilderEditorOps.js` | Snapshot includes `metadata` + `globalBlockId` for dirty tracking |
| `shared/blockValidation.js` | Layout + accessibility errors block publish |
| `client/.../PageBuilderPageView.jsx` | Hardened SEO, `<main>`, breadcrumb list semantics |
| `client/.../blocks/index.jsx` | A11y fixes (Hero h2, FAQ accordion, focus rings), OptimizedBlockImage, FAQ JSON-LD removed from block |
| `client/.../BlockRenderer.jsx` | Already memoized (C.6.4.14) |
| `client/.../SortableBlockRow.jsx` | Lazy-loaded `BlockInspector` |
| `client/.../AdminPageBuilder.jsx` | Autosave, recovery, diagnostics, in-flight guards |
| `client/src/hooks/usePageBuilderDraft.js` | Exposes `baselineSnapshot` |
| `package.json` | `verify:page-builder-production` script |

---

## Accessibility

### Audit (`auditBlockAccessibility` / `auditPageAccessibility`)

| Block | Checks |
|-------|--------|
| Hero | Headline required; CTA label/URL pairs |
| Rich text | Non-empty content |
| CTA | Button text + URL |
| FAQ | Q/A required per item |
| Gallery | Alt text on content images |
| Feature cards | Link/title warnings |
| Logo grid | Alt or decorative flag |
| Newsletter | Section title warning |

### Runtime fixes

- Page-level **sr-only h1**; Hero uses **h2** (no duplicate h1)
- FAQ: `aria-expanded`, `aria-controls`, `role="region"`, `hidden` panel
- Focus-visible rings on CTAs and accordion buttons
- Breadcrumb as semantic `<ol>` with `aria-current="page"`
- `<main id="page-builder-main">` landmark

### Publish gate

Accessibility errors are merged into `getPageValidationSummary` → blocks publish when fixed.

---

## SEO Hardening

`resolvePageBuilderSeo()` provides:

| Field | Source priority |
|-------|-----------------|
| Title | `seoTitle` → `title` → fallback |
| Description | `metaDescription` → hero subheadline → rich text → CTA |
| Canonical | layout field → CMS fallback → page path |
| OG image | layout → blocks (hero/gallery/cards) → site default |
| Twitter card | layout → `summary_large_image` default |
| Robots | `noindex` on preview; `index, follow` on published |

**Structured data:** FAQ JSON-LD collected once at page level via `collectFaqStructuredData` + `dedupeStructuredData` (no per-block Helmet duplicates).

**Validation:** `validatePageBuilderSeo`, `validateJsonLdSchema`, `validateBreadcrumbItems`.

---

## Performance

| Technique | Where |
|-----------|--------|
| `React.memo` on `BlockRenderer`, `BlockLayoutShell`, block rows | Runtime |
| `useMemo` on SEO + diagnostics | Page shell / editor |
| Lazy `import()` for `BlockInspector` | Editor only chunk split |
| `OptimizedBlockImage` lazy + `decoding="async"` | Gallery, cards, logos |
| Per-block reference equality | Only changed block re-renders in editor |

---

## Autosave & Recovery

### Autosave (`usePageBuilderAutosave`)

- Default **15s** debounce after last change
- Only when **dirty**, **synced**, not loading/saving/publishing
- **Generation token** (`bumpManualSave`) prevents autosave overwriting manual save
- Status: pending → saving → saved | offline | error
- Writes local recovery copy on dirty; clears on successful server save

### Recovery (`usePageBuilderRecovery`)

- Key: `pb-draft-recovery:{pageKey}:{locale}`
- On load, if local snapshot ≠ server baseline → prompt
- User must **Restore** or **Discard** explicitly

### Editor reliability

- `saveInFlightRef` / `publishInFlightRef` prevent double requests
- All action buttons disabled while `busy`

---

## Diagnostics Panel

Collapsible **Diagnostics** section shows:

- Block counts (total / enabled / disabled / global refs)
- Render weight estimate + JSON size (KB)
- Validation errors & warnings
- Accessibility errors & warnings
- SEO issues
- Missing images / alt text / suspicious links
- Duplicate block ID detection
- **canPublish** aggregate flag

---

## Verification Results

```text
npm run verify:page-builder-production   → 32 passed
npm run verify:page-builder-layout       → 24 passed
npm run verify:page-builder-history      → 21 passed
npm run verify:block-templates           → 19 passed (PASS)
npm run verify:page-builder-dnd          → 30 passed (PASS)
npm run verify:page-builder-draft        → 9 scenarios PASS
npm run verify:blocks                    → 16 blocks PASS
npm run verify:registry                  → PASS
cd client && npm run build               → PASS (864 modules)
```

---

## Accessibility Checklist (Manual QA)

- [ ] Tab through FAQ accordion — focus visible, Enter toggles
- [ ] Screen reader: one h1 (sr-only), section h2s for blocks
- [ ] Gallery without alt → validation error, publish blocked
- [ ] Preview mode: `noindex` in document head
- [ ] Reduced motion: block animations still respect OS setting (C.6.4.14)

## SEO Checklist (Manual QA)

- [ ] Published About page: canonical, og:image, meta description present
- [ ] Page with FAQ block: single FAQPage JSON-LD in view-source
- [ ] Draft preview `?pageBuilderPreview=1`: robots noindex
- [ ] OG image auto-picked from hero background when layout OG empty

## Autosave / Recovery QA

- [ ] Edit block → wait 15s → “Saved” indicator
- [ ] Manual save during autosave window → manual wins
- [ ] Close tab while dirty → reopen → recovery banner → Restore applies draft
- [ ] Publish does not trigger autosave mid-flight

---

## Known Limitations

- **WebP/srcset:** `OptimizedBlockImage` uses native lazy loading; responsive `srcset` requires CDN URL conventions (not auto-generated)
- **Autosave** does not save SEO fields separately (title + blocks only via existing API)
- **Recovery** is per-browser localStorage (not cross-device)
- **A11y contrast** warnings for custom backgrounds are heuristic, not live computed styles
- **Template references** count not tracked in diagnostics (always 0)
- **Parallax** flag exists but uses CSS `background-attachment: fixed` only

---

## Future Roadmap

- Server-side autosave conflict detection (ETag / version)
- Cross-tab draft sync via BroadcastChannel
- Automated axe-core CI pass on pilot pages
- CDN-aware srcset builder
- SEO field editor in Page Builder admin
- Real-time collaborative editing (explicitly out of scope for this sprint)

---

## Out of Scope (unchanged)

AI generation, collaboration, permissions, scheduling, ads, slugs, routing, theme redesign, new block types.
