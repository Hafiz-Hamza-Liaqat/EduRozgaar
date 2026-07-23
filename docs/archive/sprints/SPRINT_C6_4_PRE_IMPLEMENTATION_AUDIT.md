# Sprint C.6.4 — Pre-Implementation Audit (Read-Only)

**Date:** 2026-07-12  
**Mode:** Read-only investigation — no code changes  
**Sprint focus:** Platform UX & Information Architecture (no core business logic changes)  
**Prerequisites:** C.6.1 (CMS persistence), C.6.2 (navbar/account menu), C.6.3 (admin selects, invitations, profile ops)

---

## Executive Summary

EduRozgaar has a **functionally complete** platform with strong RBAC, lazy-loaded routes, a structured multi-locale CMS, and a production-grade employer sidebar pattern. The primary C.6.4 pain points are **admin wayfinding at scale** (33 horizontal tabs inside site chrome), **fragmented slug management** (no centralized service, inconsistent admin UI), and **student/employer account UX fragmentation** (profile monolith, dual notification systems, employer settings stub).

C.6.4 should prioritize **layout and IA changes that do not alter business rules**: admin sidebar + shared nav config, SlugService + unified URL preview component, and lightweight student account route split. Employer portal expansion and CMS page-builder work remain **out of scope** for this sprint (document readiness only).

### Maturity Snapshot

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Platform maturity** | **74%** | Core listings, auth, payments, CMS publish workflow, employer portal MVP, resume builder, and staff invitations are implemented. Remaining gaps are UX polish and slug/CMS parity, not missing core features. |
| **UX maturity** | **62%** | C.6.2 account dropdown and C.6.3 form consistency improved public/admin chrome. Admin still uses 33 scroll-tabs; student profile is overloaded; employer settings is read-only. |
| **Admin maturity** | **58%** | 34 routes with RBAC guards, shared `AdminFormFields`, staff invitations. Tab/route config drift, 4 pages without `AdminRouteGuard`, no sidebar, no slug preview. |
| **Architecture maturity** | **68%** | Lazy routes, dual RBAC configs, audit logging, CMS models with publish workflow. Slug logic duplicated across 12+ models/controllers; no reserved-word blocklist; pre-save hooks can overwrite custom slugs. |

### Go / No-Go Recommendation

**Ready for implementation** — with **deferrals**:

| Proceed in C.6.4 | Defer beyond C.6.4 |
|------------------|-------------------|
| Admin sidebar + IA grouping | Visual page builder |
| Shared `adminNavConfig.js` | Full employer portal redesign |
| SlugService + URL preview component | CMS block registry / WYSIWYG |
| Student account route split (`/settings`) | Employer job edit + billing (separate sprint) |
| RBAC guard alignment + legacy route cleanup | Raw `<input>`/`<textarea>` migration (~150 fields) |
| Accessibility fixes on new/changed chrome | Slug redirect middleware (unless slug edits ship) |

**Justification:** Sidebar and SlugService are well-scoped, have an existing pattern (`EmployerLayout.jsx`), and do not require API contract changes if routes stay the same. SlugService touches many files but can be introduced incrementally behind existing endpoints. Student `/settings` split is low-risk routing-only work. Defer page-builder and employer feature expansion — they are multi-week efforts unrelated to IA.

---

## Coverage Matrix

| Area | Current State | Recommended Change | Priority | Complexity |
|------|---------------|-------------------|----------|------------|
| Admin navigation | 33 horizontal `scroll-tabs` in `Admin.jsx` inside `MainLayout` | Grouped left sidebar + mobile drawer; optional exit from site Navbar/Footer | **P0** | Medium (3–5 days) |
| Admin nav config | `TAB_DEFS` in `Admin.jsx` separate from `routes/index.jsx` | Single `adminNavConfig.js` (path, label, group, permission) | **P0** | Low (4–8 hrs) |
| Slug architecture | `slugify.js` + per-model pre-save hooks | Central `SlugService` (normalize, unique, reserved, preview URL) | **P1** | Medium–High (2–3 days) |
| URL preview (admin) | Table-level “View public” links only; no form preview/copy | Shared `AdminSlugField` + availability API | **P1** | Medium (2 days) |
| Admin IA grouping | Flat tab list | 8 logical groups (see §4) | **P0** | Low (part of sidebar) |
| CMS architecture | Structured CMS (hero, nav, static HTML, banners) | Document readiness; expose missing model fields in admin | **P2** | Medium (1–2 days parity) |
| Employer UX | Sidebar portal; no job edit; settings stub | UX labels/copy only in C.6.4; feature gaps documented | **P3** | N/A (defer features) |
| Student UX | Dashboard strong; profile monolith; dual notifications | Split `/settings`; unify saved-list coverage; inbox link | **P2** | Medium (2–3 days) |
| Profile architecture | Single `/profile` route | `/profile` + `/settings` (+ optional `/account/security`) | **P2** | Low–Medium |
| Accessibility | Employer sidebar good; admin forms mostly lack `id`/`htmlFor` | Sidebar ARIA, focus trap, keyboard nav; migrate touched forms | **P1** | Medium (ongoing) |
| Mobile UX | Admin horizontal scroll; site drawer works | Admin mobile drawer; reduce triple chrome | **P0** | Medium (with sidebar) |
| Performance | Admin pages already lazy-loaded | Debounced slug check; no extra bundle concern | **P3** | Low |

