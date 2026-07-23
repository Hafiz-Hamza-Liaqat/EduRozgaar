# Sprint C.8.0.7 — Migration Layer & Feature Flag Rollout

**Status:** Complete  
**Date:** 2026-07-13  
**Scope:** Migration and rollout layer only — no new end-user features. Dual-write/dual-read, safe hydration, rollback procedures, feature-flag matrix. Zero-downtime additive migrations.

---

## Summary

Introduced a dedicated **career migration layer** that moves legacy Resume, Application, ProfileDocument, and certification references toward canonical TalentProfile, OpportunityApplication, Document, and Credential services — without deleting legacy data. Live dual-write hooks keep both sides aligned during rollout. Checkpoints CP1–CP3 are reportable via reconcile.

---

## Migration Architecture

```
Legacy Resume ──dual-write──► TalentProfile (+ ResumeVersion)
Legacy Application ──dual-write / backfill──► OpportunityApplication
Legacy InternshipApplication ──► OpportunityApplication
Legacy ProfileDocument ──backfill──► Document (legacyProfileDocumentId)
certificationReferences ──► CredentialPlatformService.issue

Staff / CLI
  └── CareerMigrationService
        ├── ProfileHydrationService (M1)
        ├── ApplicationMigrationService (M2)
        ├── DocumentMigrationService
        ├── CredentialMigrationService
        └── MigrationReconcileService (CP1–CP3)
```

### Event / bridge preservation

Migrated Application and Document writes go through services that emit `CareerEventBus` events (`ApplicationCreated`, `DocumentCreated`, credential events). Timeline, analytics, and search bridges continue to receive those events — no bypass of the platform buses.

---

## Rollout Phases

| Phase | Action | Downtime | Flags |
|-------|--------|----------|-------|
| **M0** | Schemas already deployed (C.8.0.2–0.6) | None | — |
| **M1** | Hydrate TalentProfile from User + Resume | None (background) | `TALENT_PROFILE_ENABLED` |
| **M2** | Dual-write Application → OA + backfill | None | `APPLICATION_DUAL_WRITE=1` |
| **M3** | Bookmark saved* → Bookmark (deferred) | None | future |
| **M4** | Canonical reads | None | `*_READ_CANONICAL=1` |
| **M5** | Deprecate legacy writes (later sprint) | None | — |
| **M6** | Archive legacy fields (optional) | None | — |

### Recommended order

1. Run `hydrateTalentProfiles.js --dry-run` then execute.
2. Enable `TALENT_PROFILE_DUAL_WRITE=1` (TP ↔ Resume both directions).
3. Run `migrateOpportunityApplications.js --dry-run` then execute.
4. Enable `APPLICATION_DUAL_WRITE=1` for live job/internship apply.
5. Run `migrateProfileDocuments.js` behind documents migration flag.
6. Flip `TALENT_PROFILE_READ_CANONICAL=1` then `APPLICATION_READ_CANONICAL=1` after checkpoints pass.
7. Keep `CAREER_DASHBOARD_ENABLED` as product flag independent of migration.

---

## Feature Flag Matrix

| Flag | Default | Purpose |
|------|---------|---------|
| `TALENT_PROFILE_ENABLED` | on | Talent domain APIs |
| `TALENT_PROFILE_DUAL_WRITE` | **off** | TP ↔ Resume mirror (includes reverse sync from `/api/resumes`) |
| `TALENT_PROFILE_READ_CANONICAL` | **off** | Prefer TalentProfile reads |
| `OPPORTUNITY_APPLICATION_ENABLED` | on | OA APIs |
| `APPLICATION_DUAL_WRITE` | **off** | Legacy apply → OpportunityApplication |
| `APPLICATION_READ_CANONICAL` | **off** | Prefer OA for career application reads |
| `VITE_APPLICATION_READ_CANONICAL` | **off** | Client mirror |
| `TIMELINE_ENABLED` | on | Timeline platform |
| `DOCUMENTS_PLATFORM_ENABLED` | on | Document / credential APIs |
| `DOCUMENTS_MIGRATION_ENABLED` | on* | ProfileDocument backfill jobs (*or falls back to documents platform) |
| `CAREER_DASHBOARD_ENABLED` | on | Composition dashboard |
| `CAREER_MIGRATION_JOBS_ENABLED` | on | Kill-switch for batch jobs |

**Modes** (`resolveRolloutMode`): `legacy` → `dual_write` → `dual_read` → `canonical`.

---

## Rollback Strategy

