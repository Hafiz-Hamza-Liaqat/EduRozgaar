# Sprint C.6 — Post-Implementation QA Audit (Read-Only)

**Date:** 2026-07-12  
**Mode:** Read-only investigation — no code changes  
**Source:** Manual QA observations, DevTools screenshots, and codebase review

---

## Executive Summary

Manual QA surfaced **one launch-blocking defect** (CMS content reset on every backend restart), several **high-priority UX and ops gaps** (Support dropdown dark mode, navbar logout overflow, missing staff invitation workflow, SMTP not wired in local dev), and **architectural recommendations** (admin sidebar, slug management, expanded job-poster dashboard).

| Priority | Count | Theme |
|----------|-------|-------|
| **P0** | 3 | Data persistence (CMS seed), production email delivery, ephemeral DB risk |
| **P1** | 8 | Dark-mode selects, navbar overflow, invitations, employer-type gap, notification email path, accessibility |
| **P2** | 10+ | Admin sidebar, slug UX, profile expansion, employer UI polish, console/a11y hygiene |

**Recommended sprint grouping:**

| Sprint | Focus |
|--------|-------|
| **C.6.1 (P0 — blocker)** | Fix CMS startup seed; verify Mongo persistence; SMTP/Brevo production config |
| **C.6.2 (P1 — UX/ops)** | Shared select component, navbar account menu, staff invitations, notification verification |
| **C.6.3 (P2 — platform)** | Admin sidebar, slug UX, employer dashboard expansion, profile settings, a11y pass |

---

## 1. Support Page Dropdown Theme

**Page:** `/admin/support`  
**Observed:** “All Statuses” / “All Priorities” dropdowns show white background with white/unreadable text in dark mode.

### Root Cause

**Component styling gap — not browser-default alone.**

`AdminSupport.jsx` uses bare Tailwind classes without dark-mode tokens:

```59:66:client/src/pages/Admin/AdminSupport.jsx
<select ... className="px-3 py-2 rounded-lg border text-sm">
```

The shared admin pattern (`adminFieldClass`) **does** include dark-mode support:

```226:226:client/src/components/admin/AdminImageUrlField.jsx
export const adminFieldClass = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm';
```

`AdminTableFilters.jsx` (used by most admin list pages) also applies full dark classes on every `<select>`.

**Why it looks broken:** In dark mode, inherited text color is light (`text-gray-300` from parent/body), but missing `bg-white dark:bg-gray-800` and `text-gray-900 dark:text-white` leaves the closed `<select>` with light text. Native `<option>` popups use OS styling (often white background), producing white-on-white for options when page text color bleeds through.

**Not a Tailwind conflict** — simply an inconsistent, incomplete class string on this page only.

### Severity

**P1** — Admin usability; blocks Support ticket filtering in dark mode.

### Files Involved

| File | Role |
|------|------|
| `client/src/pages/Admin/AdminSupport.jsx` | Broken selects (lines 59–66) |
| `client/src/components/admin/AdminTableFilters.jsx` | Correct reference implementation |
| `client/src/components/admin/AdminImageUrlField.jsx` | `adminFieldClass` export |

### Pages Using the Same Dropdown Pattern

| Page / Component | Select styling | Dark-mode safe? |
|------------------|----------------|-----------------|
| **`AdminSupport.jsx`** | `border text-sm` only | **No** — sole outlier |
| `AdminContactMessages.jsx` | Full dark classes | Yes |
| `AdminEmployers.jsx` (inline filters) | Full dark classes | Yes |
| `AdminTableFilters.jsx` | Full dark classes | Yes — used by Jobs, Blogs, Scholarships, Admissions, Users table filters, Audit, Payments, etc. |
| `AdminUsers.jsx` (bulk role) | Partial (`dark:bg-gray-900` only) | Partial |
| All admin form modals | `adminFieldClass` or `fieldClass` | Yes |
| `AlertsAdmin.jsx` | Full dark + `text-gray-900 dark:text-white` | Yes (best practice) |
| `NotificationsPage.jsx` (user inbox) | Full dark classes | Yes |
| `Profile.jsx` | Full dark classes | Yes |

