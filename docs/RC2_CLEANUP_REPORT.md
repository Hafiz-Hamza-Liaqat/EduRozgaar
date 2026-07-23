# RC-2 — Cleanup Report

**Date:** 22 July 2026  
**Authority:** `docs/RC1_CODEBASE_CLEANUP_PLAN.md`  
**Policy:** Archive or delete only verified-safe items; never remove Career Intelligence, shared scoring, active verify suites, or production deployment scripts.

---

## Before / after repository statistics

| Metric | Before RC-2 archive | After RC-2 |
|--------|--------------------:|-----------:|
| Tracked-ish project files (excl. node_modules/.git/dist/.mongo) | 1269 | 1269* |
| `docs/` root markdown files | ~99+ mixed | **40** active |
| `docs/` all files (incl. archive) | 157 | 158 |
| `scripts/` root files | 86 | **53** |
| Archived sprint docs | 0 | **59** |
| Archived scripts (tree) | 0 | **29** |

\*File count similar because items were **moved** to archive trees rather than deleted (except three unused client modules). Docs root is substantially cleaner.

---

## Deleted (confirmed unused)

| Path | Justification |
|------|---------------|
| `client/src/constants/faq.js` | Never imported; FAQ uses i18n |
| `client/src/components/ads/AdSidebar.jsx` | Unused; `AdHost` + `AdBanner` are live |
| `client/src/components/ads/AdInFeed.jsx` | Same |

Also updated `client/src/components/ads/index.js` and `shared/placementRegistry.js` `componentHint` values → `AdHost`.

---

## Archived — scripts

### `scripts/archive/l265/`

- `l265-reindex-and-probe.mjs`

### `scripts/archive/sprint-verifiers/`

- `verify-sprint-a.mjs` … `verify-sprint-c6-4-2.mjs`
- `verify-phase1.mjs`, `verify-admin-stability.mjs`

### `scripts/archive/qa/`

- `qa-sprint-b2-*.mjs`, `stabilization-test.mjs`, `test-image-preview.mjs`, `test-import-phase3.mjs`, `test-import/`

### `scripts/archive/migration/`

- `fix-admin-imports.mjs`, `migrate-admin-selects.mjs`, `restore-cms-nav-defaults.mjs`
- `backup-mongodb.sh` (canonical remains `scripts/backup/mongo-backup.sh`; `docs/POST_LAUNCH.md` updated)

### `server/src/scripts/archive/l265/`

- `l265ReindexAndProbe.js`, `l265EnsureInternalJobs.js`, `l265JobTypes.js`  
  (import paths fixed for archive location)

### `server/src/scripts/archive/seed-legacy/`

- `seedPhase4.js` … `seedPhase9.js` (no phase6 in tree)
- `seedExamPrep.js`, `seedListings.js`

`server/package.json` legacy `seed:phase*` / `seed:listings` / `seed:exam-prep` scripts now point at archive paths. **Keep using** `seed:launch`, `seed:assessments`, `seed`.

---

## Archived — documentation

### `docs/archive/sprints/` (59 files)

All `SPRINT_A*`, `SPRINT_B*`, `SPRINT_C*` implementation/readiness reports moved from `docs/` root.

### `docs/archive/audits/`

- `POST_SPRINT_A_ADMIN_GAP_ANALYSIS.md`
- `ADMIN_PANEL_PRE_LAUNCH_AUDIT.md`
- (pre-impl audits that lived as `SPRINT_*_PRE_*` were included with sprint moves where applicable)

### `docs/archive/qa/`

- `qa-sprint-b2/` tree
- `_l265_verify_results.json` (generated artifact; L.2.6.5 verifier now writes here)

### Kept at `docs/` root (active)

Examples: `RC1_*`, `RC2_*`, `AI_BUDGET_POLICY.md`, `SPRINT_L2_*`, `L1_*` / `L2_*` audits, production/ops guides (`PRODUCTION_*`, `STAGING_*`, `BACKUP_*`, `SECURITY_*`, manuals, setup).

---

## Constants / duplication cleanup

| Item | Action |
|------|--------|
| Resume score duplicate | Already fixed RC-1 |
| Province labels | **RC-2** — `shared/constants/pakistan.js`; client re-exports; SEO slugs derived |
| Job categories seed vs client | Deferred (P2 align) — not deleted |

---

## Verifier compatibility

Active `scripts/verify-*.mjs` use `scripts/lib/docExists.mjs` so historical `docs/SPRINT_*.md` checks succeed when files live under `docs/archive/sprints|audits|qa`.

---

## Explicitly retained (do not remove)

- `shared/scoring/**`, Career Intelligence services  
- Active `npm run verify:*` gates (non-archived)  
- `scripts/backup/mongo-backup.sh`, deployment/ops docs  
- Deterministic AI placeholders (gated by AI Budget Policy)

---

## Deployment readiness checklist

| Item | Status |
|------|--------|
| Cleanup documented | **PASS** |
| Active production docs at docs root | **PASS** |
| Historical sprint/scripts archived | **PASS** |
| Verify suites PASS after archive | **PASS** |
| Production client build | **PASS** |
| Auth complete all roles (employer refresh/logout) | **PASS** |
| No P0/P1 remaining | **PASS** |
| Staging + Beta approval | **GO** |

---

**End of RC-2 Cleanup Report.**
