# C.6.4.9.2 — Page Builder Draft Isolation Fix

**Date:** 2026-07-13  
**Status:** Implemented  
**Scope:** Admin editor state only — no API, schema, or public runtime changes

---

## Problem

`AdminPageBuilder` used a single shared `draftBlocks` state and applied async GET responses without stale guards, allowing Page A blocks to display/save under Page B's `pageKey`.

## Isolation strategy

1. **`usePageBuilderDraft` hook** — owns draft state for exactly one active `(pageKey, locale)` load target.
2. **Immediate reset** — on `pageKey`/`locale` change: abort prior request, clear title/blocks/loaded markers, set `loading=true`.
3. **AbortController** — cancels in-flight GET when switching pages.
4. **Stale response guard** — `shouldApplyLoadResponse()` requires `activeLoadKey`, response `pageKey`, and non-aborted signal before updating UI.
5. **Sync tracking** — `loadedPageKey` + `loadedLocale` set only after a valid load; `synced` gates Save/Publish.
6. **Editor remount** — `key={pageKey:locale}` on `AdminBlockEditor` / preview shell.

## Save protection

Save/Publish blocked when:

- `loading === true`
- `loadedPageKey !== selectedPageKey` or locale mismatch
- Save response `pageKey` does not match selected page

## Files changed

| File | Change |
|------|--------|
| `client/src/hooks/pageBuilderDraftUtils.js` | Pure sync/stale helpers |
| `client/src/hooks/usePageBuilderDraft.js` | Isolated load/save state hook |
| `client/src/pages/Admin/AdminPageBuilder.jsx` | Uses hook + save guards |
| `client/src/services/adminContentApi.js` | Optional axios `config` (AbortSignal) on GET |
| `scripts/verify-page-builder-draft-isolation.mjs` | Regression checks |
| `package.json` | `verify:page-builder-draft` script |

## Verification

```bash
npm run verify:page-builder-draft   # PASS
npm run verify:blocks               # PASS
npm run verify:registry             # PASS
cd client && npm run build          # PASS
```

## Manual regression

1. Open About → add blocks → Save
2. Switch to Services → add different blocks → Save
3. Repeat for Privacy and Terms
4. Rapid-switch between all four — each reload shows only its own blocks
5. Refresh admin — drafts remain isolated per pageKey in MongoDB
6. Published layouts unchanged until Publish clicked