---

## Risk Matrix

| Change | Regression Risk | Why |
|--------|-----------------|-----|
| Admin sidebar shell | **Medium** | Touches layout wrapper for all `/admin/*`; active-state and permission filtering must match current behavior |
| Exit admin from `MainLayout` | **Medium** | Staff lose site nav context; need “Back to site” link; SEO/noindex unchanged |
| `adminNavConfig` extraction | **Low** | Refactor-only if paths unchanged |
| SlugService introduction | **High** | Pre-save hook changes can alter published URLs; duplicate actions may behave differently |
| Slug “lock after publish” | **High** | SEO impact; needs redirect strategy (defer or pair with redirect table) |
| URL preview component | **Low** | Additive UI; no API change required for read-only preview |
| Student `/settings` route | **Low** | New route + menu link; `/profile` remains |
| CMS admin field parity | **Low** | Exposes existing model fields only |
| RBAC guard alignment | **Low** | Tightens security on 4 unguarded pages |
| Remove `/admin/activity` alias | **Low** | Add redirect to `/admin/audit` |

---

## 1. Admin Navigation Architecture

### Current State

**Layout:** Admin renders inside `MainLayout` (site `Navbar` + `Footer` + admin content). Not isolated like the employer portal.

**Navigation:** `client/src/pages/Admin/Admin.jsx` defines **33 tabs** in `TAB_DEFS`, filtered by `usePermissions().can()`. Horizontal `scroll-tabs` nav with exact pathname matching for active state.

```17:61:client/src/pages/Admin/Admin.jsx
const TAB_DEFS = [
  { path: ROUTES.ADMIN, labelKey: 'overview', perm: PERMISSIONS.ANALYTICS_READ },
  { path: `${ROUTES.ADMIN}/moderation`, labelKey: 'moderation', perm: [PERMISSIONS.MODERATE_JOBS, PERMISSIONS.MODERATE_EMPLOYERS] },
  // ... 31 more entries
];
```

**Routes:** **34 child routes** under `/admin` in `client/src/routes/index.jsx`. All admin page components are **already lazy-loaded**.

**Permissions (4 layers):**

1. `ProtectedRoute requireStaff` — route gate
2. Tab visibility — client filter in `Admin.jsx`
3. `AdminRouteGuard` — page-level (~30 pages)
4. API auth — server RBAC

**Gaps:**

| Issue | Detail |
|-------|--------|
| Tab/route drift | `/admin/activity` → `AuditLogPage` has **no tab** (legacy alias) |
| Permission mismatch | Moderation tab: `moderate:jobs`, `moderate:employers`; page also uses `moderate:reports`, `moderate:ads` |
| Unguarded pages | `AIJobGenerator`, `GrowthDashboard`, `AlertsAdmin`, `AdminImport` rely on tab hiding only |
| Active state | Exact match only; no nested route support |
| Scroll | `.scroll-tabs` horizontal scroll; **no** auto-scroll active tab into view; **no** overflow affordance |
| Mobile | Triple chrome (site navbar + 33 tabs + page content); active tab often off-screen |
| `max-w-6xl` | Constrains admin content width even on wide monitors |

### Recommendation: Replace with Persistent Left Sidebar

**Verdict: Yes.** At 33 items, horizontal tabs have hit a scalability ceiling. `EmployerLayout.jsx` provides a proven pattern: `lg:` fixed sidebar, mobile overlay drawer, `aria-current="page"`, body scroll lock, 44px touch targets.

**Proposed sidebar groups (collapsible on desktop, accordion in mobile drawer):**

| Group | Items |
|-------|--------|
| **Dashboard** | Overview (`/admin`), Analytics, Growth, Monitoring, Platform ops |
| **Content** | Jobs, Scholarships, Admissions, Blogs, Internships, Universities, Intl scholarships, Foreign studies, Career guidance, Companies, Institutions, Webinars, Exam prep, Site CMS |
| **Moderation & trust** | Moderation queue, Advertisements, Audit log |
| **Users & communication** | Users, Staff invitations, Employers, Contact messages, Support, Notifications, Newsletter, Alerts |
| **Revenue** | Payments |
| **Tools & AI** | Import, AI job generator |