**Additional issue on same page:** Support reply modal `<textarea>` (line 87) also lacks dark border/background classes.

### Complexity

**Low** — 1–2 hours. Replace with `adminFieldClass` or extract shared `AdminSelect` component.

### Risk

Low. Visual-only fix; regression risk minimal if shared class is reused.

---

## 2. Slug Management Architecture

### Current State

**Central utility:** `server/src/utils/slugify.js` — `slugify()`, plus domain helpers (`jobSlug`, `blogSlug`, `companySlug`, etc.)

**Duplicate prevention:**

| Layer | Mechanism |
|-------|-----------|
| MongoDB | `unique: true` on slug fields (most models) |
| CMS static pages | Compound unique `{ slug, locale }` |
| Import pipeline | `ensureSlugUnique()` in `server/src/utils/bulkUpsert.js` |
| Employer job create | Appends `-${Date.now()}` on collision |
| Admin CRUD | **No** runtime `ensureSlugUnique` — relies on unique index (409 on duplicate) |

**Auto-generation:** Pre-save hooks and create handlers generate slugs from title/name when slug omitted (Job, Blog, Scholarship, Admission, Company, etc.).

**Manual entry:** Admin forms expose slug as editable text field:

| Resource | Manual slug UI | Auto-gen fallback |
|----------|----------------|-------------------|
| Jobs | `AdminContentJobs.jsx` | `jobSlug(title, location)` |
| Scholarships | `AdminContentScholarships.jsx` | `scholarshipSlug(title, country)` |
| Admissions | `AdminContentAdmissions.jsx` | `admissionSlug(program, institution)` |
| Blogs | `AdminContentBlogs.jsx` | `blogSlug(title)` |
| Companies | `AdminCompanies.jsx` | `companySlug(name)` |
| CMS static pages | `AdminSiteCms.jsx` | `blogSlug(title)` if empty |
| Webinars | `AdminWebinars.jsx` | `slugify(title)` on create |
| Foreign studies, internships, institutions, etc. | Similar pattern | Model-specific |

**URL preview:** Jobs admin shows external link when slug exists (`AdminContentJobs.jsx` ~194). No live preview on other resources. No slug normalization UI feedback.

**Page/block assignment:** CMS uses separate collections — `CmsHomepage`, `CmsNavigation` (header/footer), `CmsStaticPage`, `CmsBanner`. No unified “page builder block registry”; static pages use freeform content + optional sections array.

### Gaps

1. No centralized slug service (generate → normalize → check unique → preview)
2. Duplicate slug errors surface as raw Mongo 409, not friendly admin validation
3. Pre-save hooks may **overwrite** slug when title changes on update
4. No dropdown for “assign to existing page/route” — paths typed manually in CMS nav
5. CMS static slugs seeded with fixed list; custom slugs not in seed list are safe from overwrite

### Recommended Architecture (Do Not Implement Yet)

```
SlugService (server)
  ├── normalize(text) → slugify + max length + reserved-word blocklist
  ├── ensureUnique(Model, baseSlug, { locale? })
  ├── previewUrl(resourceType, slug) → full canonical URL
  └── reserved: ['admin', 'api', 'auth', 'employer', ...]

Admin UI
  ├── Auto-fill slug from title on blur (debounced)
  ├── Editable slug with validation indicator (available / taken)
  ├── Live URL preview chip
  └── Optional “lock slug” toggle after publish

CMS (separate track)
  ├── Page registry: static | dynamic | external
  ├── Block library for homepage sections (already partial in CmsHomepage.sections)
  └── Nav item picker: select published page OR enter external URL
```

### Severity

**P2** — SEO/ops quality; not a launch blocker if unique index holds.

### Complexity

**Medium–High** — Slug service: 1–2 days. Full CMS page/block picker: 1–2 weeks.

### Risk

Medium — slug changes affect SEO URLs; need redirects on slug change.

---

## 3. Navbar Logout Button Disappears

