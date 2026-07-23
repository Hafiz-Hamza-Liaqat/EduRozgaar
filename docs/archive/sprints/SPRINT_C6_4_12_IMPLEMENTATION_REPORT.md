# Sprint C.6.4.12 — Block Templates & Global Blocks

**Status:** Implemented  
**Date:** 2026-07-13

## Summary

Two complementary reuse systems integrated with the existing Page Builder:

| System | Behavior | Storage |
|--------|----------|---------|
| **Block Templates** | Copy-on-insert; edits never sync back | `CmsBlockTemplate` |
| **Global Blocks** | Shared content; edits propagate to all pages | `CmsGlobalBlock` + `globalBlockId` on page blocks |

**Unchanged:** `blockRegistry.js`, block renderers, `BlockRenderer` component map, public API contracts for page layouts, draft/publish workflow, DnD editor.

## Architecture

```
Admin
├── /admin/page-builder              — insert from Types | Templates | Global
├── /admin/page-builder/templates    — template library CRUD
└── /admin/page-builder/global-blocks — global library + usage panel

Page block (in draftBlocks / publishedBlocks)
├── Normal: { id, type, config, ... }
└── Global: { id, type, globalBlockId, config: {} }

Runtime
Page → collectGlobalBlockIds → batch fetch → resolveBlocksForRender → BlockRenderer
```

## Storage Model

### CmsBlockTemplate
- `name`, `category`, `description`, `blockType`, `config`, `previewImageUrl`, `favorite`

### CmsGlobalBlock
- `name`, `description`, `blockType`, `config`, `enabled`

### Page block extension
- Optional `globalBlockId` on embedded `pageBlockSchema` (backward compatible)

## Runtime Resolution Flow

1. `ResolvedBlockListRenderer` collects `globalBlockId` values from page blocks.
2. Batch fetch via `GET /api/cms/site/global-blocks?ids=…` (public) or admin batch endpoint (editor/preview).
3. In-memory cache in `useGlobalBlocks.js` avoids duplicate requests.
4. `resolveBlocksForRender` merges global config into page blocks.
5. Missing or disabled globals → block skipped (no crash, no blank page).

## Usage Tracking

`globalBlockUsageService.js` scans `CmsPageLayout` draft and published blocks for `globalBlockId` references.

- Shown on Global Blocks admin list (`usageCount`)
- Detail panel lists pages with clickable links to Page Builder
- Delete returns **409** when in use; `?force=1` allows forced delete

## Editor Features

### Add block tabs
- **Block Types** — existing registry types
- **Templates** — search, category filter, insert (new ID + copied config)
- **Global Blocks** — search, insert reference only

### Block toolbar
- **Save as Template** — modal (name, category, description, preview image)
- **Convert to Global** — creates global block + links page block
- **Detach** — copies global config locally, removes `globalBlockId`
- **Duplicate** — unchanged (C.6.4.11)

### Validation
- Global blocks validated on save (server + shared helpers)
- Pages inherit validation via resolved global config
- Publish blocked when referenced globals are invalid/disabled/missing

## Performance

- Batch global block fetch (single request per unique ID set)
- In-memory cache across editor/preview renders
- `React.memo` on `ResolvedBlockListRenderer`
- Validation uses shared `globalMap` — no per-block API calls

## Files Changed

| Area | Files |
|------|-------|
| Shared | `pageBuilderTemplates.js`, `pageBuilderGlobalBlocks.js`, `blockSchema.js`, `blockValidation.js` |
| Server | `CmsBlockTemplate.js`, `CmsGlobalBlock.js`, `blockTemplateController.js`, `globalBlockController.js`, `globalBlockUsageService.js`, `CmsPageLayout.js`, `pageLayoutController.js`, `admin.js`, `cms.js` |
| Client | `useGlobalBlocks.js`, `ResolvedBlockListRenderer.jsx`, `BlockTemplateSaveModal.jsx`, `AdminBlockEditor.jsx`, `SortableBlockRow.jsx`, `AdminPageBuilder.jsx`, `PageBuilderPageView.jsx`, `AdminBlockTemplates.jsx`, `AdminGlobalBlocks.jsx`, `adminContentApi.js`, `siteContentApi.js`, routes, nav |

## Verification

```text
npm run verify:block-templates       → PASS (19 checks)
npm run verify:page-builder-dnd      → PASS
npm run verify:page-builder-draft    → PASS
npm run verify:blocks                → PASS
npm run verify:registry              → PASS
cd client && npm run build           → PASS
```

## Known Limitations

- No revision history for templates/globals (C.6.4.13)
- Convert to Global uses `window.prompt` for name (no custom modal)
- Template preview image stored but not rendered in picker UI yet
- Usage count is computed on read (not denormalized cache)
- No locale-specific global blocks (single config per global block)

## Future Extension Points

- **C.6.4.13** — Revision history & version compare for globals
- Template preview thumbnails in insert UI
- Favorite templates pinned in insert tab
- Locale-scoped global block variants
- Webhook/cache invalidation when global block updates