**Implementation options:**

| Option | Scope | Effort | Regression |
|--------|-------|--------|------------|
| A. Patch tabs | Auto-scroll, mobile `<select>` picker | 4–8 hrs | Low |
| B. Sidebar in MainLayout | Grouped sidebar + drawer; keep site chrome | 2–3 days | Medium |
| **C. Full admin portal (recommended)** | Sidebar + leave MainLayout + `adminNavConfig` + guard cleanup | **3–5 days** | Medium |

**Sidebar requirements checklist:**

- [ ] Permission-aware rendering (same logic as `TAB_DEFS`)
- [ ] Collapsible section headers with persisted state (`localStorage`)
- [ ] Mobile hamburger → left drawer (reuse Employer overlay pattern)
- [ ] `aria-current="page"` on active link
- [ ] Focus trap + Escape to close drawer
- [ ] “Back to site” link in sidebar header
- [ ] Auto-expand group containing active route

---

## 2. Slug Architecture

### Inventory

**Central utility:** `server/src/utils/slugify.js` — `slugify()` plus domain helpers (`jobSlug`, `blogSlug`, `companySlug`, etc.).

**SlugService:** Does **not** exist. Planned in `docs/SPRINT_C6_POST_QA_AUDIT.md`.

| Entity | Model | Unique index | Generation | Admin slug field | View public link |
|--------|-------|--------------|------------|------------------|------------------|
| Jobs | `Job.js` | yes | `jobSlug(title, location)` | yes | yes |
| Scholarships | `Scholarship.js` | yes | `scholarshipSlug(title, country)` | yes | yes |
| Admissions | `Admission.js` | yes | `admissionSlug(program, institution)` | in state, not in form | yes |
| Blogs | `Blog.js` | yes | `blogSlug(title)` | yes | yes |
| Foreign studies | `ForeignStudy.js` | yes | `foreignStudySlug(...)` | **no** | yes |
| Companies | `Company.js` | yes | `companySlug(name)` | yes | yes |
| Universities | `University.js` | sparse | `universitySlug(name)` | yes ( **ignored by server** ) | yes |
| Career articles | `CareerArticle.js` | yes | `careerArticleSlug(title)` | yes | yes |
| Internships | `Internship.js` | yes | `slugify(title)-{id6}` | yes | yes |
| Institutions | `Institution.js` | yes | `slugify(name)` | **no** | **no** |
| CMS static pages | `CmsStaticPage.js` | `{slug, locale}` | `blogSlug(title)` if empty | yes | site preview only |
| CMS navigation | `CmsNavigation.js` | n/a | manual paths in items | path strings | n/a |
| Employers | `Employer.js` | sparse | seed only; **not set on register** | **no** | **no** |
| Intl scholarships | `IntlScholarship.js` | **none** | not generated | yes ( **not persisted** ) | `_id` fallback |
| Webinars | `Webinar.js` | **none** | create-time only | **no** | **no** |
| Exams / Quizzes | `Exam.js`, `Quiz.js` | exam yes | various | **no** | **no** |

### Uniqueness & Validation

| Mechanism | Where | Coverage |
|-----------|-------|----------|
| MongoDB `unique: true` | Most models | Admin CRUD — raw E11000 errors |
| `ensureSlugUnique()` | `bulkUpsert.js` | Import + seed only |
| `makeSlugUnique()` | `scraperService.js` | In-memory during scrape |
| Timestamp suffix | `employerController.js` job create | Employer jobs only |
| Pre-save hooks | 12+ models | **Regenerate on title change — can overwrite custom slug** |

### Reserved Routes

**Employer public profile only:**

```12:18:client/src/pages/Public/EmployerPublicProfile.jsx
const RESERVED = ['jobs', 'settings', 'applications', 'analytics', 'login', 'register', 'new'];
```

**Static CMS pages:** Fixed React routes in `staticCmsPages.jsx` (`about`, `faq`, `privacy-policy`, etc.).

**SEO landing paths:** `/jobs-in-:slug`, province/category landings, etc. — must be in server blocklist.

**No global reserved-slug blocklist** on server (`admin`, `api`, `auth`, `employer`, …).

### SEO & Redirects

- Slug changes today **do not** create redirects — broken inbound links on title rename.
- Pre-save regeneration on update is an **SEO regression risk**.
- Recommend: SlugService + optional `SlugRedirect` collection (defer implementation unless slug edit UX ships).

### Recommendation: Introduce SlugService

**Verdict: Yes** — centralize normalize → validate → ensureUnique → previewUrl → reserved check.

**Proposed API surface:**