1. **Immediate:** Set dual-write / read-canonical flags to `0`. UI and APIs resume legacy paths.
2. **Do not delete** OpportunityApplication, TalentProfile, Document, or Credential rows created during migration.
3. New collections remain unused until flags turn back on.
4. `CAREER_MIGRATION_JOBS_ENABLED=0` stops staff CLI/admin batch migration endpoints (503).
5. Dual-write hooks fail soft (logged, never fail the legacy apply/save response).

Rollback is **flag-off only** — additive storage, no reverse data purge.

---

## APIs & Scripts

### Staff routes (require auth + staff)

| Method | Path |
|--------|------|
| GET | `/api/admin/career/migration/flags` |
| GET | `/api/admin/career/migration/reconcile` |
| POST | `/api/admin/career/migration/run?dryRun=1` |
| POST | `/api/admin/career/migration/applications` |
| POST | `/api/admin/career/migration/documents` |
| POST | `/api/admin/career/migration/credentials` |

### CLI

```bash
node server/src/scripts/hydrateTalentProfiles.js [--dry-run]
node server/src/scripts/migrateOpportunityApplications.js [--dry-run]
node server/src/scripts/migrateProfileDocuments.js [--dry-run]
node server/src/scripts/reconcileCareerMigration.js
```

---

## Manual QA Checklist

1. Dry-run hydrate; confirm created/skipped counts look right.
2. Hydrate for real; re-run (idempotent — skipped increases).
3. Enable `TALENT_PROFILE_DUAL_WRITE`; save Resume Builder and legacy `/resumes` — both stay in sync.
4. Enable `APPLICATION_DUAL_WRITE`; apply via legacy job apply — OA row appears with `legacyApplicationId`.
5. Apply to internship — OA with `opportunityType: internship`.
6. Re-run application migration — no duplicates (`already_migrated` / opportunity_exists).
7. Migrate ProfileDocuments — `legacyProfileDocumentId` set; DocumentCreated events fire.
8. Credential hydration uses `CredentialPlatformService.issue` (timeline/search hooks).
9. `GET /admin/career/migration/reconcile` — review CP1/CP2/CP3.
10. Disable `APPLICATION_DUAL_WRITE` — legacy apply still succeeds; no OA create.
11. Disable `TALENT_PROFILE_READ_CANONICAL` — legacy resume reads still work.

---

## Verification

```bash
npm run verify:migration
npm run verify:career-platform
npm run verify:career-dashboard
npm run build --prefix client
```

---

## Known Limitations

- **M3 Bookmark migration** deferred — CP3 reports saved* baseline only.
- **Employer inbox** still reads legacy `Application` (CP5 deferred until dual-write period proven).
- **InternshipApplication** has no `legacyApplicationId` field on OA — linkage stored in `metadata.legacyInternshipApplicationId`.
- **Canonical-only cutover** of write paths not executed in this sprint (M5).
- Document migration requires `DOCUMENTS_PLATFORM_ENABLED` (DocumentService gating).
- CP1/CP2 may fail on empty/stale staging DBs until jobs are run — that is expected before production hydrate.

---

## Production Rollout Guide

1. Deploy code with all dual-write / read-canonical flags **off**.
2. Staging: dry-run → hydrate → app migrate → document migrate → reconcile until CP1/CP2 pass.
3. Production: hydrate off-peak; enable `TALENT_PROFILE_DUAL_WRITE`.
4. After 24–48h of dual-write without inconsistency: `TALENT_PROFILE_READ_CANONICAL=1`.
5. Enable `APPLICATION_DUAL_WRITE`; backfill; monitor OA vs Application counts via reconcile.
6. Flip `APPLICATION_READ_CANONICAL` for career UI when parity holds.
7. Keep legacy employer endpoints until CP5 planned in a later sprint.
8. Rollback at any step via flags; do not delete canonical collections.

---

## Expected Implementation Checklist

### Migration Layer
- ☑ Resume migration (hydrate + reverse dual-write)
- ☑ Application migration (backfill + live dual-write)
- ☑ Document migration
- ☑ Credential migration (via platform service)

### Rollout
- ☑ Dual-write
- ☑ Dual-read (flags + mode resolver)
- ☑ Canonical mode
- ☑ Rollback support

### Platform
- ☑ Search preserved (events → bridges)
- ☑ Analytics preserved
- ☑ Timeline preserved
- ☑ Localization preserved (`normalizeLocale`)
- ☑ Permissions preserved (staff migration routes)

### Verification
- ☑ verify:migration PASS
- ☑ verify:career-platform PASS
- ☑ verify:career-dashboard PASS
- ☑ Client build PASS