**Observed:** After admin login, Logout is pushed off-screen on desktop widths.

### Root Cause

**Responsive flex overflow — not z-index.**

`Navbar.jsx` structure:

- Left: Logo (`truncate`, max 40% on sm+)
- Center: Main nav — **`hidden lg:flex`** (only ≥1024px)
- Right cluster (`shrink-0`): Bell + Language + Theme + up to **5 authenticated links** (`hidden sm:inline`): Dashboard, Resume, Profile, Admin, **Logout**

When user has staff role, **Admin** link appears — adding a 5th text link. Between **640px–1023px** (sm–lg), main nav is hidden but all account links still show at `sm:inline`. The right cluster has **no `overflow-x-auto`**, **no account dropdown**, and **no `flex-wrap`**. Logout is the **last item** and gets clipped when horizontal space is exhausted.

On **≥1024px**, main nav consumes center space; with Admin link + long app name + EN/UR/AR switcher, Logout can still clip on narrower desktop (1024–1280px).

**Mobile (<640px):** Logout correctly lives in `DrawerMenu.jsx` — not affected.

### Severity

**P1** — Auth UX; users cannot log out without opening mobile drawer or clearing session.

### Files Involved

| File | Role |
|------|------|
| `client/src/components/layout/Navbar.jsx` | Lines 105–145 — crowded right cluster |
| `client/src/components/layout/DrawerMenu.jsx` | Mobile logout (works) |

### Recommended Fix Direction

- Collapse authenticated links into **avatar/account dropdown** (Dashboard, Profile, Admin, Logout) at `md` breakpoint
- Or show icon-only links with tooltips
- Or move Logout into dropdown always

### Complexity

**Low–Medium** — 4–8 hours.

### Risk

Low — isolated to header component.

---

## 4. Admin Sidebar Architecture

### Current State

`Admin.jsx` renders **34 permission-filtered horizontal tabs** in a `scroll-tabs` nav with horizontal scrollbar. Child routes render via `<Outlet />`. No persistent left sidebar.

### Recommendation

**Yes — migrate to grouped left sidebar** (VS Code / modern CMS pattern).

**Proposed groups:**

| Group | Items |
|-------|-------|
| Overview | Executive dashboard, Analytics, Growth, Monitoring, Platform ops |
| Content | Jobs, Scholarships, Admissions, Blogs, Career, Foreign studies, Internships, Universities, Companies, Institutions, Webinars, Exam prep, Site CMS |
| Users & trust | Users, Employers, Moderation, Contact, Support, Audit |
| Revenue | Payments, Advertisements, Newsletter |
| Tools | Import, AI job generator, Alerts, Notifications |

### Impact

| Area | Impact |
|------|--------|
| Affected pages | All `/admin/*` routes (~30 pages) — layout wrapper only |
| Routing | **No route changes** — same paths, different chrome |
| Responsive | Sidebar collapses to drawer on mobile; horizontal scroll removed |
| Permissions | Same `TAB_DEFS` filtering; groups respect `can(perm)` |
| Executive dashboard | Becomes default landing; tabs become nav sections |

### Complexity

**Medium** — 2–4 days for sidebar shell + mobile drawer + active-state routing.

### Risk

Medium — large UI touch; needs QA across all admin roles.

### Severity

**P2** — UX/maintainability; current scroll-tabs work but feel temporary (as observed).

---

## 5. User Invitations

### Investigation Results

| Capability | Backend | Frontend | Status |
|------------|---------|----------|--------|
| Admin invitation | **Missing** | **Missing** | Not implemented |
| Moderator invitation | **Missing** | **Missing** | Not implemented |
| Editor invitation | **Missing** | **Missing** | Not implemented |
| Super Admin invitation | **Missing** | **Missing** | Not implemented |

**What exists today:**