```
SlugService
  ├── normalize(text, { maxLength })
  ├── isReserved(slug) → boolean
  ├── ensureUnique(Model, baseSlug, { excludeId, locale? })
  ├── previewUrl(resourceType, slug, { locale? })
  └── shouldRegenerate(doc, changedFields) → boolean  // respect slug lock
```

**Files affected (implementation touch list):**

| Layer | Files |
|-------|-------|
| **New** | `server/src/services/slugService.js`, optional `GET /api/admin/slugs/check` |
| **Models (pre-save)** | `Job.js`, `Scholarship.js`, `Admission.js`, `Blog.js`, `ForeignStudy.js`, `Exam.js`, `Company.js`, `University.js`, `CareerArticle.js`, `Internship.js`, `Institution.js`, `CmsStaticPage.js`, `ResumeTemplateCatalog.js` |
| **Admin controllers** | `adminJobsController.js`, `adminScholarshipsController.js`, `adminAdmissionsController.js`, `adminBlogsController.js`, `adminCareerArticlesController.js`, `adminCompaniesController.js`, `adminForeignStudiesController.js`, `adminInternshipsController.js`, `adminInstitutionsController.js`, `adminExamsController.js`, `adminWebinarsController.js`, `adminIntlScholarshipsController.js`, `cmsController.js` |
| **Services** | `importHandlers.js`, `scraperService.js`, `employerController.js`, `blogAutoGenerateService.js`, `bulkUpsert.js` |
| **Seeds** | `seed/jobs.js`, `seed/scholarships.js`, `seed/admissions.js`, `seed/blogs.js`, `seedLaunchContent.js`, `seedListings.js`, `seedPhase4.js`, `seedPhase8.js`, `seedPhase9.js` |
| **Client admin** | 12+ content admin pages + new shared component |
| **Reserved routes** | `EmployerPublicProfile.jsx`, `routes/index.jsx`, `staticCmsPages.jsx` |

**Rollout strategy:** Phase 1 — service + admin create/update paths only; Phase 2 — model hooks delegate to service; Phase 3 — slug lock + redirects.

---

## 3. URL Preview System

### Current Admin Coverage

| Page | Slug in form | Live URL preview | Copy URL | Open page | Duplicate detection |
|------|-------------|-------------------|----------|-----------|---------------------|
| AdminContentJobs | yes | no | no | table link | no (Mongo 409) |
| AdminContentScholarships | yes | no | no | table link | no |
| AdminContentAdmissions | partial | no | no | table link | no |
| AdminContentBlogs | yes | no | no | table link | no |
| AdminContentInternships | yes | no | no | table link | no |
| AdminContentUniversities | yes | no | no | table link | no |
| AdminCompanies | yes | no | no | table link | no |
| AdminCareerGuidance | yes | no | no | table link | no |
| AdminIntlScholarships | yes | no | no | table link | no |
| AdminForeignStudies | no | no | no | table link | no |
| AdminInstitutions | no | no | no | no | no |
| AdminExamPreparation | no | no | no | no | no |
| AdminWebinars | no | no | no | no | no |
| AdminSiteCms | yes (static) | no | no | “Preview site” global | no |
| AdminEmployers | no | no | no | no | no |

**Clipboard elsewhere:** `UserAccountMenu.jsx` (user ID), `BlogPost.jsx` (share URL) — not slug-related.

### Recommendation: Unified `AdminSlugField` Component

**Props:** `resourceType`, `value`, `onChange`, `basePath`, `locale?`, `readOnly?`, `locked?`

**Features:**

1. Debounced slug input with `adminFieldClass` styling
2. Live canonical URL chip (`https://edurozgaar.pk/jobs/my-slug`)
3. Copy button (`navigator.clipboard`)
4. Open-in-new-tab button
5. Availability indicator (calls `GET /admin/slugs/check?type=job&slug=...`)
6. Reserved-word warning
7. Optional “Lock slug” toggle (disabled until publish)

**Integration order:** Jobs → Scholarships → Blogs → Admissions → Companies → CMS static pages → remaining content types.

---

## 4. Admin Information Architecture

### Current Module Inventory (34 routes)

All modules mapped to recommended navigation groups based on permissions and domain:

| Group | Modules | Primary permission(s) |
|-------|---------|----------------------|
| **Dashboard** | Executive dashboard, Analytics, Growth dashboard, Monitoring, Platform ops | `analytics:read`, `system:settings` |
| **Content — Listings** | Jobs, Scholarships, Admissions, Internships, Intl scholarships, Foreign studies | `content:*` |
| **Content — Media & guides** | Blogs, Career guidance, Webinars, Exam preparation | `content:blogs`, `content:career`, `content:mcqs` |
| **Content — Organizations** | Companies, Universities, Institutions | `content:companies`, `content:universities`, `content:admissions` |
| **Content — Site** | Site CMS | `content:site`, `content:navigation`, `content:pages` |
| **Moderation & trust** | Moderation queue, Advertisements, Audit log | `moderate:*`, `audit:read` |
| **Users** | Users, Staff invitations, Employers | `users:read`, `users:manage` |
| **Communication** | Notifications, Alerts, Newsletter, Contact messages, Support | `system:notifications`, `users:read` |
| **Revenue** | Payments | `payments:read` |
| **Tools & AI** | Import, AI job generator | `content:import`, `content:jobs` |

