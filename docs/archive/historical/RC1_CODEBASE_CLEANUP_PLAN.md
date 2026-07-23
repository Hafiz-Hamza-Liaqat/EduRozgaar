# RC-1 — Codebase Cleanup Plan

**Status:** Documentation only — **nothing deleted**  
**Date:** 22 July 2026  
**Related:** `docs/RC1_PLATFORM_VALIDATION_REPORT.md`

This plan lists cleanup candidates discovered during Release Candidate validation.  
Items are prioritized for a future hygiene sprint. Do **not** delete until product/ops confirms.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Remove or unify soon — causes drift / inconsistency |
| **P1** | Safe to archive after confirming unused |
| **P2** | Historical / optional; archive when convenient |
| **Keep** | Live surface — gate or label, do not delete without decision |

---

## 1. Duplicate scoring / constants (P0)

| Path | Justification | Action |
|------|---------------|--------|
| ~~`server/src/controllers/resumesController.js` `computeResumeScore`~~ | **Fixed in RC-1** — now uses `evaluateResumeQuality` | Verify no residual local formula |
| `client/src/constants/profileOptions.js` `PROVINCES` vs server seed/SEO province lists | Spelling/slug drift (`KPK` vs full names) | Unify via shared enum or API |
| `client/src/constants/listings.js` `JOB_CATEGORIES` vs `server/src/data/launchContentGenerators.js` | Different category sets | Align seed + client filters |

---

## 2. Temporary / one-off scripts (P1)

### L.2.6.5 ops aids

| Path | Justification |
|------|---------------|
| `scripts/l265-reindex-and-probe.mjs` | Sprint verify aid; near-duplicate of server script |
| `server/src/scripts/l265ReindexAndProbe.js` | One-time reindex/probe |
| `server/src/scripts/l265EnsureInternalJobs.js` | One-time internal applyType flip |
| `server/src/scripts/l265JobTypes.js` | Support for above |
| `docs/_l265_verify_results.json` | Generated artifact |

**Suggested:** move to `scripts/archive/l265/` or document “run only on legacy DBs”.

### Historical sprint verifiers (not in active npm gate list)

| Path | Justification |
|------|---------------|
| `scripts/verify-sprint-a.mjs` … `verify-sprint-c6-4-2.mjs` | Superseded by current `verify:*` suite |
| `scripts/qa-sprint-b2-*.mjs` | B2 QA automation |
| `scripts/test-image-preview.mjs` | Playwright helper |
| `scripts/verify-phase1.mjs`, `scripts/verify-admin-stability.mjs` | Early launch QA |
| `scripts/test-import-phase3.mjs` + `scripts/test-import/` | Phase-3 import QA samples |
| `scripts/fix-admin-imports.mjs`, `scripts/migrate-admin-selects.mjs` | One-shot codemods (already applied) |
| `scripts/restore-cms-nav-defaults.mjs` | Recovery script |
| `scripts/stabilization-test.mjs` | Ad-hoc rate-limit loop |

### Legacy seed phases (P1 — superseded by `seed:launch`)

| Path | Justification |
|------|---------------|
| `server/src/scripts/seedPhase4.js` … `seedPhase9.js` | Older phased seeds |
| `server/src/scripts/seedExamPrep.js`, `seedListings.js` | Covered by launch seed path |

**Keep:** `seed:launch`, `seed:assessments`, `server/src/seed/index.js`.

### Duplicate backup entrypoint

| Path | Justification |
|------|---------------|
| `scripts/backup-mongodb.sh` | Overlaps `scripts/backup/mongo-backup.sh` (canonical per BACKUP_GUIDE) |

Update `POST_LAUNCH.md` references when consolidating.

---

## 3. Experimental / placeholder AI surfaces (Keep — gate/label)

Per AI Budget Policy these are **deterministic placeholders**, not paid AI. Candidates to **label in UI/docs** or feature-flag, not delete blindly.