| Feature | Location | Behavior |
|---------|----------|----------|
| Role assignment | `PATCH /api/admin/users/:id/role` | Super Admin only; changes role on **existing** user |
| Bulk role assign | `AdminUsers.jsx` | Same — existing users only |
| Password reset | `POST /api/admin/users/:id/reset-password` | Generates temp password; shown in **toast** (not emailed) |
| Admin bootstrap | `server/src/scripts/ensureAdminUser.js` | CLI script only |
| User registration | Public `/auth/register` | Creates `User` role only |

**No models, tokens, or APIs for:** invite email, invite expiry, accept-invite page, pending invitations list.

### Recommended RBAC Invitation Workflow

```
1. Super Admin → Invite staff (email + role + optional message)
2. Server creates Invitation { email, role, tokenHash, expires, invitedBy }
3. Email queued (inviteStaff template) with /auth/accept-invite?token=…
4. Invitee sets name + password → User created with assigned role
5. Invitation marked accepted; audit log entry
6. Admin UI: pending / accepted / expired invitations table
```

**Rules:**

- Only Super Admin invites Admin/SuperAdmin
- Admin may invite Editor/Moderator (configurable)
- Cannot invite existing email — offer role upgrade instead
- 72h token expiry; resend + revoke actions

### Severity

**P1** — Operational security gap for production staff onboarding.

### Complexity

**Medium** — 3–5 days (model + API + email template + accept page + admin UI).

### Risk

Medium — security-sensitive; must prevent privilege escalation.

---

## 6. Data Persistence (HIGH PRIORITY — Launch Blocker)

**Observed:** Content survives save/publish/hard refresh but disappears after backend restart or re-login.

### Root Cause Analysis

#### Primary cause — CMS startup seed overwrites published content

Every backend start runs:

```95:100:server/src/index.js
connectDB().then(async () => {
  await seedJobPlans().catch(...);
  await seedCmsSiteContent().catch(...);  // ← OVERWRITES CMS
```

`seedCmsSiteContent()` uses `findOneAndUpdate(..., { upsert: true })` with **`status: 'draft'`** and default/empty content for:

- Homepage (`CmsHomepage`)
- Header navigation (`CmsNavigation`, placement: header)
- Footer navigation (`CmsNavigation`, placement: footer)
- 14 static pages (about, contact, faq, privacy-policy, terms, etc.)

Public CMS APIs filter with `publishedFilter()` — only `status: 'published'` is returned. After restart, seeded content is **draft** → public site falls back to **i18n hardcoded defaults** → appears “lost.” Admin may still see drafts, but published site reverts.

**This exactly matches:** survives refresh (same session, admin sees DB state) → gone after restart (seed resets to draft defaults).

#### Secondary causes

| Cause | When | Impact |
|-------|------|--------|
| Ephemeral MongoDB | Local `.mongo-data` or service not running | **All** collections empty on fresh DB |
| Destructive manual seeds | `npm run seed` | Wipes jobs/scholarships/admissions/blogs |
| `SEED_FORCE=1` | Launch seed script | Deletes launch-tagged jobs |
| Client JSON/i18n fallbacks | Blog, Home, Footer, Static pages | Masks empty DB — site “looks fine” with old defaults |

#### Listing modules (Jobs, Scholarships, etc.)

Use MongoDB via Mongoose — **no startup reset**. Admin-created jobs should persist across restart **if MongoDB data directory persists**. If QA saw listing loss too, verify Mongo durability (not Docker volume loss / fresh `.mongo-data`).

### Persistence Table

