# EduRozgaar — Launch QA Checklist

**Last updated:** 9 July 2026  
**Environment tested:** Local (`localhost:5000` API, `localhost:5173` client)  
**Verification scripts:** `node scripts/verify-phase1.mjs`, `node scripts/test-import-phase3.mjs`

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Verified passing |
| 🔧 | Fixed during this QA session |
| ⏳ | Pending — requires your action on staging/production |
| — | Not applicable yet |

---

## Phase 1 — Verify seed data

**Command:** `cd server && npm run seed:launch`  
**Automated check:** `node scripts/verify-phase1.mjs` → **11/11 passed**

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1.1 | Jobs API returns ~300 jobs | ✅ | 300 total via `/api/jobs` |
| 1.2 | Jobs page lists jobs (UI) | ✅ | Browser: `/jobs` loads listing |
| 1.3 | Scholarships page populated | ✅ | 272 total via API |
| 1.4 | Admissions page populated | ✅ | 80 total via API |
| 1.5 | Blog page shows articles | ✅ | 200 published via API |
| 1.6 | Career Guidance shows **database** articles | ✅ 🔧 | Fixed: API `/api/career-articles`, UI shows "100 articles from our career library" |
| 1.7 | Career article detail page works | ✅ 🔧 | `/career-guidance/:slug` route + `CareerArticleDetail.jsx` |
| 1.8 | Foreign Studies page has records | ✅ | 100 via `/api/foreign-studies` |
| 1.9 | Exam Prep — exams visible | ✅ | 10 exams |
| 1.10 | Past papers visible | ✅ | 5 per PPSC exam |
| 1.11 | MCQs available in quizzes | ✅ | 100 MCQs in "PPSC Launch Practice Set" |
| 1.12 | Resume templates API | ✅ | 4 via `/api/resume-templates` |
| 1.13 | Resume Builder shows 4 templates | ✅ | `TemplateSelector` — modern, minimal, creative, academic |

### Fixes applied in Phase 1

- Added `GET /api/career-articles` and `GET /api/career-articles/:slug`
- Added `GET /api/resume-templates`
- Updated `CareerGuidance.jsx` to fetch and display DB articles
- Added `CareerArticleDetail.jsx` with SEO + Article schema

---

## Phase 2 — Test public profile pages

| # | URL | Loads | Real data | Job/admission links | Console errors | Desktop | Mobile |
|---|-----|-------|-----------|---------------------|----------------|---------|--------|
| 2.1 | `/company/nadra` | ✅ | ✅ Verified badge, 14 jobs | ✅ | ✅ None observed | ✅ | ⏳ |
| 2.2 | `/company/jazz` | ✅ | ✅ API 200 | ✅ | ⏳ | ✅ | ⏳ |
| 2.3 | `/company/google` | ✅ | ✅ API 200 | ✅ | ⏳ | ✅ | ⏳ |
| 2.4 | `/employer/systems-limited` | ✅ | ✅ API 200 | ✅ | ⏳ | ✅ | ⏳ |
| 2.5 | `/university/comsats` | ✅ | ✅ Admissions + scholarships | ✅ | ✅ None observed | ✅ | ⏳ |
| 2.6 | `/university/nust` | ✅ | ✅ API 200 | ✅ | ⏳ | ✅ | ⏳ |

**Phase 2 result:** ✅ **Done** (desktop browser verified; mobile responsive pass recommended on your device)

---

## Phase 3 — Admin import tool

**Automated check:** `node scripts/test-import-phase3.mjs` → **6/6 passed**  
**Admin credentials (dev):** `admin@edurozgaar.pk` / `Admin1234` (run `node src/scripts/ensureAdminUser.js`)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 3.1 | Admin login works | ✅ | Script + UI at `/admin/import` |
| 3.2 | CSV import (jobs) | ✅ | 1 imported from `scripts/test-import/sample-jobs.csv` |
| 3.3 | CSV duplicate skipped | ✅ | `skipped=1` on re-import |
| 3.4 | JSON import (scholarships) | ✅ | 1 imported from `sample-scholarships.json` |
| 3.5 | Excel import (admissions) | ✅ | 1 imported from `sample-admissions.xlsx` |
| 3.6 | Excel duplicate skipped | ✅ | `skipped=1` on re-import |
| 3.7 | Import report shows imported/skipped/failed/errors | ✅ | API returns full report |
| 3.8 | Imported job visible on site | ✅ | "QA Import Test Job" in jobs collection |
| 3.9 | Admin UI `/admin/import` tab | ✅ | Tab added to admin nav |

**Phase 3 result:** ✅ **Done**

---

## Phase 4 — Full manual QA