**IA improvements (no route changes):**

1. Rename “Overview” tab label to “Executive dashboard” in i18n for clarity
2. Consolidate analytics trio (Executive, Analytics, Growth) under Dashboard group with sub-labels
3. Move Import and AI generator to bottom “Tools” section
4. Remove or redirect `/admin/activity` → `/admin/audit`
5. Align moderation tab permissions with `ModerationQueue` guard

---

## 5. CMS Architecture

### Current Structure

| Surface | Model | Admin UI | Public consumption |
|---------|-------|----------|-------------------|
| Homepage | `CmsHomepage` | Hero, stats, section toggles, testimonials, partners | `Home.jsx` via `SiteContentContext` |
| Header nav | `CmsNavigation` (header) | Item editor with children | `useHeaderNavItems.js`, `Navbar.jsx` |
| Footer nav | `CmsNavigation` (footer) | Partial — columns note “edit via seed” | `Footer.jsx` |
| Static pages | `CmsStaticPage` | HTML textarea + slug; **no `sections[]` editor** | `StaticCmsPage` → `CmsPageView` |
| Banners | `CmsBanner` | Full CRUD | Context + placement components |

**Workflow:** Multi-locale (`en`, `ur`, `ar`), draft/publish/archive, scheduled publish, audit log, HTML sanitization, separate publish permission.

### Page-Builder Readiness: **Partial — Not Ready**

| Capability | Backend | Admin | Public |
|------------|---------|-------|--------|
| Fixed schema sections | Yes | Partial | Partial |
| Block registry / layout DSL | No | No | No |
| WYSIWYG | No | No | — |
| `sections[]` on static pages | Yes | **Not exposed** | Yes |
| `studentResources` / `foreignStudyCountries` | In model | **Not exposed** | Hardcoded in `Home.jsx` |
| Footer columns | In model | **Not exposed** | From seed/CMS |
| Draft preview (`?preview=cms`) | API exists | Link in admin | **Not wired** on public `Home` |

**C.6.4 CMS scope (readiness only):** Document gaps; optional **admin parity** slice to expose missing model fields. Do **not** design or implement a page builder.

---

## 6. Employer Platform Review (UX Only)

**Reference layout:** `EmployerLayout.jsx` — sidebar, mobile drawer, isolated auth context.

| Area | Current | UX improvement (C.6.4 safe) |
|------|---------|----------------------------|
| Dashboard | KPI cards + recent jobs | Add empty-state copy; link to post-job CTA |
| Jobs list | Filter by status; external link only | Surface approval/moderation badge; fix broken `/employer/jobs?id=` deep link |
| Job edit | **Missing** | **Defer feature** — document only |
| Applications | Job picker required first | Add helper text; show error on failed status update (currently swallowed) |
| Analytics | Single-job dropdown, 3 metrics | Add “select a job” empty state copy |
| Settings | Read-only stub | Improve copy explaining future editable profile |
| Payments | Checkout on post-job only | **Defer** billing history page |
| Verification | Backend fields exist | Show read-only verification status in settings |

**Do not redesign** employer portal in C.6.4. Feature gaps (job edit, billing) belong in a dedicated employer sprint.

---

## 7. Student Platform Review (UX Only)

| Area | Current | UX improvement |
|------|---------|----------------|
| Dashboard | Applications, saved preview, resumes, referrals, chatbot | Link notification section to `/notifications`; label broadcast vs personal inbox |
| Saved jobs | `/saved-jobs` — jobs, scholarships, admissions only | Extend to match dashboard (internships, intl scholarships) or rename route `/saved` |
| Applications | Dashboard section only | Add “View all” with filters (**defer** dedicated page) |
| Notifications | Bell → `UserNotification`; dashboard → broadcast `Notification` | Clarify labels; cross-link |
| Resume builder | Full wizard at `/resume-builder` | Dashboard PDF link should offer direct download, not only edit URL |
| Profile | Monolith: identity + prefs + password + saved lists | Split per §8 |
| Navbar | Account menu (C.6.2) | Add Saved + Notifications to menu; fix duplicate Profile/Settings links |

---

## 8. Profile & Account Architecture

### Current Routes