| Module | Persists in DB | Lost after restart? | Root cause |
|--------|----------------|---------------------|------------|
| **CMS Homepage** | Yes (Mongo) | **Yes (public view)** | `seedCmsSiteContent()` forces `status: 'draft'` + default hero |
| **CMS Header nav** | Yes | **Yes (public view)** | Same seed overwrites items + draft |
| **CMS Footer nav** | Yes | **Yes (public view)** | Same seed overwrites columns + draft |
| **CMS Static pages** (14 seeded slugs) | Yes | **Yes (public view)** | Seed clears `content`, sets draft |
| **CMS Static pages** (custom slugs) | Yes | **No** | Not in seed list |
| **CMS Banners** | Yes | No | Not touched by seed |
| **Jobs** | Yes | No* | *Unless destructive seed or ephemeral Mongo |
| **Scholarships** | Yes | No* | Same |
| **Admissions** | Yes | No* | Same |
| **Blogs** | Yes | No* | Client shows `SAMPLE_BLOGS` if API empty |
| **Companies / Employers** | Yes | No* | Same |
| **Notifications (broadcast)** | Yes | No | No startup seed |
| **User inbox notifications** | Yes | No | Queue + Mongo |
| **Site settings (Ad slots)** | Yes | No | No startup seed |
| **User profile / saved items** | Yes | No | Mongo + JWT in localStorage |
| **Contact messages** | Yes | No | Mongo |
| **Support tickets** | Yes | No | Mongo |
| **Email queue jobs** | Yes | No | `BackgroundJob` collection |
| **Exam prep / MCQs** | Yes | No* | Same as listings |

### Severity

**P0** — Launch blocker for CMS-managed site content.

### Files Involved

| File | Role |
|------|------|
| `server/src/index.js` | Triggers seed on every boot |
| `server/src/seed/cmsSiteContent.js` | Overwrites CMS documents |
| `server/src/utils/cmsHelpers.js` | `publishedFilter()` |
| `server/src/controllers/cmsController.js` | Public read path |
| `client/src/context/SiteContentContext.jsx` | Fetches published CMS |
| `client/src/pages/Home/Home.jsx`, `Footer.jsx`, `StaticCmsPage.jsx` | i18n fallbacks mask loss |

### Complexity

**Low** — Change seed to insert-only (`$setOnInsert`) or gate with `CMS_SEED_ON_START=1` env flag. **2–4 hours.**

### Risk

Low if insert-only; medium if migration needed for existing deployments.

---

## 7. Notification Delivery Pipeline

### Architecture (as built)

```
Event (application, payment, etc.)
  → automationService.queueNotification / queueEmail
  → jobQueueService.enqueueJob (dedupKey)
  → cron processQueue (every minute)
  → notifyUser / sendTemplatedEmail
  → UserNotification (Mongo) / SMTP
  → NotificationBell polls /api/inbox (60s interval)
```

### Component Verification

| Layer | Status | Notes |
|-------|--------|-------|
| **DB records** | Implemented | `UserNotification` model; `BackgroundJob` queue |
| **Platform bell** | Implemented | `NotificationBell.jsx` — list + unread count |
| **Inbox page** | Implemented | `/notifications` |
| **Email SMTP** | **Not configured locally** | Requires `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` |
| **Email queue** | Implemented | Jobs type `email`; marks completed even on placeholder |
| **Retry / dead letter** | Implemented | `maxAttempts`, `dead` status, admin retry API |
| **Templates** | Implemented | EN/UR in `emailTemplates.js` |
| **Cron worker** | Implemented | `DISABLE_QUEUE_CRON=1` to disable |
| **Automation triggers** | Implemented | C.4 event handlers wired |
| **Analytics** | Implemented | `notification_sent`, `email_sent` events |

### Local Dev Failure Mode (Most Likely Root Cause for “No Email”)

```34:39:server/src/services/emailService.js
if (!transport) {
  console.log('[Email dev placeholder]', { to, subject, template });
  return { sent: false, placeholder: true };
}
```

Health endpoint reports `smtp: not_configured`. Email jobs **complete successfully** in queue but **no email is delivered**. Platform notifications **should still appear** in bell if:

1. Queue cron is running
2. User is authenticated
3. Event handler fired (e.g. job application)

### Decision Tree — “Notification Not Received”

| Symptom | Likely cause |
|---------|--------------|
| No bell + no email | Event not triggered, or queue cron disabled, or dedup blocked duplicate |
| Bell yes, email no | SMTP not configured (expected in dev) |
| Email queued but not sent | Check `BackgroundJob` collection; `dead` status → inspect `lastError` |
| Bell empty, DB has records | Frontend polling issue, wrong user session, or `recipientType` mismatch |
| Staff notification missing | No staff users in DB, or `notifyStaff` target role filter |