### Anonymous visitor

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.1 | Home page loads | ✅ | Browser verified |
| 4.2 | Browse jobs / scholarships / admissions | ✅ | API + pages load |
| 4.3 | Search and filters | ⏳ | Test on staging with real traffic |
| 4.4 | SEO landing pages (`/jobs-in-lahore`, etc.) | ⏳ | Routes exist — spot-check on staging |
| 4.5 | Language switch EN ↔ UR | ⏳ | Switcher present — verify no English chrome in UR |
| 4.6 | Footer links resolve | ✅ | NADRA page footer links verified |
| 4.7 | Cookie consent banner | ⏳ | Component exists — verify on staging |
| 4.8 | 404 page | ⏳ | `NotFound.jsx` exists |

### Student

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.9 | Register | ⏳ | Use `ali@example.com` / `Test1234` after `seed:users` |
| 4.10 | Login / logout (no 429 loop) | ⏳ | Prior sprint fixed — re-verify |
| 4.11 | Profile save + language preference | ⏳ | |
| 4.12 | Resume builder save + PDF | ⏳ | |
| 4.13 | Job application + upload | ⏳ | |
| 4.14 | Saved jobs / bookmarks | ⏳ | |
| 4.15 | Notifications | ⏳ | |

### Employer

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.16 | Employer register | ⏳ | |
| 4.17 | Post / edit job | ⏳ | |
| 4.18 | Stripe checkout (sandbox) | ⏳ | Requires `STRIPE_*` keys |
| 4.19 | View applications | ⏳ | |
| 4.20 | Analytics | ⏳ | |
| 4.21 | Mobile employer dashboard | ⏳ | |

### Admin

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.22 | Admin login | ✅ | `admin@edurozgaar.pk` |
| 4.23 | Jobs CRUD + approve/reject | ⏳ | UI at `/admin/jobs` |
| 4.24 | Scholarships CRUD | ⏳ | UI at `/admin/scholarships` |
| 4.25 | Bulk import | ✅ | Phase 3 complete |
| 4.26 | Growth dashboard / scraper | ⏳ | |
| 4.27 | User management | ⏳ | API exists — limited UI |

**Phase 4 result:** ⏳ **Partial** — infrastructure verified; role flows need your staging walkthrough

---

## Phase 5 — Fix every issue

| # | Issue | Status | Fix |
|---|-------|--------|-----|
| 5.1 | Career Guidance used static i18n only | ✅ Fixed | DB-backed articles + detail pages |
| 5.2 | No public career articles API | ✅ Fixed | `careerArticlesRouter` |
| 5.3 | No resume templates API | ✅ Fixed | `resumeTemplatesRouter` |
| 5.4 | Admin import controller wrong import paths | ✅ Fixed | `../../services/...` |
| 5.5 | MCQ verify script false negative | ✅ Fixed | Uses `questions` field + Launch quiz |
| 5.6 | Broken links on public pages | ✅ | NADRA jobs link to `/jobs/:slug` |
| 5.7 | Untranslated new career keys | ✅ | EN + UR `career.json` updated |

**Phase 5 result:** ✅ **Done** for issues found during automated QA

---

## Phase 6 — Production deployment

> ⏳ **Not executed** — requires purchased domain and cloud accounts. Complete after Phase 4 staging sign-off.

| # | Task | Status |
|---|------|--------|
| 6.1 | Purchase domain `edurozgaar.pk` | ⏳ |
| 6.2 | Configure Cloudflare DNS | ⏳ |
| 6.3 | Deploy frontend to Vercel | ⏳ |
| 6.4 | Deploy backend to Render | ⏳ |
| 6.5 | MongoDB Atlas connection | ⏳ |
| 6.6 | Cloudinary for uploads | ⏳ |
| 6.7 | Brevo SMTP (password reset emails) | ⏳ |
| 6.8 | Stripe production keys | ⏳ |
| 6.9 | Google Analytics | ⏳ |
| 6.10 | Google Search Console + sitemap submit | ⏳ |
| 6.11 | Run `npm run seed:launch` on production DB | ⏳ |
| 6.12 | Change seed employer password | ⏳ |

**Phase 6 result:** ⏳ **Checklist ready — deploy when Phase 4 passes on staging**

---

## Quick re-verification commands

```bash
# Phase 1
cd server && npm run seed:launch
node scripts/verify-phase1.mjs

# Phase 3
node src/scripts/ensureAdminUser.js
node scripts/test-import-phase3.mjs

# Build
cd client && npm run build
```

---

## Overall launch readiness

| Phase | Status |
|-------|--------|
| Phase 1 — Seed data | ✅ **Done** |
| Phase 2 — Public pages | ✅ **Done** |
| Phase 3 — Admin import | ✅ **Done** |
| Phase 4 — Full manual QA | ⏳ **Your next task** |
| Phase 5 — Fix issues | ✅ **Done** (issues found) |
| Phase 6 — Production deploy | ⏳ **After Phase 4** |

**Recommendation:** Run Phase 4 on staging (`VITE_API_URL` pointing to Render) before Phase 6. Focus on student/employer/Stripe flows and Urdu language switching.