| Path | Justification |
|------|---------------|
| `server/src/controllers/resumeAnalyzerController.js` | Hardcoded skills; ignores file buffer |
| `server/src/controllers/chatbotController.js` | Keyword placeholder |
| `server/src/controllers/coverLetterController.js` | Template letter |
| `server/src/controllers/admin/aiJobController.js` | Template JD generator |
| `client/src/pages/Admin/AIJobGenerator.jsx` | UI over placeholder API |
| `client/src/constants/seedData.js` (`SAMPLE_BLOGS`) | Fallback mock when API empty |

---

## 4. Unused client modules (P1)

| Path | Justification |
|------|---------------|
| `client/src/constants/faq.js` | `FAQ_ITEMS` never imported; FAQ page uses i18n |
| `client/src/components/ads/AdSidebar.jsx` | Exported but unused by pages (`AdHost` uses `AdBanner`) |
| `client/src/components/ads/AdInFeed.jsx` | Same |
| Unused helpers in `client/src/config/careerFeatureFlags.js` | Several flags defined but never imported on client (`isCareerDashboardV2Enabled`, etc.) |

**Not unused:** `LegacyDashboard.jsx`, `Chatbot.jsx` (legacy dashboard path).

---

## 5. Historical / superseded docs (P2)

| Path | Justification |
|------|---------------|
| `docs/qa-sprint-b2/` | Historical B2 QA |
| `docs/SPRINT_C6_4_PRE_IMPLEMENTATION_AUDIT.md` | Pre-impl; superseded by implementation report |
| `docs/SPRINT_C6_4_3_PRE_IMPLEMENTATION_AUDIT.md` | Same |
| `docs/SPRINT_C_PRE_IMPLEMENTATION_AUDIT.md` | Same |
| `docs/POST_SPRINT_A_ADMIN_GAP_ANALYSIS.md` | Pre–C-series admin audit |
| `docs/ADMIN_PANEL_PRE_LAUNCH_AUDIT.md` | Superseded by later C.6+ / L.1 docs |

**Suggested:** `docs/archive/` — keep recent L.1 / L.2.* / RC1 / AI_BUDGET / PRODUCTION_* live.

**Doc refresh (not delete):** `docs/L2_7_CAREER_INTELLIGENCE_ENHANCEMENT_AUDIT.md` §6.1 still mentions client ResumeScore duplicate — outdated after L.2.8/RC-1.

---

## 6. Dead routes / unused API controllers

**No clearly dead mounted routers found.** All routers in `server/src/routes/index.js` are mounted.

Placeholder controllers above remain **live** — cleanup = gate/label, not unmount without product decision.

---

## 7. Lint / quality debt (P2 hygiene sprint)

RC-1 `npm run lint` reported many **pre-existing** `no-unused-vars` / hooks warnings on both client and server (≈58 server + ≈81 client problems). Examples:

- Unused imports (`Quiz`, `mongoose`, `Admission`, etc.)
- Unused assignments in scrapers / slug helpers
- React hooks exhaustive-deps warnings

**Action:** Dedicated lint-cleanup PR; do not block RC on mass auto-fix.

---

## 8. Recommended cleanup order (future sprint)

1. **P0** — Confirm resume score unification; align province/job category constants.  
2. **P1** — Archive L265 + historical `verify-sprint-*` / QA scripts; remove unused `faq.js` / ad components after grep confirmation.  
3. **P1** — Gate or label AI placeholder admin routes in UI copy.  
4. **P2** — Move historical docs to `docs/archive/`; lint debt burn-down.  
5. **P2** — Reconcile backup script documentation.

---

## 9. Explicit non-actions

- Do **not** delete Career Intelligence shared scoring modules.  
- Do **not** delete active `verify:l2-8`, `verify:career-*`, production/ops verify scripts.  
- Do **not** remove AI placeholders until product decides to hide them (policy allows deterministic fallbacks).

---

**End of RC-1 Codebase Cleanup Plan.**