### Profile notification prefs gap

User can toggle email/push/whatsapp/telegram in Profile, but **only `email` is consulted** by automation. Push/WhatsApp/Telegram are stored but **never dispatched**.

### Severity

**P0** for production email (must configure SMTP/Brevo)  
**P1** for push/WhatsApp/Telegram (advertised but non-functional)

### Complexity

SMTP config: **ops task (hours)**. Push/WhatsApp/Telegram: **high (weeks each)**.

---

## 8. Persistence Architecture Review — Mock / JSON / In-Memory

| Location | Type | Affects admin data? |
|----------|------|---------------------|
| `server/src/config/redis.js` | In-memory Map fallback | No — API cache only (5 min TTL) |
| `server/src/utils/trendingCache.js` | In-memory Map | No — trending cache |
| `server/src/services/scrapers/ppscScraper.js` | Mock scraper data | Adds demo jobs to Mongo via cron |
| `server/src/data/seedJobs.js` | Static array | **Unused** (dead code) |
| `client/src/constants/seedData.js` | `SAMPLE_*` arrays | **Blog fallback only** (`Blog.jsx`, `BlogPost.jsx`) |
| `client/src/context/AuthContext.jsx` | localStorage JWT | Auth session only |
| `client/src/hooks/useLocalStorage.js` | localStorage | Generic hook |
| `server/src/services/importParserService.js` | Reads upload files | Import input only |

**No mock repositories** for Jobs, CMS, Scholarships, or Notifications admin CRUD. All write to MongoDB.

---

## 9. Console & DevTools Issues Audit

**Source:** DevTools screenshot on `/admin/support` (dark mode, authenticated admin).

### Console

| Type | Count | Notes |
|------|-------|-------|
| **Errors** | 0 | No runtime JS errors observed |
| **Warnings** | 2 | Not captured in screenshot detail — likely React/router or Mongoose-related dev warnings |

### Issues Tab (Chrome)

| Issue | Count | Description |
|-------|-------|-------------|
| Form field missing `id` or `name` | **19** | Prevents autofill; hurts accessibility |
| Label not associated with form field | **2** | `<label>` not linked via `for`/`id` |

### Likely Sources (code review)

- Admin pages with bare `<select>` / `<input>` without `id`, `name`, or `htmlFor` linkage
- `AdminSupport.jsx` filter selects — no `id`/`name`, no `<label>`
- `AdminDataTable` filter row — search input has placeholder but may lack `name`
- Bulk action controls in admin tables

### HTML Root

`<html class="dark" lang="en">` — dark mode correctly applied at document root. Support dropdown issue is **component-level**, not missing dark class.

### Severity

**P1** (accessibility — affects Lighthouse / WCAG)  
**P2** (warnings — investigate individually)

### Complexity

**Medium** — systematic pass over admin forms: 1–2 days.

---

## 10. Profile Page Audit (`/profile`)

### Existing Settings

| Setting | Storage | Backend field |
|---------|---------|---------------|
| Name | MongoDB | `User.name` |
| Province | MongoDB | `User.province` |
| Interests (tags) | MongoDB | `User.interests[]` |
| Preferred language | MongoDB + i18n | `User.preferredLanguage` |
| Notification toggles | MongoDB | `User.notifications.{email,push,whatsapp,telegram}` |
| Saved jobs / scholarships / admissions | Read-only lists | Separate saved API |

### Gaps — Recommended Additions (Platform-Aligned)

| Setting | Rationale | Priority |
|---------|-----------|----------|
| **Change password** | Security baseline | P1 |
| **Email address + verification status** | C.4 verify-email flow exists; profile should show status + resend | P1 |
| **Job alert preferences** | Province + interests exist but no dedicated job-alert frequency/channel UI | P1 |
| **Scholarship / admission deadline alerts** | Ties to C.4 reminder cron | P2 |
| **Resume quick link** | Platform has resume builder + analyzer | P2 |
| **Application history summary** | Link to dashboard applications | P2 |
| **Exam prep progress** | Platform has exam prep module | P2 |
| **Avatar / photo** | Common profile expectation | P2 |
| **Phone number** | Useful for SMS alerts (future) | P2 |
| **Account deletion / export** | GDPR-style compliance | P2 |
| **Remove or hide push/WhatsApp/Telegram** until implemented | Avoid false expectations | P1 |

