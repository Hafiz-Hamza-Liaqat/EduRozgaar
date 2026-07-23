# Sprint C.6.1 — Critical Persistence & Production Readiness

**Status:** Complete  
**Date:** 2026-07-12  
**Scope:** P0 launch blockers only (per `docs/SPRINT_C6_POST_QA_AUDIT.md`)

---

## Root Cause Analysis

### CMS content lost after restart (P0)

**Cause:** `seedCmsSiteContent()` ran on **every** server boot via `server/src/index.js` and used `findOneAndUpdate(..., { upsert: true })` with a **full document payload** including `status: 'draft'` and empty/default fields. This overwrote published CMS content on each restart.

**Why refresh worked but restart failed:** In-session saves wrote correct data to MongoDB. After restart, the seed ran again and demoted/overwrote documents. Public APIs use `publishedFilter()` — only `status: 'published'` is returned — so the site appeared “reset” while admin might still see partial draft state.

### Other persistence

Jobs, scholarships, admissions, blogs, users, employers, etc. were **already persisted in MongoDB** with no startup reset. The audit’s CMS seed was the primary bug. Listing data loss would only occur with ephemeral MongoDB or manual destructive seeds (`npm run seed`).

### Email (not a bug in dev)

SMTP requires `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`. When unset, `sendEmail()` returns `{ placeholder: true }` and logs to console — queue jobs still complete. This is intentional for local development.

---

## Implementation Summary

### 1. CMS insert-only seed

**File:** `server/src/seed/cmsSiteContent.js`

- Replaced destructive upserts with `insertIfMissing()` — creates defaults **only when no document exists** for the filter key.
- Never updates `status`, `content`, `hero`, nav items, or any admin-edited field on existing documents.
- Returns structured stats: `{ mode: 'insert_only', homepage: { inserted, skipped }, ... }`.

### 2. Startup behavior

**File:** `server/src/index.js`

- CMS seed skipped when `CMS_SEED_ON_START=0`.
- Default: CMS insert-only seed runs after MongoDB connect.
- Job plans seed unchanged in behavior (insert-only when empty) but now logs structured result.
- Structured logging via `logger.info('cms_seed', stats)` and `logger.info('job_plans_seed', stats)`.

### 3. Job plans seed

**File:** `server/src/seed/jobPlans.js`

- Returns `{ mode: 'insert_only', inserted, skipped }` for observability.
- Still skips when any plan exists (production-safe).

### 4. Health endpoint — email clarity

**File:** `server/src/controllers/platformOpsController.js`

- Extended `GET /api/health` with:

```json
"email": {
  "configured": false,
  "mode": "placeholder",
  "note": "SMTP not configured — email jobs log placeholders and complete without sending"
}
```

### 5. Documentation

**File:** `docs/DEPLOYMENT_GUIDE.md`

- CMS insert-only startup behavior documented.
- `CMS_SEED_ON_START=0` documented.
- Clarified Brevo uses `MAIL_*` SMTP vars (not `BREVO_API_KEY` in code).

### 6. Verification script

**File:** `scripts/verify-sprint-c6-1.mjs`

- Proves published CMS survives re-seed.
- Confirms job plans insert-only idempotency.
- Counts major MongoDB collections.
- Validates health `email.mode` and placeholder send behavior.

---

## Files Modified

| File | Change |
|------|--------|
| `server/src/seed/cmsSiteContent.js` | Insert-only seed; never overwrite existing docs |
| `server/src/index.js` | CMS_SEED_ON_START gate; structured seed logging |
| `server/src/seed/jobPlans.js` | Return insert-only stats |
| `server/src/controllers/platformOpsController.js` | Health `email.mode` field |
| `docs/DEPLOYMENT_GUIDE.md` | CMS seed + SMTP documentation |
| `scripts/verify-sprint-c6-1.mjs` | New P0 verification script |

**Not modified (out of scope):** UI, navbar, invitations, profile, employer, accessibility.

---

## Startup Behavior (After C.6.1)

```
1. connectDB()
2. seedJobPlans()
   → If JobPlan.count > 0: skip (log skipped count)
   → Else: insertMany(defaultPlans)
3. If CMS_SEED_ON_START !== '0':
     seedCmsSiteContent() [insert-only]
     → For each CMS doc: if exists → skip; else → create draft defaults
   Else: log cms_seed_skipped
4. startScraperCron()
5. app.listen()
```

**Production deploy/restart:** Existing published CMS, navigation, footer, and static pages are **untouched**. New empty databases still get draft defaults on first boot.

---

## Migration Notes

**No database migration required.**

