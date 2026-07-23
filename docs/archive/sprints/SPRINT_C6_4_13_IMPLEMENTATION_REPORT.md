# Sprint C.6.4.13 — Revision History & Version Compare

**Status:** Implemented  
**Date:** July 13, 2026

## Summary

A full revision system for the Page Builder: every successful **Save Draft** and **Publish** creates an immutable revision; admins can browse history, compare any two versions, preview without restoring, and restore (which appends a new revision). Draft and published timelines are tracked separately, with audit integration and paginated UI.

---

## Architecture

```
Admin Page Builder
  saveDraft / publish
       ↓
pageLayoutController
       ↓
createPageLayoutRevision (service)
       ↓
CmsPageLayoutRevision collection

Admin → Page Builder → History
       ↓
list / compare / preview / restore APIs
       ↓
AdminPageBuilderHistory + RevisionComparePanel
```

| Layer | Files |
|-------|-------|
| Shared diff | `shared/pageBuilderRevisionDiff.js` |
| Model | `server/src/models/CmsPageLayoutRevision.js` |
| Layout pointers | `server/src/models/CmsPageLayout.js` (`revisionCounter`, `currentDraftRevisionId`, `currentPublishedRevisionId`) |
| Service | `server/src/services/pageLayoutRevisionService.js` |
| Controllers | `pageLayoutController.js` (auto-create), `pageLayoutRevisionController.js` |
| Routes | `server/src/routes/admin.js` |
| Admin UI | `client/src/pages/Admin/AdminPageBuilderHistory.jsx`, `RevisionComparePanel.jsx` |
| API client | `client/src/services/adminContentApi.js` |
| Verify | `scripts/verify-page-builder-history.mjs` → `npm run verify:page-builder-history` |

---

## Revision Model

Collection: `CmsPageLayoutRevision`

| Field | Description |
|-------|-------------|
| `pageKey`, `locale` | Page identity |
| `version` | Monotonic integer per page+locale (unique index) |
| `action` | `draft_save` \| `publish` \| `restore` |
| `timeline` | `draft` \| `published` |
| `changeNote` | Optional user note |
| `reachedProduction` | `true` when action is publish |
| `isCurrentDraft` / `isCurrentPublished` | Pointers for “Current” badges |
| `restoredFromVersion` | Source version on restore |
| `snapshot` | Full point-in-time copy (blocks, SEO, metadata) |
| `createdBy`, `createdByEmail` | Actor |
| `layoutId` | Reference to `CmsPageLayout` |

**Never overwritten:** revisions are append-only (`create` only). Delete is optional and blocked for current or sole revision.

Version numbers come from atomic `$inc` on `CmsPageLayout.revisionCounter`.

---

## Compare Algorithm

Implemented in `shared/pageBuilderRevisionDiff.js` (used server-side for API and client-side in verify script).

1. Pick block arrays from snapshot (`draftBlocks` or `publishedBlocks` based on timeline).
2. Index blocks by `id`.
3. **Added** — ids in B not in A.
4. **Removed** — ids in A not in B.
5. **Moved** — same id, same config signature, different `order`.
6. **Modified** — same id, different type/enabled/config/globalBlockId/order.
7. **SEO** — compare `seoTitle`, `metaDescription`, `canonicalUrl`, `ogImageUrl`, `twitterCard`.
8. **Metadata** — compare `title`, `publishedAt`.

Compare is lazy-loaded in the UI only when two revisions are selected (`GET /revisions/compare`).

---

## Restore Flow

1. Admin confirms restore (prompt for optional note).
2. `POST /page-layouts/:pageKey/:locale/revisions/:revisionId/restore`
3. Load revision snapshot → validate blocks → apply to layout **draft** (+ SEO fields).
4. Save layout (does **not** auto-publish).
5. Create **new** revision with `action: restore`, `timeline: draft`, `restoredFromVersion`.
6. Audit: `cms.pageLayout.revision.restore`

Public site unchanged until user publishes from Page Builder.

---

## Storage Strategy

**Current:** full snapshots per revision (draft + published block arrays, SEO, metadata).

- Correctness-first; no deduplication yet.
- List endpoint strips heavy `snapshot.*Blocks` from list rows for pagination performance.
- Full snapshot loaded only for get/compare/preview/restore.

**Future:** content-addressable block blobs or JSON diff chains between revisions; document-only for now.

---

## Draft vs Published History

| Action | Timeline | `reachedProduction` |
|--------|----------|---------------------|
| Save Draft | `draft` | false |
| Publish | `published` | true |
| Restore | `draft` | false |

History UI filters: **All** \| **Draft timeline** \| **Published timeline**. Compare can target draft or published block arrays.

---

## Audit Integration

Each revision creation calls `logAudit` with:

- `action`: `cms.pageLayout.revision.{draft_save|publish|restore}`
- `targetType`: `cmsPageLayoutRevision`
- `metadata`: pageKey, locale, version, revisionAction, timeline, changeNote

Existing layout audit events (`cms.pageLayout.update`, `cms.pageLayout.publish`) remain.

---

## Safety

- **Restore:** `window.prompt` confirmation + optional note.
- **Delete revision:** `window.confirm`; rejected server-side if current or only revision.
- **Preview:** read-only modal; no layout mutation.

---

## Performance

- Paginated history (default 15, max 50 server-side).
- Compare fetched on demand when From/To selected.
- `RevisionComparePanel` memoizes change counts.
- List queries exclude block snapshots.

---

## Verification

```bash
npm run verify:page-builder-history
```

Checks: model, routes, auto-revision hooks, compare logic (add/remove/modify/move/SEO), version sequence validation, restore flow, UI, pagination, lazy compare, audit wiring, safety dialogs.

Client build: `cd client && npm run build`

### Manual QA checklist

1. Open About page in Page Builder.
2. Save Draft ×5 → History shows five `Draft Save` revisions (newest first).
3. Publish → `Publish` revision on published timeline with **Published** badge.
4. Edit Hero only → Compare previous revision → only Hero in **Modified**.
5. Restore Version 2 → draft matches v2; History shows new **Restore** revision (v6).
6. Preview Version 3 → public site unchanged.
7. Publish restored version → public runtime updates.

---

## Future Improvements

- Diff-based storage and snapshot deduplication
- Inline change notes on Save Draft / Publish in editor
- Publish-from-history (“publish this revision”) with dedicated confirmation
- Per-field rich diff for block config (not just “configuration changed”)
- Revision labels/tags and full-text search
- Permissions for restore vs view-only
- Scheduled publish from a historical revision

---

## Out of Scope (per sprint)

Responsive layout controls, AI generation, scheduling, localization, permissions, collaborative editing, user documentation.