### Severity

**P2** overall (enhancement); **P1** for password + email verification display.

### Complexity

**Medium** — 3–5 days for P1 items.

---

## 11. Job Offers Dashboard Audit (Employers / Posters)

### What Exists Today

**Employer portal** (company-centric, separate auth):

| Page | Path | Features |
|------|------|----------|
| Dashboard | `/employer/dashboard` | Active jobs, applications, views, shortlisted; recent jobs list |
| Post job | `/employer/post-job` | Form → draft → plan selection → Stripe checkout or free activate |
| My jobs | `/employer/jobs` | Job list management |
| Applications | `/employer/applications` | Applicant pipeline |
| Analytics | `/employer/analytics` | Basic stats |
| Settings | `/employer/settings` | Company profile |
| Public profile | `/employer/:slug` | Company page |

**Monetization:**

- `JobPlan` model — Starter ($1), Standard ($2), Premium ($3) seed prices (**clearly dev/test USD amounts**)
- First job free per employer
- Stripe checkout via `employerApi.createCheckout`
- Payment webhook → `onPaymentSuccess` notification

**Employer model:** `companyName`, `industry`, `companySize` — **no employer type** (individual / agency / SMB / enterprise).

**Submit Opportunity** (`/submit-opportunity`): Static informational page → directs to Contact form. **No self-serve posting for individuals.**

### Gaps for “Person, Agency, Small Business, Big Company”

| Poster type | Supported today? | Gap |
|-------------|-------------------|-----|
| Big company | Partial | Employer portal assumes company account |
| Small business | Partial | Same flow; no SMB-specific pricing tier in PKR |
| Recruitment agency | No | No multi-client posting, no agency branding |
| Individual (hire help) | **No** | Must use Contact form; no dashboard |

### Recommended Future Architecture (Report Only)

```
Poster onboarding
  ├── Account type: Individual | Agency | Business | Enterprise
  ├── Verification tier (basic → verified → trusted) — exists for employers
  └── Profile fields vary by type (CNIC vs company registration)

Unified “Offer a Job” dashboard
  ├── Single entry: /post-job (route by auth type)
  ├── Draft → preview → select plan → pay → moderation queue
  ├── Manage listings, applicants, messaging
  └── Analytics + renew/extend listing

Pricing (Pakistan-focused)
  ├── Free: 1 listing / 7 days (individuals)
  ├── Standard: PKR X / 30 days
  ├── Featured: PKR Y / 30 days + homepage slot
  ├── Agency bundle: N listings / month
  └── Enterprise: custom + invoice

Charge mechanism
  ├── Stripe (existing) with PKR display via Stripe PK support or manual JazzCash/Easypaisa later
  ├── Admin manual payment approval (exists in payments admin)
  └── Subscription for agencies (extend JobPlan model)
```

### Severity

**P1** — Core revenue feature incomplete for non-company posters and PKR market.

### Complexity

**High** — Employer type system + unified dashboard: 2–3 weeks.

---

## 12. Production Readiness Review — Remaining Launch Blockers

### P0 — Must fix before launch

| # | Blocker | Evidence |
|---|---------|----------|
| 1 | **CMS seed resets published content on every deploy/restart** | `server/src/index.js` + `cmsSiteContent.js` |
| 2 | **Production SMTP/Brevo not verified** | `emailService.js` requires `MAIL_*`; health shows `not_configured` in dev |
| 3 | **MongoDB backup + persistent volume verified** | Local `.mongo-data` is fragile; Atlas backup drill not confirmed |
| 4 | **Manual QA sign-off incomplete** | C.5 checklist in `docs/SPRINT_C5_LAUNCH_READINESS.md` |

