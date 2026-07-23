# Sprint C.6.4.10 — Page Builder Block Library & Rich Editing

**Status:** Implemented  
**Date:** 2026-07-13

## Goal

Make the Page Builder capable of building real pages using production-ready blocks, focusing on block quality and editing (not layout manipulation).

## Summary

| Area | Delivered |
|------|-----------|
| Rich Text Block | TipTap editor (headings, bold/italic/underline, lists, links, images, code blocks); HTML stored in `htmlContent`; legacy `body` fallback preserved |
| Hero Block | Overlay opacity, primary/secondary CTAs, alignment, height presets |
| CTA Block | Button styles, optional icon, background color/image |
| Image / Gallery | Single + gallery modes, captions, alt text, responsive grid layouts, lazy loading |
| FAQ Block | Repeater editor, expand/collapse UI, Schema.org FAQ JSON-LD |
| Feature Cards Block | **New** block type — repeatable cards, grid columns, hover styles |
| Block Validation | Per-block error/warning/valid badges; page summary banner; publish blocked when invalid |
| Live Preview | Split-pane live preview updates immediately without save |

## Out of Scope (unchanged)

Drag-and-drop ordering, undo/redo, block templates, global blocks, scheduling, permissions, version history, localization improvements.

## Architecture

```
AdminPageBuilder
  ├── AdminBlockEditor (left)
  │     ├── ValidationSummaryBanner
  │     ├── BlockRow (status badges + custom fields)
  │     └── editors/
  │           ├── RichTextFieldEditor (TipTap)
  │           ├── FaqItemsEditor / GalleryItemsEditor / FeatureCardsEditor
  │           └── BlockCustomField router
  └── BlockListRenderer (right — live preview, no save required)

shared/
  ├── blockRegistry.js      — enhanced field defs + validate/getWarnings
  ├── blockValidation.js    — getBlockValidation, getPageValidationSummary
  └── blockSchema.js        — parseJsonArray, new field types (richtext, color, range)
```

## Block Registry Changes

- **15 block types** (was 14) — added `feature-cards`
- Hero, CTA, Gallery, FAQ, Rich Text fields expanded
- Custom `validate()` and `getWarnings()` on content blocks

## Dependencies Added

Client:

- `@tiptap/react`, `@tiptap/starter-kit`
- `@tiptap/extension-link`, `@tiptap/extension-underline`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`

Existing `dompurify` sanitizes rich HTML at render time.

## Backward Compatibility

- Rich Text: pages with only `body` (plain text) still render; new edits use `htmlContent`
- Hero: existing `headline` / `subheadline` / `backgroundImageUrl` unchanged
- FAQ / Gallery: still stored as JSON strings; new repeater UIs write the same shape
- Gallery: default `mode: gallery` preserves existing multi-image layouts

## Validation Rules (publish gate)

Publish is disabled when any **enabled** block has validation errors:

- Rich Text: `htmlContent` or legacy `body` required
- FAQ: ≥1 item; each question and answer required
- Gallery (single): image URL + alt text; (gallery): ≥1 image with URL + alt
- Feature Cards: ≥1 card with title

Warnings (publish allowed): incomplete CTAs, sparse FAQ, missing card descriptions, etc.

## Live Preview

- Default: split view on `xl` breakpoints (editor + sticky live preview)
- Toggle: **Hide live preview** / **Show live preview**
- **Full preview** mode: editor hidden, full-width preview (same as before, renamed)
- Preview reads in-memory `draftBlocks` — no save required

## Files Touched

| Path | Change |
|------|--------|
| `shared/blockRegistry.js` | Enhanced blocks + feature-cards |
| `shared/blockSchema.js` | Field types, `parseJsonArray` |
| `shared/blockValidation.js` | **New** — validation summary API |
| `client/src/components/pageBuilder/editors/*` | **New** — TipTap + repeater editors |
| `client/src/components/pageBuilder/AdminBlockEditor.jsx` | Validation UX, custom fields |
| `client/src/components/pageBuilder/blocks/index.jsx` | Production renderers |
| `client/src/components/pageBuilder/blockComponentMap.js` | FeatureCardsBlock |
| `client/src/pages/Admin/AdminPageBuilder.jsx` | Split preview, publish guard |
| `client/package.json` | TipTap dependencies |

## Verification

```bash
npm run verify:blocks      # 15 blocks / 15 renderers — PASS
npm run verify:registry    # PASS
npm run verify:page-builder-draft  # PASS
cd client && npm run build # PASS
```

## Manual Test Plan

1. Open `/admin/page-builder?pageKey=about&locale=en`
2. Add **Rich Text** block — use toolbar (headings, lists, link, image); confirm live preview updates without save
3. Add **Hero** — set overlay, CTAs, alignment, height; preview reflects changes
4. Add **FAQ** — add items via repeater; preview shows accordion; view page source for FAQ JSON-LD
5. Add **Feature Cards** — cards with icon/image, grid columns, hover style
6. Leave a required field empty — confirm Invalid badge and disabled Publish
7. Save draft → publish → verify public pilot page

## Suggested Next Sprints

- **C.6.4.11** — Drag-and-drop ordering (@dnd-kit)
- **C.6.4.12** — Reusable templates & global blocks
- **C.6.4.13** — Revision history & version compare
- **C.6.4.14** — Responsive layout controls & advanced block settings
- **C.6.4.15** — Production hardening (performance, a11y, SEO, testing)
