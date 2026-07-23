# C.6.4.9.1 — Page Builder Draft Isolation Audit (No Fixes)

**Date:** 2026-07-13  
**Status:** Audit only — no code changes  
**Symptom:** Draft blocks appear to leak / disappear across page keys (About → Services → Privacy → Terms)

---

## Verdict

**Root cause is frontend state isolation failure in `AdminPageBuilder.jsx`, not MongoDB schema and not server query filters.**

The admin editor keeps a **single shared `draftBlocks` React state** for all page keys, and `loadLayout()` applies GET responses **without verifying the response still matches the current `pageKey`**. Switching pages races loads and can cause Save to write **Page A’s blocks under Page B’s key** (or write `[]` over a previously loaded page).

Server `findOne({ pageKey, locale })` filters are correct. Live Mongo evidence matches this: **`privacy-policy` was never written**; only `about`, `services`, and `terms` documents exist.

---

## 1. MongoDB

### Live query result (2026-07-13)

| Metric | Value |
|--------|--------|
| `CmsPageLayout` document count | **3** |
| One document per `pageKey`? | **Yes** (among existing docs) |
| Unique index | `{ pageKey: 1, locale: 1 }` unique — correct |

### Documents present

| pageKey | locale | status | draftBlockCount | updatedAt (UTC) |
|---------|--------|--------|-----------------|-----------------|
| `about` | en | draft | 4 | 2026-07-12T22:25:31Z |
| `services` | en | draft | 6 | 2026-07-12T22:28:41Z |
| `terms` | en | draft | 3 | 2026-07-12T22:31:22Z |

### Documents missing

| pageKey | Present? |
|---------|----------|
| `privacy-policy` | **No document** |

### Audit log (cmsPageLayout)

| action | targetLabel | when |
|--------|-------------|------|
| create | `about:en` | 22:25:31Z |
| create | `services:en` | 22:28:41Z |
| create | `terms:en` | 22:31:22Z |
| update | `terms:en` | 22:31:25Z |

**No `privacy-policy:en` create or update exists.**  
So Privacy was never persisted under that `pageKey` (UI may have shown blocks from shared React state only).

---

## 2. API

### Routes

| Method | Path | pageKey source |
|--------|------|----------------|
| GET | `/admin/page-layouts/:pageKey` | `req.params.pageKey` |
| PUT | `/admin/page-layouts` | `req.body.pageKey` |
| POST | `/admin/page-layouts/:pageKey/:locale/publish` | `req.params.pageKey` |
| GET | `/admin/page-layouts/:pageKey/preview` | `req.params.pageKey` |

### Filters (correct)

```js
// get / preview / publish / upsert
CmsPageLayout.findOne({ pageKey, locale })
```

Upsert creates `new CmsPageLayout({ pageKey, locale })` when missing.  
It does **not** rewrite `pageKey` after load.  
There is **no delete** endpoint — missing Privacy doc cannot be explained by server delete.

### Conclusion (API)

**Server isolation by `pageKey` is correct.** Cross-page wipe cannot happen unless the **client sends the wrong `pageKey` and/or wrong `draftBlocks` in the PUT body**.

---

## 3. Frontend

### File: `client/src/pages/Admin/AdminPageBuilder.jsx`

| Concern | Finding |
|---------|---------|
| State keyed by `pageKey`? | **No** — one `draftBlocks` array for the whole editor |
| Cache/query keys include `pageKey`? | **N/A** — no React Query; plain `useState` + `useEffect` |
| Reload on page switch? | **Yes** — `loadLayout` depends on `[pageKey, locale]` |
| Stale response guard? | **No** — any in-flight GET can call `setDraftBlocks` after switch |
| Clear drafts on switch? | **No** — previous page’s blocks remain until GET returns |
| AbortController / request id? | **No** |

### Critical code path

```38:58:client/src/pages/Admin/AdminPageBuilder.jsx
  const loadLayout = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminContentApi.getPageLayout(pageKey, locale);
      setTitle(data.title || data.pageKey || pageKey);
      setDraftBlocks(reindexBlocks(data.draftBlocks || []));
      // ...
    } finally {
      setLoading(false);
    }
  }, [pageKey, locale, toast]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);
```

Problems:

1. **No check** that `data.pageKey === currentPageKey` when the promise resolves.
2. **No abort** of the previous request when `pageKey` changes.
3. On switch, UI still shows **previous page’s blocks** under the new page key until load finishes (or forever if user edits/saves first).

### Save path