### P1 — Should fix before launch

| # | Item |
|---|------|
| 5 | Support page dark-mode selects |
| 6 | Navbar logout overflow (account dropdown) |
| 7 | Staff invitation workflow (no invite-by-email) |
| 8 | Admin temp password shown in toast only — not emailed |
| 9 | Job plan pricing in USD test amounts — needs PKR production catalog |
| 10 | Employer portal: no individual/agency poster path |
| 11 | Profile: password change + email verification status |
| 12 | Hide non-functional push/WhatsApp/Telegram toggles |
| 13 | Accessibility: 19 missing form `id`/`name`, 2 unlabeled fields |
| 14 | Brevo mentioned in deployment docs but code uses generic `MAIL_*` — align env docs |

### P2 — Post-launch or fast-follow

| # | Item |
|---|------|
| 15 | Admin horizontal tabs → sidebar |
| 16 | Centralized slug service + URL preview |
| 17 | Employer dashboard dark mode (hardcoded light `#0F172A` palette) |
| 18 | Remove/gate `SAMPLE_BLOGS` fallback in production |
| 19 | Native `<select>` option styling — consider headless Select component |
| 20 | Lighthouse pass on staging (targets in C.5) |
| 21 | Profile expansion (exam prep, alerts, avatar) |
| 22 | Agency/enterprise job posting tiers |

---

## Recommended Implementation Order

```
Phase 1 — Blockers (C.6.1)     ~1–2 days
  1. Fix CMS seed (insert-only / env gate)
  2. Verify Mongo persistence + backup drill
  3. Configure production SMTP; test email end-to-end

Phase 2 — Critical UX (C.6.2)  ~1 week
  4. Shared AdminSelect + fix AdminSupport
  5. Navbar account dropdown (logout always visible)
  6. Staff invitation flow (model + API + page)
  7. Profile password + email verification UI
  8. Hide placeholder notification channels

Phase 3 — Platform (C.6.3)     ~2–3 weeks
  9. Admin sidebar layout
  10. Slug service + admin preview
  11. Employer type + PKR pricing catalog
  12. Accessibility form audit
  13. Individual/agency job posting path
```

---

## Risk Assessment Summary

| Change | Risk | Mitigation |
|--------|------|------------|
| CMS seed fix | Low | Insert-only; test publish survives restart |
| Navbar dropdown | Low | Visual QA at 768px, 1024px, 1280px |
| Invitations | Medium | Super Admin only; audit log; token expiry |
| Admin sidebar | Medium | Feature-flag layout; role-based QA |
| Slug service | Medium | Redirects on slug change; don’t rewrite published slugs |
| Employer expansion | High | Phased rollout; keep existing employer flow |

---

## Appendix — Key File Index

| Area | Files |
|------|-------|
| CMS seed bug | `server/src/index.js`, `server/src/seed/cmsSiteContent.js` |
| Support dropdown | `client/src/pages/Admin/AdminSupport.jsx` |
| Admin select standard | `client/src/components/admin/AdminTableFilters.jsx`, `AdminImageUrlField.jsx` |
| Navbar | `client/src/components/layout/Navbar.jsx`, `DrawerMenu.jsx` |
| Admin nav | `client/src/pages/Admin/Admin.jsx` |
| Slugs | `server/src/utils/slugify.js`, `server/src/utils/bulkUpsert.js` |
| Notifications | `server/src/services/automationService.js`, `jobQueueService.js`, `notificationService.js`, `emailService.js` |
| Invitations (missing) | `server/src/controllers/admin/usersController.js` (assignRole only) |
| Profile | `client/src/pages/Profile/Profile.jsx`, `server/src/controllers/profileController.js` |
| Employer dashboard | `client/src/pages/Employer/*`, `server/src/models/Employer.js`, `server/src/seed/jobPlans.js` |
| Persistence fallbacks | `client/src/constants/seedData.js`, `client/src/pages/Blog/Blog.jsx` |

---

**End of audit.** No code was modified. Implementation should begin only after review and prioritization of this report.