```
Student (AuthContext)
├── /dashboard        → activity hub
├── /profile          → identity + prefs + password + saved lists (monolith)
├── /saved-jobs       → partial saved listings
├── /notifications    → personal inbox
└── (no /settings)

Employer (EmployerAuthContext — separate session)
├── /employer/settings → read-only stub
└── no linkage to student /profile
```

### Long-Term Organization (Recommended)

| Route | Contents |
|-------|----------|
| `/profile` | Public-facing identity: name, province, interests, email badge |
| `/settings` | Language, notification channels (email only until SMTP channels ship), theme preference |
| `/account/security` or section in `/settings` | Email verification, change password, `mustChangePassword` banner |
| `/saved` | All saved entity types + unsave actions |

**Account menu (`UserAccountMenu.jsx`):**

- Profile → `/profile`
- Settings → `/settings` (currently both point to `/profile`)
- Saved → `/saved-jobs` (or `/saved`)
- Notifications → `/notifications`

**C.6.4 minimum:** Add `/settings` route with notification + language prefs moved from Profile; update menu links. Keep password on Profile or move to Settings — team preference; moving to Settings is cleaner long-term.

---

## 9. Accessibility Review

### Strengths

| Area | Evidence |
|------|----------|
| Employer sidebar | `aria-current="page"`, `aria-expanded` on menu button, 44px targets |
| User account menu | Click-outside close, keyboard-focusable items |
| Admin form fields (C.6.3) | `AdminInput`/`AdminSelect`/`AdminTextarea` with `id`, `name`, `htmlFor`, `aria-describedby` |
| Admin invitations | `aria-label` on filter controls |
| Job admin modal | `role="dialog"`, `aria-modal="true"` |

### Gaps

| Area | Issue | Priority |
|------|-------|----------|
| Admin CRUD forms | ~150+ raw `<input>`, ~50+ raw `<textarea>` without `id`/`htmlFor` | P2 |
| Admin horizontal tabs | No `aria-label` on nav; no roving tabindex | P1 (fixed by sidebar) |
| Admin sidebar (future) | Needs focus trap, Escape close, skip link | P0 when built |
| AdminSupport | Reply textarea dark mode (C.6.3 partial) | P1 |
| Tables | Many action buttons lack accessible names | P2 |
| CMS HTML editor | Raw textarea — no accessible rich-text alternative | P3 |
| Color contrast | Mint primary on light bg — spot-check needed | P3 |
| Live regions | Toast-only feedback; no `aria-live` for async saves | P3 |

**Sidebar readiness:** Employer layout proves the pattern. Admin sidebar should copy: `aria-expanded`, focus trap, `aria-current`, body scroll lock.

---

## 10. Mobile UX

| Surface | Current | Improvement |
|---------|---------|-------------|
| Site navbar | C.6.2 account dropdown + drawer | Adequate for launch |
| Admin | 33-tab horizontal scroll inside site chrome | **Admin mobile drawer** (C.6.4 primary) |
| Admin content | `max-w-6xl` | Consider full-width when sidebar ships |
| CMS admin | Tabbed editor; long forms | Sticky save bar; section tabs already OK |
| Employer portal | Dedicated drawer sidebar | Reference implementation — no change |
| Student dashboard | Responsive grid | Saved section truncation — add “View all” |
| Profile | Long single page | Section anchors or split routes |
| Tables (admin) | Horizontal scroll on small screens | Already present; preserve in sidebar layout |

---

## 11. Performance

### Current Baseline

- All admin routes **lazy-loaded** via `lazyLoad()` in `routes/index.jsx`
- Admin shell (`Admin.jsx`) is lightweight — tab map only
- Permission fetch cached per role in `usePermissions`

### Estimated C.6.4 Impact

| Addition | Impact | Mitigation |
|----------|--------|------------|
| Sidebar rendering | **Negligible** (~2 KB JSX + nav config) | Static config; no API calls |
| Collapsible groups | Negligible | `localStorage` for state |
| Mobile drawer | Negligible | Conditional render |
| Slug availability check | **Low network** | Debounce 300–500 ms; abort in-flight |
| URL preview component | Negligible | Pure display |
| SlugService (server) | **Low CPU** on save | Only on create/update/duplicate |

### Lazy-Loading Opportunities

| Opportunity | Benefit | Recommendation |
|-------------|---------|----------------|
| Admin page components | Already lazy | No change |
| `adminNavConfig.js` | Tiny | Eager import OK |
| Slug check API | On demand | Do not prefetch |
| CMS preview iframe | Heavy | Lazy mount on “Preview” click only |
| Chart libraries (Analytics, Growth) | Medium | Already behind lazy routes |

**Verdict:** C.6.4 changes should not materially affect bundle size or LCP. Slug debouncing is the only new runtime concern.

---

