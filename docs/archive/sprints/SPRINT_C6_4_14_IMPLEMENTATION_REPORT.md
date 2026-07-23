# Sprint C.6.4.14 — Responsive Layout Controls & Advanced Styling

**Status:** Implemented  
**Date:** July 13, 2026

## Summary

Page Builder blocks are now designer-ready with per-block responsive visibility, container width, spacing presets, backgrounds, typography overrides, responsive grid columns, enter animations, and theme-linked style presets. Settings live in additive `block.metadata.layout` — legacy pages render unchanged.

---

## Architecture

```
block.metadata.layout (additive JSON)
        ↓
shared/designTokens.js + shared/pageBuilderLayout.js
        ↓
BlockLayoutShell (runtime) ← BlockRenderer (memoized)
        ↓
Block components (content only; SectionShell respects layout context)

Admin editor:
SortableBlockRow → BlockInspector (collapsible panels)
        ↓
Live preview via existing ResolvedBlockListRenderer
```

No CMS API, routing, slug, ad, or placement changes.

---

## Storage Model (Backward Compatible)

Layout settings stored on each block:

```javascript
block.metadata.layout = {
  visibility: { desktop, tablet, mobile },
  containerWidth: 'contained' | 'wide' | 'full',
  spacing: { paddingTop, paddingBottom, marginTop, marginBottom }, // preset keys
  background: { type, color, gradientFrom, gradientTo, imageUrl, overlayOpacity, parallax },
  typography: { headingSize, bodySize, alignment, weight, maxTextWidth },
  grid: { desktop, tablet, mobile }, // grid blocks only
  animation: 'none' | 'fade' | 'slide-up' | 'zoom',
  stylePreset: 'default' | 'primary' | 'secondary' | 'light' | 'dark' | 'accent',
}
```

Blocks without `metadata.layout` receive defaults at read time (same visual result as before).

---

## Design Tokens

**File:** `shared/designTokens.js`

| Category | Tokens |
|----------|--------|
| Spacing | `none`, `xs`, `s`, `m`, `l`, `xl` → pixel map |
| Container | `contained` → `max-w-screen-xl`, `wide` → `max-w-screen-2xl`, `full` → `w-full` |
| Style presets | Theme Tailwind classes (`bg-primary/5`, `bg-secondary`, etc.) |
| Typography | Heading/body size, align, weight, max-width class maps |
| Animation | Enter class names + CSS in `index.css` |
| Grid | Column options 1–6 per breakpoint |

No raw Tailwind exposed in the inspector UI.

---

## Runtime

**`BlockLayoutShell`** applies:

1. Visibility (`hidden md:block`, etc.)
2. Margin (inline from spacing tokens)
3. Background (solid / gradient / image + overlay)
4. Container width + horizontal padding
5. Inner padding + typography classes
6. Style preset surface classes
7. IntersectionObserver enter animation (`useBlockEnterAnimation`)

**`prefers-reduced-motion`:** animations disabled via CSS media query.

**`BlockLayoutContext`:** inner `SectionShell` skips duplicate `max-w-6xl` when shell owns the container.

---

## Responsive Grid

Grid blocks: `feature-cards`, `gallery`, `logo-grid`, `student-resources`.

- Inspector: Desktop / Tablet / Mobile column selects
- Validation: `tablet ≤ desktop`, `mobile ≤ tablet`
- Legacy gallery `layout: grid-2|3|4` still maps to grid counts when `metadata.layout.grid` absent
- Legacy feature-cards `columns` config still maps when custom grid not set

**New block:** `logo-grid` (16th registry entry) for partner/client logos.

---

## Block Inspector

**File:** `client/src/components/pageBuilder/BlockInspector.jsx`

Collapsible panels:

| Panel | Controls |
|-------|----------|
| Content | Existing block config fields |
| Layout | Visibility, container width, grid columns |
| Spacing | Padding/margin presets |
| Background | Solid, gradient, image, overlay, parallax flag |
| Typography | Heading/body size, align, weight, max width |
| Advanced | Style preset, animation |

Replaces flat `BlockConfigFields` in expanded block rows.

