# Sprint C.6.4.11 — Drag-and-Drop Page Builder (Production Implementation)

**Status:** Implemented  
**Date:** 2026-07-13

## Goal

Make the Page Builder editor production-grade with drag-and-drop ordering, editor UX improvements, dirty-state protection, and performance — without changing runtime, registry format, schema, APIs, or published rendering.

## Before / After Architecture

### Before (C.6.4.10)

```
AdminPageBuilder
  └── AdminBlockEditor
        ├── ↑ / ↓ buttons (move up/down)
        ├── plain block rows
        └── live preview (split pane)
```

### After (C.6.4.11)

```
AdminPageBuilder
  ├── usePageBuilderDraft (+ baseline snapshot, isDirty)
  ├── beforeunload + useBlocker guards
  └── AdminBlockEditor
        ├── DndContext (@dnd-kit)
        ├── SortableContext (stable block.id keys)
        ├── SortableBlockRow (memoized, drag handle only)
        ├── DragOverlay (lifted block)
        ├── Block toolbar (dup/delete/collapse/top/bottom/enable)
        └── live preview (unchanged path — BlockListRenderer)

shared/pageBuilderEditorOps.js  ← reorder, duplicate, dirty snapshot
shared/blockSchema.js           ← assignBlockOrder (drag-safe)
```

**Unchanged:** `blockRegistry.js`, block renderers, `BlockRenderer`, public runtime, Mongo schema, admin API routes, validation rules, TipTap editors.

## State Flow

1. **Load** — `usePageBuilderDraft` fetches layout → `reindexBlocks` → sets `baselineSnapshot`.
2. **Edit** — any change to `title` or `draftBlocks` → `isDirty` compares against baseline via JSON snapshot.
3. **Drag** — `onDragOver` calls `reorderBlocksByIds` → `assignBlockOrder` (no re-sort) → `onChange` → live preview updates immediately.
4. **Save / Publish** — `applySavedLayout` updates blocks + resets `baselineSnapshot` → `isDirty` false.

## Drag Lifecycle

| Phase | Behavior |
|-------|----------|
| `onDragStart` | Set `activeId`, screen-reader announcement |
| `onDragOver` | Reorder in state via stable IDs; show drop indicator line |
| `onDragEnd` | Finalize order, clear overlay |
| `onDragCancel` | Escape / cancel — restore announcement |

Drag activator is **handle only** (`setActivatorNodeRef` on ⋮⋮ button). Row body is not draggable.

## Dirty-State Lifecycle

Tracks changes to: title, block config, order, enabled state.

| Event | Action |
|-------|--------|
| Edit while dirty | Show **● Unsaved changes** |
| Page key / locale switch | `window.confirm` if dirty |
| In-app navigation | `useBlocker` + confirm |
| Tab close / refresh | `beforeunload` prompt |
| Save / Publish success | `baselineSnapshot` reset |

Collapse state is **UI-only** (`expandedIds` Set) — not in snapshot, not persisted.

## Performance Optimizations

| Technique | Where |
|-----------|--------|
| `React.memo` + custom `propsAreEqual` | `SortableBlockRow`, `BlockConfigFields` |
| `useMemo` for sorted blocks, validation | `AdminBlockEditor` |
| `useCallback` for handlers | `AdminBlockEditor`, `SortableBlockRow` |
| `blocksRef` during drag | Avoid stale closure on rapid `onDragOver` |
| `assignBlockOrder` vs `reindexBlocks` | Drag ops skip redundant sort pass |
| Stable `key={block.id}` | No index-based React keys |

Target: 50+ blocks remain usable; only dragged row + overlay animate.

## Accessibility

- **Keyboard:** `KeyboardSensor` + `sortableKeyboardCoordinates`
- **Touch:** `TouchSensor` with activation delay
- **ARIA:** drag handle labels, `aria-live` announcements, toolbar `role="toolbar"`, `aria-expanded` on collapse
- **Focus:** `focus-visible:ring-2` on all toolbar controls
- **Screen reader:** live region announces pick up, reorder, cancel

## Block Toolbar Actions

| Action | Behavior |
|--------|----------|
| Drag handle | Reorder via @dnd-kit |
| Duplicate | New ID, cloned config, inserted below |
| Delete | Remove + reindex |
| Collapse / Expand | UI-only, preview unchanged |
| Move to top / bottom | `assignBlockOrder` |
| Enable / Disable | Instant preview update |

## Bug Fix: Stable Ordering

`reindexBlocks` sorts by `order` before reassigning — which **undid** drag mutations when order fields were stale. Added `assignBlockOrder()` for position-based reorder, duplicate, and move operations.

## Files Changed

| Path | Change |
|------|--------|
| `shared/pageBuilderEditorOps.js` | **New** — reorder, duplicate, dirty snapshot, ID validation |
| `shared/blockSchema.js` | `assignBlockOrder()` |
| `client/package.json` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `client/src/components/pageBuilder/AdminBlockEditor.jsx` | DnD context, toolbar wiring |
| `client/src/components/pageBuilder/SortableBlockRow.jsx` | **New** — sortable row + overlay |
| `client/src/components/pageBuilder/BlockConfigFields.jsx` | **New** — memoized fields extract |
| `client/src/hooks/usePageBuilderDraft.js` | Baseline snapshot, `isDirty` |
| `client/src/pages/Admin/AdminPageBuilder.jsx` | Dirty guards, unsaved indicator |
| `scripts/verify-page-builder-dnd.mjs` | **New** |
| `package.json` | `verify:page-builder-dnd` script |

## Verification Results

```text
npm run verify:page-builder-dnd       → PASS (30 checks)
npm run verify:page-builder-draft     → PASS
npm run verify:blocks                 → PASS (15 blocks / 15 renderers)
npm run verify:registry               → PASS
cd client && npm run build            → PASS
```

## Known Limitations

- No undo/redo (deferred to future sprint)
- Drop indicator is a single insertion line (not multi-column)
- `window.confirm` for navigation guards (no custom modal yet)
- Collapse state resets on full page remount (by design — not persisted)

## Future Extension Points

- **C.6.4.12** — Templates & global blocks
- **C.6.4.13** — Revision history (pair with dirty snapshots)
- **C.6.4.14** — Responsive editor controls
- Custom unsaved-changes modal via existing `AdminConfirmDialog`
- Undo stack layered on `pageBuilderEditorOps`

## Manual QA Checklist

See sprint spec §11 — recommended smoke test at `/admin/page-builder?pageKey=about&locale=en`:

1. Add 5+ blocks, drag reorder, confirm live preview follows
2. Duplicate a Hero block — new ID, config copied
3. Switch page with unsaved edits — warning appears
4. Save → reload → order identical
5. Publish → public pilot page matches order