## 12. Regression Risk by Module

| Module | Risk | Why |
|--------|------|-----|
| `Admin.jsx` / new `AdminLayout` | **High** | All admin pages change wrapper |
| `routes/index.jsx` | **Medium** | Possible MainLayout restructure for admin |
| `adminNavConfig` (new) | **Low** | Additive if paths unchanged |
| RBAC / `AdminRouteGuard` | **Low** | Alignment only |
| All 30+ admin pages | **Medium** | Layout width, scroll context |
| `slugify.js` / model hooks | **High** | URL generation behavior |
| Admin content CRUD (12 pages) | **Medium** | New slug field component |
| Public detail pages | **Low** | No change if slugs stable |
| CMS publish workflow | **Low** | Unaffected unless slug parity touched |
| Employer portal | **Low** | Out of scope except copy fixes |
| Student Profile/Dashboard | **Medium** | Route split may break bookmarks |
| `UserAccountMenu` | **Low** | Menu link updates |
| `Navbar` / `MainLayout` | **Medium** | If admin exits MainLayout |
| i18n admin labels | **Low** | New group section keys |
| Verify scripts | **Low** | May need admin nav assertions |

---

## Recommended Sprint Plan

Split C.6.4 into four implementation slices with clear dependencies:

### C.6.4.1 — Admin Sidebar & IA Foundation (3–5 days)

**Goal:** Replace horizontal tabs with grouped sidebar; single nav config source.

**Deliverables:**

- `client/src/config/adminNavConfig.js` (groups, paths, permissions, label keys)
- `client/src/layouts/AdminLayout.jsx` (sidebar + mobile drawer)
- Refactor `Admin.jsx` to use layout + `<Outlet />`
- Optional: move admin route tree outside `MainLayout`
- Redirect `/admin/activity` → `/admin/audit`
- Add `AdminRouteGuard` to 4 unguarded pages
- i18n keys for group headers

**Acceptance:** All 33 tabs reachable; permissions match current behavior; mobile drawer works; no route path changes.

### C.6.4.2 — SlugService (Backend) (2–3 days)

**Goal:** Central slug logic without changing public URLs for existing records.

**Deliverables:**

- `server/src/services/slugService.js`
- `GET /api/admin/slugs/check`
- Wire admin create/update + duplicate actions (jobs, scholarships, blogs first)
- Reserved-word blocklist
- Friendly 409 → validation message

**Acceptance:** Duplicate slug returns 400 with message; import still works; existing slugs unchanged on read.

### C.6.4.3 — URL Preview Component (2 days)

**Goal:** Unified admin slug UX on top content pages.

**Deliverables:**

- `client/src/components/admin/AdminSlugField.jsx`
- Integrate into Jobs, Scholarships, Blogs, Admissions, Companies, CMS static pages
- Table “View public” retained as secondary action

**Acceptance:** Live URL, copy, open, availability indicator on integrated pages.

### C.6.4.4 — Account IA & Polish (2–3 days)

**Goal:** Student account organization + remaining slug integrations + a11y on touched surfaces.

**Deliverables:**

- `/settings` route; update `UserAccountMenu` links
- Slug field on remaining content admins (foreign studies, institutions, webinars, etc.)
- Fix AdminSupport textarea dark mode
- Saved list coverage alignment (dashboard ↔ saved page)
- Employer settings copy improvements
- Update `scripts/verify-sprint-c6-4.mjs`

**Acceptance:** Profile vs Settings separated; menu links correct; slug gaps closed on remaining admins.

**Total estimated effort:** **9–13 days** (1 developer, including QA buffer)

---

## Files Likely to Change

### New files

| File | Slice |
|------|-------|
| `client/src/config/adminNavConfig.js` | C.6.4.1 |
| `client/src/layouts/AdminLayout.jsx` | C.6.4.1 |
| `server/src/services/slugService.js` | C.6.4.2 |
| `server/src/config/reservedSlugs.js` | C.6.4.2 |
| `client/src/components/admin/AdminSlugField.jsx` | C.6.4.3 |
| `client/src/pages/Settings/Settings.jsx` | C.6.4.4 |
| `scripts/verify-sprint-c6-4.mjs` | C.6.4.4 |
| `docs/SPRINT_C6_4_IMPLEMENTATION_REPORT.md` | Post-impl |

### Modified files (by slice)

**C.6.4.1 — Admin shell**

- `client/src/pages/Admin/Admin.jsx`
- `client/src/routes/index.jsx`
- `client/src/layouts/MainLayout.jsx` (if admin exits)
- `client/src/pages/Admin/AIJobGenerator.jsx`, `GrowthDashboard.jsx`, `AlertsAdmin.jsx`, `AdminImport.jsx` (add guards)
- `client/public/locales/en/admin.json` (+ ur, ar)
- `client/src/components/admin/AdminRouteGuard.jsx` (if shared helpers extracted)