- Existing CMS documents in MongoDB are preserved automatically.
- No schema changes.
- Administrators who lost published content due to the old seed must **re-publish once** from Admin → Site CMS (data may still exist as draft if overwritten by old seed before this fix).

**Going forward:** Restarts and deploys will not revert published content.

---

## Verification Results

### Automated

```bash
cd server && node --env-file=.env ../scripts/verify-sprint-c6-1.mjs
```

**Result: 5/5 PASS**

| Check | Result |
|-------|--------|
| CMS published survives re-seed | PASS |
| Job plans insert-only | PASS |
| Major collections in MongoDB | PASS (counts listed below) |
| Health email.mode | PASS |
| Email placeholder mode | PASS |

**Collection counts at verification time:**

| Collection | Count |
|------------|-------|
| Job | 320 |
| Scholarship | 150 |
| Admission | 80 |
| Blog | 200 |
| CmsHomepage | 1 |
| User | 1 |
| Employer | 15 |
| ForeignStudy | 100 |
| Institution | 1 |
| Webinar | 1 |

### CMS restart scenarios (verified via re-seed simulation)

| Scenario | Expected | Result |
|----------|----------|--------|
| Published homepage + re-seed | Stays published, headline preserved | PASS |
| Published header nav + re-seed | Stays published, items preserved | PASS |
| Published footer + re-seed | Stays published, copyright preserved | PASS |
| Published static page + re-seed | Stays published, content preserved | PASS |
| Draft pages | Unchanged by seed (doc exists → skip) | PASS |

### SMTP / email pipeline

| Item | Status |
|------|--------|
| `isSmtpConfigured()` | false locally (expected) |
| `sendEmail()` placeholder | Returns `{ placeholder: true }`, no throw |
| Queue job completion | Jobs mark completed (C.4 behavior unchanged) |
| Health endpoint | Reports `email.mode: "placeholder"` with explanatory note |
| Production requirement | Set `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` (Brevo SMTP relay) |

### Build status

| Target | Result |
|--------|--------|
| Client build (`npm run build`) | **PASS** |
| Server start | **PASS** (watch mode; health 200) |
| C.4 regression script | **6/6 PASS** |

### Backup & recovery (documentation review)

| Item | Status |
|------|--------|
| MongoDB Atlas backups | Documented in `docs/DEPLOYMENT_GUIDE.md` |
| Docker volume `mongodb_data` | Documented in `docker-compose.yml` |
| Local dev `.mongo-data` | Ephemeral unless mongod uses stable dbpath |
| Restore process | Documented in `docs/ROLLBACK_GUIDE.md` |
| CMS seed safety | Now documented in deployment guide |

No deployment redesign performed (per scope).

---

## Regression Analysis

| Area | Impact |
|------|--------|
| CMS admin save/publish | Unchanged — no API changes |
| Public CMS routes | Unchanged — benefit from persistent published state |
| Job plans | Unchanged behavior; improved logging |
| Listings CRUD | No changes |
| Notifications / queue | No logic changes; health adds `email` object |
| Auth / RBAC | No changes |
| Employer / student portals | No changes |

**Risk:** Low. Only startup seed path changed.

---

## Acceptance Criteria

| Criterion | Met |
|-----------|-----|
| CMS content survives backend restart | Yes |
| Published content never reverted to draft by startup | Yes |
| No administrator content overwritten during startup | Yes |
| MongoDB persistence verified across major modules | Yes |
| Startup seeds production-safe and idempotent | Yes |
| Email pipeline verified and documented | Yes |
| No regressions introduced | Yes (C.4 6/6, client build pass) |
| Client build passes | Yes |
| Server starts successfully | Yes |
| Verification passes | Yes (5/5) |
| Implementation report provided | Yes |

---

## What Was Explicitly NOT Done (C.6.2+)

- Admin sidebar, slug service, navbar redesign
- Support dropdown dark mode fix
- Staff invitation system
- Profile improvements
- Employer redesign / PKR pricing
- Accessibility fixes

See `docs/SPRINT_C6_POST_QA_AUDIT.md` for P1/P2 backlog.

---

## How to Verify Locally

```powershell
# 1. Start MongoDB + API
# 2. Publish CMS content in Admin → Site CMS
# 3. Restart API (Ctrl+C, npm run dev)
# 4. Confirm published content still visible on public site

cd server
node --env-file=.env ../scripts/verify-sprint-c6-1.mjs
curl http://localhost:5000/api/health
```

**Disable CMS bootstrap entirely:**

```
CMS_SEED_ON_START=0
```

---

**Sprint C.6.1 approved for merge pending manual smoke test of CMS publish → restart → public site check.**