---

## Validation

**`validateBlockLayoutSettings`** in `shared/pageBuilderLayout.js`, integrated in `shared/blockValidation.js`:

- All breakpoints hidden → error
- Invalid spacing preset → normalized to default
- Invalid hex colors → error
- Image background without URL → error
- Impossible grid column order → error
- Low contrast solid background → warning (AA check)

---

## Performance

- `BlockRenderer` + `BlockLayoutShell` + `SortableBlockRow` use `React.memo` with reference equality on `block`
- `useBlockLayoutPresentation` memoizes style resolution per block id + layout metadata
- Compare/preview unchanged; only edited block object reference changes in editor

---

## Accessibility

- Decorative images: `alt=""` where appropriate (feature card icons, optional logos)
- Content images: alt required (gallery, logo-grid validation)
- Focus rings on inspector controls (`focus-visible:ring-primary`)
- Reduced motion supported
- Contrast warnings for custom solid backgrounds

---

## Files Added

| File | Purpose |
|------|---------|
| `shared/designTokens.js` | Design token definitions |
| `shared/pageBuilderLayout.js` | Layout normalize, validate, resolve |
| `client/.../BlockLayoutShell.jsx` | Runtime layout wrapper |
| `client/.../BlockLayoutContext.jsx` | Container context for inner blocks |
| `client/.../BlockInspector.jsx` | Collapsible settings UI |
| `client/.../useBlockEnterAnimation.js` | IntersectionObserver animations |
| `client/.../useBlockLayoutPresentation.js` | Memoized style resolver |
| `scripts/verify-page-builder-layout.mjs` | Verification script |
| `docs/SPRINT_C6_4_14_IMPLEMENTATION_REPORT.md` | This document |

## Files Modified

| File | Change |
|------|--------|
| `shared/blockRegistry.js` | Added `logo-grid` block |
| `shared/blockValidation.js` | Layout validation integration |
| `client/.../BlockRenderer.jsx` | Layout shell + memo |
| `client/.../SortableBlockRow.jsx` | BlockInspector integration |
| `client/.../blocks/index.jsx` | Responsive grids, LogoGridBlock, layout context |
| `client/.../blockComponentMap.js` | LogoGridBlock mapping |
| `client/src/index.css` | PB animation keyframes + reduced motion |
| `client/tailwind.config.js` | Safelist grid/container classes |
| `package.json` | `verify:page-builder-layout` script |

---

## Verification Results

```bash
npm run verify:page-builder-layout   # 24 passed
npm run verify:blocks                # 16 blocks, 16 renderers PASS
npm run verify:registry              # PASS
npm run verify:page-builder-history  # 21 passed
cd client && npm run build           # PASS
```

---

## Manual QA Checklist

1. Open Page Builder → expand a Hero block → confirm **Content / Layout / Spacing / …** panels.
2. Uncheck **Mobile** visibility → live preview hides block below `md` (resize devtools).
3. Set container **Full width** → block spans viewport; **Contained** → `max-w-screen-xl`.
4. Set padding **XL** → increased vertical space in preview instantly.
5. Background **Gradient** → visible in preview; **Image** without URL → validation error.
6. Feature Cards → Grid Desktop 4 / Tablet 2 / Mobile 1 → resize preview columns.
7. Set Tablet 4 / Desktop 2 → validation error on block row.
8. Advanced → **Fade** animation → scroll block into view (respect reduced-motion in OS).
9. Save draft → reload → layout settings persist.
10. Publish → public pilot page renders with layout (legacy pages without metadata unchanged).
11. Templates / Global blocks / Revision history still work after layout edits.

---

## Future Improvements

- Visual breakpoint preview toggle in editor (desktop/tablet/mobile frame)
- Per-field rich diff for layout in revision compare
- Contrast picker with suggested accessible pairs
- Parallax implementation (flag exists, CSS `background-attachment: fixed` only)
- Layout presets (“Hero full-bleed”, “Narrow article”) saved as templates

---

## Out of Scope

Slug system, advertisements, placement registry, CMS APIs, runtime routing changes, permissions, AI generation, scheduling.