**C.6.4.2 — SlugService**

- `server/src/utils/slugify.js` (delegate or deprecate helpers)
- `server/src/utils/bulkUpsert.js`
- `server/src/routes/admin.js` (slug check endpoint)
- 13 admin controllers (listed in §2)
- 12 model pre-save hooks
- `server/src/services/importHandlers.js`, `scraperService.js`, `employerController.js`

**C.6.4.3 — URL preview**

- `client/src/pages/Admin/AdminContentJobs.jsx`
- `client/src/pages/Admin/AdminContentScholarships.jsx`
- `client/src/pages/Admin/AdminContentBlogs.jsx`
- `client/src/pages/Admin/AdminContentAdmissions.jsx`
- `client/src/pages/Admin/AdminCompanies.jsx`
- `client/src/pages/Admin/AdminSiteCms.jsx`
- `client/src/api/adminApi.js` (slug check method)

**C.6.4.4 — Polish**

- `client/src/pages/Profile/Profile.jsx`
- `client/src/pages/Settings/Settings.jsx`
- `client/src/components/layout/UserAccountMenu.jsx`
- `client/src/pages/SavedJobs/SavedJobs.jsx`
- `client/src/pages/Dashboard/Dashboard.jsx`
- `client/src/pages/Admin/AdminForeignStudies.jsx`, `AdminInstitutions.jsx`, `AdminWebinars.jsx`, `AdminExamPreparation.jsx`, `AdminIntlScholarships.jsx`, `AdminContentUniversities.jsx`, `AdminContentInternships.jsx`, `AdminCareerGuidance.jsx`
- `client/src/pages/Admin/AdminSupport.jsx`
- `client/src/pages/Employer/EmployerSettings.jsx`
- `server/src/controllers/adminIntlScholarshipsController.js` (persist slug)
- `server/src/controllers/employerAuthController.js` (employer slug on register — optional)

---

## Estimated Timeline

| Slice | Effort | Dependencies |
|-------|--------|--------------|
| C.6.4.1 Admin sidebar & IA | 3–5 days | None |
| C.6.4.2 SlugService | 2–3 days | None (parallel with 4.1) |
| C.6.4.3 URL preview | 2 days | C.6.4.2 slug check API |
| C.6.4.4 Account IA & polish | 2–3 days | C.6.4.1 (menu), C.6.4.3 (pattern) |
| QA + role matrix testing | 1–2 days | All slices |
| **Total** | **10–15 days** | |

**Parallelization:** C.6.4.1 and C.6.4.2 can run concurrently by different developers.

---

## Preconditions & Investigation Items

Before starting C.6.4.1:

1. Confirm admin should exit `MainLayout` (product decision) — affects Navbar presence on admin pages
2. Restore `admin@edurozgaar.pk` password if QA account was reset during C.6.3 verification
3. Run `verify-sprint-c6-1.mjs` and `verify-sprint-c6-3.mjs` — baseline green

Before starting C.6.4.2:

1. Decide slug lock behavior on title rename (default: preserve slug unless explicitly unlocked)
2. Decide redirect strategy (defer vs implement `SlugRedirect` model)
3. Fix known bugs: university slug ignored, intl scholarship slug not persisted, employer slug missing on register

---

## Appendix A — Prior Sprint Context

| Sprint | Status | Relevance to C.6.4 |
|--------|--------|-------------------|
| C.6.1 | Done | CMS persistence fixed — safe to improve CMS admin UX |
| C.6.2 | Done | Navbar/account menu — admin sidebar complements, not replaces |
| C.6.3 | Done | `AdminFormFields`, invitations — sidebar and slug field should reuse these primitives |
| Post-QA audit | Reference | Items 2 (slug), 4 (sidebar), 16 (SlugService) directly inform C.6.4 |

---

## Appendix B — Verification Plan (Post-Implementation)

| Check | Method |
|-------|--------|
| Admin nav completeness | Script: every route in `adminNavConfig` has component + permission |
| Role matrix | Manual: Editor, Moderator, Admin, SuperAdmin — sidebar items match tabs |
| Mobile drawer | Manual: iPhone width — hamburger, focus trap, active highlight |
| Slug uniqueness | API: create duplicate slug → 400 with message |
| Slug preview | Manual: copy + open on Jobs admin form |
| Profile/settings split | Manual: menu links, no duplicate content |
| Regression | `verify-sprint-c6-1.mjs`, `verify-sprint-c6-3.mjs`, client build |
| Accessibility spot-check | axe or Lighthouse on admin sidebar + slug field |

---

*End of audit. No code was modified. Implementation should follow slice order above.*