```68:76:client/src/pages/Admin/AdminPageBuilder.jsx
      const { data } = await adminContentApi.savePageLayout({
        pageKey: pageKey.trim(),
        locale,
        title: title.trim() || pageKey.trim(),
        draftBlocks: reindexBlocks(draftBlocks),
      });
```

Save always sends **current `pageKey` + current `draftBlocks`**.  
Those two are not guaranteed to belong to the same logical page after a switch/race.

### `AdminBlockEditor`

Holds no pageKey; only mutates the parent’s `blocks` prop. Not the isolation boundary. Fine in isolation; inherits parent race.

---

## 4. Saving

| Check | Result |
|-------|--------|
| Save request includes `pageKey`? | **Yes** (`body.pageKey`) |
| Server writes matching document? | **Yes**, when `pageKey` in body is correct |
| Can save write Page A blocks to Page B? | **Yes**, if UI `pageKey` is B while `draftBlocks` still holds A’s blocks |
| Can save wipe a page? | **Yes**, if `draftBlocks` is `[]` (stale empty GET) and user hits Save |

Audit log confirms only `about`, `services`, `terms` writes — consistent with Privacy never receiving a successful PUT under `privacy-policy`.

---

## 5. Exact root cause

### Primary root cause

**`AdminPageBuilder` does not isolate draft state per `pageKey`.**

It uses:

- one mutable `draftBlocks` state shared across all pages
- async `loadLayout` without stale-response protection
- Save that trusts that shared state under whatever `pageKey` is currently selected

### Failure sequence matching the observed bug

**Episode A — “Privacy disappears while working on Terms”**

1. User builds Privacy blocks in React state (may or may not have saved).
2. User switches to Terms → `pageKey = 'terms'`, but `draftBlocks` still holds Privacy blocks until GET returns.
3. Either:
   - User saves too early → Privacy blocks written to **`terms`** document, **or**
   - Privacy was never PUT under `privacy-policy` (audit shows no such create).
4. GET `/page-layouts/terms` returns `[]` (new page) and clears UI; user adds Terms blocks and saves Terms.
5. User opens Privacy → GET returns synthetic empty (no Mongo doc) → **“Privacy draft disappeared.”**

**Episode B — “Editing Privacy makes Terms disappear”**

1. User on Terms with blocks in Mongo + UI.
2. Switch to Privacy → `loadLayout('privacy-policy')` starts; another in-flight `loadLayout('terms')` may still be open from earlier navigation.
3. Stale GET for Terms returning `[]` (or Privacy empty) resolves **after** user is on Privacy / after Terms was shown → `setDraftBlocks([])`.
4. User edits Privacy and saves, **or** switches back to Terms and saves while state is `[]` → PUT writes **empty `draftBlocks`** to the selected `pageKey` → that page’s draft is wiped.

Mongo today (`privacy-policy` missing, `terms` present) matches Episode A more closely than a server-side cross-document overwrite.

### What is NOT the root cause

| Suspect | Status |
|---------|--------|
| Missing unique index / one shared Mongo doc | **Ruled out** — 3 separate docs; unique `{pageKey,locale}` |
| Server `findOne` ignoring `pageKey` | **Ruled out** — filters correct |
| Block ID collisions across pages | **Unlikely** — IDs unique in DB; not used as document key |
| SlugService / Registry / AdHost | **Out of scope / untouched** |
| Publish copying drafts across pages | **Ruled out** — publish also filters by `pageKey` |

---

## Isolation scorecard

| Layer | Isolated by pageKey? | Notes |
|-------|----------------------|-------|
| MongoDB documents | Yes | One doc per `(pageKey, locale)` when saved |
| Admin GET/PUT/POST | Yes | Filters / body key correct |
| Admin React state | **No** | Shared `draftBlocks` |
| Load race safety | **No** | No abort / no response key check |
| Save safety | **No** | Can pair wrong blocks with current key |

---

## Recommended fix direction (do not implement in this slice)

1. Key draft state by `pageKey` (map or remount editor with `key={pageKey}`).
2. Abort or ignore stale `loadLayout` responses (`AbortController` or request generation token).
3. Clear or freeze editor until load for the new `pageKey` completes; disable Save while `loading`.
4. Optionally confirm PUT response `pageKey` matches the editor’s selected key before applying returned blocks.
5. Add a regression test: save A → switch to B → save B → reload A still has A’s blocks.

---

## Verification commands used

```bash
# Mongo inventory (server env with MONGO_URI)
# → count 3; pageKeys: about, services, terms; privacy-policy absent

# AuditLog targetType cmsPageLayout
# → creates only for about, services, terms
```

**No production code was changed in this audit.**
