# EduRozgaar — Admin Panel Pre-Launch Audit Report

**Date:** July 10, 2026  
**Phase:** Audit only — **no implementation**  
**Goal:** Make the Admin Panel the complete control center for EduRozgaar

---

## Executive Summary

EduRozgaar has a **strong operations backend** (RBAC, audit logs, moderation APIs, broad CRUD on 15+ content types, bulk import, executive analytics from MongoDB) but a **thin admin UI** (~11 tabs) that surfaces only **~20%** of backend capability.

| Dimension | Maturity | Notes |
|-----------|----------|-------|
| Backend admin API | **High** | Full CRUD for most content types |
| Admin UI | **Low–Medium** | 3 content types with minimal UI; rest API/import only |
| CMS / page editing | **Very Low** | Static pages, nav, footer are i18n files |
| Moderation | **Medium** | Jobs + employers; reports/ads read-only |
| Analytics | **Medium–High** | Real DB metrics; gaps in AI/resume/email KPIs |
| SEO admin | **None** | Public SEO strong; no admin CMS |
| Media library | **None** | URL fields only; resume/import uploads exist |
| Payments admin | **None** | Stripe works for employers; no admin UI |
| Support tickets | **None** | Static pages only |

**Recommended strategy:** Implement in small, verifiable phases — **UI for existing APIs first**, then **CMS layer**, then **workflow/SEO/media**.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client: /admin/* (ProtectedRoute requireStaff)                 │
│  ├── Admin.jsx (tab shell, permission-filtered nav)             │
│  ├── 11 route pages (dashboard, moderation, 3 content, etc.)  │
│  └── usePermissions → GET /api/admin/permissions                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Server: /api/admin/* (requireAuth + requireStaff + RBAC)         │
│  ├── Content CRUD (jobs, scholarships, admissions, blogs, …)    │
│  ├── Moderation, audit, export, import, scraper                  │
│  ├── Executive + growth dashboards (MongoDB aggregations)       │
│  └── Users/roles (API only)                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  MongoDB models + AnalyticsEvent + AuditLog + Payment           │
└─────────────────────────────────────────────────────────────────┘

Legacy (requireAdmin, not granular RBAC):
  /api/v1/analytics/dashboard, /api/v1/alerts/*, /api/notifications/send,
  /api/monetization/admin/*, /api/blogs/auto-generate
```

**Key files:**
- Routes: `client/src/routes/index.jsx`, `server/src/routes/admin.js`
- RBAC: `server/src/config/rbac.js`, `client/src/hooks/usePermissions.js`
- Shell: `client/src/pages/Admin/Admin.jsx`

---

# PHASE 1 — Admin Panel Audit

## 1.1 Existing Admin Pages vs Public Features

| Admin page | Route | Current functionality | Public counterpart | Gap severity |
|------------|-------|----------------------|-------------------|--------------|
| **Executive Dashboard** | `/admin` | 20+ KPI cards, 8 charts, analytics CSV export | Home metrics indirectly | Medium — missing AI/resume KPIs |
| **Moderation Queue** | `/admin/moderation` | Pending jobs (bulk approve/reject), employer verify, report counts | Job/employer listings | High — reports/ads/suspend not wired |
| **Audit Log** | `/admin/audit` | Paginated log, search/action/date filters | — | Low — read-only OK |
| **Jobs** | `/admin/jobs` | List by approval status, approve/reject/delete, edit apply link | `/jobs`, `/jobs/:slug` | **Critical** — no full CRUD UI |
| **Scholarships** | `/admin/scholarships` | Minimal create, delete, edit apply link | `/scholarships/*` | **Critical** — no edit form, filters |
| **Admissions** | `/admin/admissions` | Same as scholarships | `/admissions/*` | **Critical** |
| **Growth Dashboard** | `/admin/growth-dashboard` | Users, scraper trigger, trending searches, newsletter logs | — | Medium — newsletter send is log-only |
| **AI Job Generator** | `/admin/ai-job-generator` | Generate description text | Job creation | High — no save-to-jobs |
| **Analytics** | `/admin/analytics` | DAU, clicks, notification counts (legacy API) | — | Medium — overlaps executive; RBAC mismatch |
| **Alerts** | `/admin/alerts` | Telegram/WhatsApp broadcast (placeholder delivery) | — | High — not real delivery |
| **Import** | `/admin/import` | CSV/JSON/XLSX bulk import with validation | All importable types | Low — strong |

## 1.2 Backend-Only Admin (No UI Tab)

| Resource | API CRUD | Import | Priority to add UI |
|----------|----------|--------|-------------------|
| Blogs | ✅ | ✅ | **P0** |
| Foreign studies | ✅ | ✅ | P1 |
| Career guidance | Import only | ✅ | P1 |
| MCQs / Exams / Quizzes / Past papers | ✅ | MCQs only | P1 |
| Internships | ✅ | ❌ | P1 |
| Webinars | ✅ | ❌ | P2 |
| Intl scholarships | ✅ | ❌ | P1 |
| Universities | ✅ | ❌ | P1 |
| Companies | ❌ (seed only) | ❌ | P1 |
| Resume templates | Public API only | ❌ | P2 |
| In-app notifications | ✅ | ❌ | P1 |
| Users / roles | List + assign role | ❌ | **P0** |
| Ad slots / monetization | Legacy API | ❌ | P1 |
| Payments | Export only | ❌ | **P0** |

## 1.3 Cross-Cutting Gaps (All Modules)

| Capability | Status | Priority |
|------------|--------|----------|
| Full edit forms (not just apply link) | Missing for jobs/scholarships/admissions | **P0** |
| Pagination on content lists | Only audit log | **P0** |
| Server-side search on content pages | API exists, UI doesn't use | **P0** |
| `AdminTableFilters` reuse | Only audit log | P1 |
| Bulk delete / archive / feature | Jobs moderation bulk only | P1 |
| Per-resource export UI | Analytics export only | P1 |
| Preview before publish | None | P1 |
| Draft / schedule / version history | None | P2 |
| Route-level permission guards | Tab filter only; deep-link 403 | P1 |
| RBAC alignment (legacy `requireAdmin`) | Alerts + Analytics tabs | **P0** |
| Audit log on all content mutations | Partial | P1 |
| SEO fields in admin forms | None | P1 |
| Media upload (logos, images) | URL text only | P1 |

---

# PHASE 2 — Content Management Audit

## 2.1 Public Page Manageability Matrix

| Public page / route | Content source | Admin manageable? | Missing CMS feature |
|---------------------|----------------|-------------------|---------------------|
| **Home** `/` | API listings + i18n hero/sections | **Partial** | Hero copy, section order, featured blocks |
| **Jobs** `/jobs`, `/jobs/:slug` | MongoDB `Job` | **Yes** (minimal) | Full edit, SEO, featured, logos |
| **Jobs province/category** | API + server SEO templates | Partial | SEO copy CMS |
| **Scholarships** | MongoDB `Scholarship` | **Yes** (minimal) | Full edit, eligibility, SEO |
| **Admissions** | MongoDB `Admission` | **Yes** (minimal) | Full edit, session/deadline UI |
| **Internships** | MongoDB `Internship` | **API only** | Full admin module |
| **Intl scholarships** | MongoDB `IntlScholarship` | **API only** | Full admin module |
| **Foreign studies** `/foreign-studies` | Placeholder page; model exists | **No** | Page content + admin CRUD UI |
| **Schools & colleges** | i18n placeholder | **No** | Entire module |
| **Career guidance** | MongoDB `CareerArticle` | Import only | Full admin module |
| **Exam prep / MCQs / quizzes** | MongoDB `Exam`, `Mcq`, `Quiz` | API/Import only | Exam builder UI |
| **Past papers** | MongoDB | API only | Admin UI |
| **Resume builder** | User data + `ResumeTemplateCatalog` | Partial | Template admin |
| **Resume analyzer** | AI service | **No** | Config/thresholds admin |
| **AI features** (job gen, cover letter) | API | Partial | Save workflow, usage limits |
| **Blogs** | MongoDB `Blog` | Import/API only | WYSIWYG admin |
| **Blog categories** | Field on Blog | **No** | Category taxonomy admin |
| **Companies** `/company/:slug` | MongoDB `Company` | **No** | Company CRUD admin |
| **Employers** `/employer/:slug` | MongoDB `Employer` | Moderation only | Profile edit admin |
| **Universities** `/university/:slug` | MongoDB `University` | API only | University admin UI |
| **About, Contact, FAQ, legal pages** | i18n `static.json` | **No** | Static page CMS |
| **Advertise, Careers, Support, Help** | i18n | **No** | Static page CMS |
| **Footer / Navbar** | i18n + hardcoded URLs | **No** | Navigation CMS |
| **SEO landing pages** (FPSC, NTS, etc.) | Server templates in `seoController.js` | **No** | SEO page CMS |
| **404** | i18n | **No** | Optional |
| **Search / category / province pages** | API filters | Indirect | Facet config admin |
| **Newsletter** | `NewsletterSubscriber` | **No** | Subscriber + campaign admin |

**Summary:** ~15% of public surface is admin-manageable today; ~40% has backend support without UI; ~45% is hardcoded (i18n/static/SEO templates).

---

# PHASE 3 — Module-by-Module Requirements

Complexity: **S** = small (1–3 days), **M** = medium (4–8 days), **L** = large (2–3 weeks), **XL** = epic (3+ weeks)

## 3.1 Jobs

| Capability | Current | Missing | Priority | Complexity |
|------------|---------|---------|----------|------------|
| Create / Edit / Delete | API ✅; UI partial | Full form UI | **P0** | M |
| Archive / Pause / Expire / Renew | Status field only | Workflow actions | P1 | M |
| Approve / Reject | ✅ UI + API | — | — | — |
| Feature / Pin / Sponsored | API fields | UI toggles | P1 | S |
| Duplicate | ❌ | Clone endpoint + UI | P2 | S |
| Preview | ❌ | Preview route/modal | P1 | S |
| Import / Export | Import ✅; export API | Per-job export UI | P1 | S |
| Bulk approve/delete/feature | Bulk approve in moderation | Content list bulk | P1 | M |
| Application link | ✅ Recent addition | — | — | — |
| Company logo | `logoUrl` string | Upload + picker | P1 | M |
| SEO (title, desc, slug) | Slug auto | Admin SEO fields | P1 | M |
| Categories, tags, skills, salary | Model fields | Form UI | P1 | M |
| Province, city, remote/hybrid | Model fields | Form UI | P1 | S |
| Verification badge | Via employer | Job-level override UI | P2 | S |
| Audit log | Partial | Log all mutations | P1 | S |
| Version history | ❌ | Optional P3 | P3 | L |
| Status workflow | draft/active/closed + approval | Unified status UI | P1 | M |

## 3.2 Scholarships

| Capability | Current | Missing | Priority | Complexity |
|------------|---------|---------|----------|------------|
| CRUD | Create minimal + delete + link | Full edit form | **P0** | M |
| Provider, level, country, amount | Partial in create | Full form | P0 | S |
| Eligibility, instructions | API | UI | P1 | S |
| Deadline, featured | API | UI | P1 | S |
| SEO fields | ❌ | Meta + slug editor | P1 | M |
| Import | ✅ | — | — | — |
| Bulk actions | ❌ | Bulk publish/delete | P2 | M |
| Preview | ❌ | Preview modal | P1 | S |

## 3.3 Admissions

Same pattern as scholarships — **P0** full CRUD UI; apply link recently added.

## 3.4 Internships

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Full API CRUD | Entire admin module | **P1** | M |

## 3.5 Foreign Studies

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| API + import; public page placeholder | Admin UI + fix public page | **P1** | M |

## 3.6 Blogs

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| API + import | Admin tab, WYSIWYG, categories, featured image | **P0** | L |
| `auto-generate` API | Wire to admin UI | P2 | S |

## 3.7 Career Guidance

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Import only; no CRUD API | CRUD API + admin UI | **P1** | M |

## 3.8 MCQs / Mock Tests / Past Papers / Exams

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Full API (exams, mcqs, quizzes, past-papers) | Exam builder UI, question editor, quiz composer | **P1** | **XL** |
| Exam analytics API | Analytics dashboard section | P2 | M |

## 3.9 Resume Templates

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| `ResumeTemplateCatalog` model, public API | Admin CRUD for templates | **P2** | M |

## 3.10 Companies & Universities

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Universities: API only | Admin UI | **P1** | M |
| Companies: seed script only | CRUD API + admin UI | **P1** | M |

## 3.11 Employers & Students

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Employer moderation (verify) | Full employer admin, profile edit | **P1** | L |
| Users list API | User admin UI, role assign UI, ban/suspend | **P0** | L |
| Student profiles | Read-only admin view | P2 | M |

## 3.12 Advertisements

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| `AdSlotConfig` + monetization API | Admin ad slot manager | **P1** | M |
| Moderation queue shows ads | Approve/reject ads UI | P1 | S |

## 3.13 Notifications & Email

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Alerts (Telegram/WhatsApp placeholder) | Real delivery + templates | P1 | L |
| `/admin/notifications` API | In-app notification composer UI | **P1** | M |
| Newsletter subscribe + logs | Campaign UI, real email send | **P1** | L |

## 3.14 SEO

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Public `SeoHead`, sitemap, robots | Admin SEO module | **P1** | **L** |

## 3.15 Analytics

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Executive + growth dashboards (real DB) | Resume builder KPIs, AI usage, storage | P1 | M |
| Legacy analytics tab | Merge into executive; fix RBAC | **P0** | S |

## 3.16 Payments

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Stripe checkout (employer), Payment model | Admin payments list, refunds view | **P0** | M |
| `payments:read` permission | Wire to routes + UI | P0 | S |

## 3.17 Support Tickets

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Static support/contact pages | Ticket model, APIs, admin queue, contact form | **P1** | **L** |

## 3.18 Reports

| Current | Missing | Priority | Complexity |
|---------|---------|----------|------------|
| Content reports in moderation (read-only) | Review workflow UI | P1 | M |
| Export users/jobs/payments | Export UI per resource | P1 | M |

---

# PHASE 4 — Role & Permission Audit

## 4.1 Roles

| Role | System | Auth |
|------|--------|------|
| Student | `User` | JWT `/api/auth/*` |
| Employer | `Employer` | Separate employer auth |
| Editor | Staff | JWT + RBAC |
| Moderator | Staff | JWT + RBAC |
| Admin | Staff | JWT + RBAC |
| Super Admin | Staff | JWT + RBAC |

## 4.2 Permission Matrix (Staff)

Legend: ✅ = granted · — = denied · ⚠️ = API exists but UI/route mismatch

| Permission | Editor | Moderator | Admin | SuperAdmin |
|------------|--------|-----------|-------|------------|
| **Content: jobs/scholarships/admissions/blogs/…** | ✅ | — | ✅ | ✅ |
| **Content: import** | ✅ | — | ✅ | ✅ |
| **Moderate: jobs/employers/reports/ads/suspend** | — | ✅ | ✅ | ✅ |
| **Analytics: read** | ✅ | ✅ | ✅ | ✅ |
| **Audit: read** | — | ✅ | ✅ | ✅ |
| **Export: data** | — | — | ✅ | ✅ |
| **Users: read** | — | — | ✅ | ✅ |
| **Users: manage** | — | — | ✅ | ✅ |
| **Users: delete** | — | — | — | ✅ |
| **Roles: assign** | — | — | — | ✅ |
| **Payments: read** | — | — | ✅ ⚠️ unused | ✅ |
| **Notifications: send** | — | — | ✅ | ✅ |
| **Scraper: run** | — | — | ✅ | ✅ |
| **System: settings/secrets** | — | — | — | ✅ |

## 4.3 RBAC Issues to Fix (P0)

1. **`GET /api/v1/analytics/dashboard`** uses `requireAdmin` — Editors with `analytics:read` see tab but get 403.
2. **`POST /api/v1/alerts/*`** uses `requireAdmin` — misaligned with `system:notifications`.
3. **`usePermissions.can()`** uses client-side role map, not server-returned permission list.
4. **Child admin routes** lack per-permission route guards (deep-link exposure).
5. **`payments:read`** defined but not enforced on any route.

## 4.4 Recommended Permission Additions

| New permission | Purpose | SuperAdmin only? |
|----------------|---------|------------------|
| `content:publish` | Separate draft vs publish | No |
| `seo:manage` | SEO CMS | Admin+ |
| `media:manage` | Media library | Editor+ |
| `payments:refund` | Refund actions | Admin+ |
| `system:backups` | Backup/restore | SuperAdmin |
| `system:api_keys` | API key management | SuperAdmin |

---

# PHASE 5 — Analytics Audit

## 5.1 Implemented (Real MongoDB Data)

| KPI | Source | Admin UI |
|-----|--------|----------|
| Total users, DAU/WAU/MAU | `User`, `AnalyticsEvent` | Executive ✅ |
| New registrations (today/month) | `User` | Executive ✅ |
| Employers (verified/trusted) | `Employer` | Executive ✅ |
| Jobs, pending jobs, applications | `Job`, `Application` | Executive ✅ |
| Scholarships, admissions, blogs | respective models | Executive ✅ |
| Career articles, foreign studies | respective models | Executive ✅ |
| Revenue (completed payments) | `Payment` | Executive ✅ |
| Pending payments | `Payment` | Executive ✅ |
| Pending content reports | `ContentReport` | Executive ✅ |
| Active ads | `AdSlotConfig` | Executive ✅ |
| Daily active users chart | `AnalyticsEvent` | Executive ✅ |
| Applications / jobs posted / revenue charts | aggregations | Executive ✅ |
| Traffic sources, content publishing | `AnalyticsEvent` | Executive ✅ |
| Trending searches | search logs | Growth ✅ |
| Scraper stats | `ScraperRun` | Growth ✅ |
| Newsletter logs | `NewsletterLog` | Growth ✅ (display only) |

## 5.2 Missing Analytics

| KPI | Priority | Complexity |
|-----|----------|------------|
| Resume builder usage (creates, downloads) | P1 | M |
| AI feature usage (job gen, cover letter, resume analyze) | P1 | M |
| Storage usage (uploads, Cloudinary) | P2 | M |
| Email delivery stats (opens, bounces) | P1 | L |
| Notification delivery (real FCM/Telegram) | P1 | L |
| Stripe MRR / subscription (if added) | P2 | M |
| Top categories / provinces (listing views) | P1 | S |
| Popular employers / universities | P1 | S |
| MCQ/quiz attempt analytics | P2 | M |
| Support ticket volume | P1 | M (after tickets exist) |
| Verification queue metrics | P1 | S |
| Moderation queue SLA | P2 | M |
| `supportTickets` | Hardcoded 0 in backend | P1 | S |

---

# PHASE 6 — Filters Audit

## 6.1 Current State

| Page | Search | Status | Date | Province | Category | Other |
|------|--------|--------|------|----------|----------|-------|
| Audit log | ✅ | — | ✅ | — | — | action |
| Jobs admin | — | ✅ approval | — | — | — | — |
| Scholarships | — | — | — | — | — | — |
| Admissions | — | — | — | — | — | — |
| Moderation | — | — | — | — | — | — |
| All other modules | — | — | — | — | — | — |

**API supports (unused in UI):** jobs — status, approvalStatus, province, category, city, employer, search, date range, pagination. Scholarships — status, level, country, search. Admissions — status, university, province, search.

## 6.2 Required Standard Filter Bar (All Tables)

Implement reusable `AdminDataTable` + `AdminTableFilters` with:

- Search (debounced)
- Status (draft/published/pending/archived)
- Date range (created/updated)
- Province / city
- Category
- Organization / author
- Verification level
- Featured / sponsored toggles
- Created by / updated by (staff actions)
- Pagination (page size 25/50/100)
- Sort (column headers)

**Priority:** P0 for jobs, scholarships, admissions, blogs  
**Complexity:** M (shared component)

---

# PHASE 7 — Bulk Actions Audit

| Module | Bulk publish | Bulk delete | Bulk archive | Bulk approve | Bulk reject | Bulk verify | Bulk export | Bulk import |
|--------|-------------|-------------|--------------|--------------|-------------|-------------|-------------|-------------|
| Jobs | ❌ | ❌ | ❌ | ✅ moderation | ✅ moderation | — | ❌ | ✅ |
| Scholarships | ❌ | ❌ | ❌ | — | — | — | ❌ | ✅ |
| Admissions | ❌ | ❌ | ❌ | — | — | — | ❌ | ❌ |
| Blogs | ❌ | ❌ | ❌ | — | — | — | ❌ | ✅ |
| Employers | — | — | — | — | — | Partial | ❌ | ❌ |
| Users | — | ❌ | — | — | — | — | API only | ❌ |

**Recommended P1:** Checkbox selection + bulk delete/archive/feature on all content tables.  
**Complexity:** M per module (shared hook)

---

# PHASE 8 — SEO Management Audit

## 8.1 Public SEO (Strong)

- `SeoHead` component with title, description, canonical, OG, JSON-LD
- Dynamic sitemap (`GET /sitemap.xml`)
- `robots.txt`
- SEO landing APIs (`/api/seo/*`)
- Per-listing schema on detail pages

## 8.2 Admin SEO (Missing)

| Feature | Status | Priority |
|---------|--------|----------|
| Meta title / description per listing | ❌ | P1 |
| OpenGraph image override | ❌ | P1 |
| Twitter card fields | ❌ | P2 |
| Canonical URL override | ❌ | P2 |
| Robots (noindex/nofollow) per page | ❌ | P1 |
| Sitemap include/exclude rules | ❌ | P2 |
| Redirects (301) manager | ❌ | P2 |
| Schema type override | ❌ | P3 |
| hreflang per locale | ❌ | P2 |
| Slug editor with uniqueness check | Partial (auto) | P1 |
| SEO landing page copy CMS | ❌ | P1 |

**Database:** Consider `SeoMeta` collection or embedded `seo` subdocument on content models.  
**Complexity:** L

---

# PHASE 9 — Media Management Audit

## 9.1 Current

| Capability | Status |
|------------|--------|
| Resume upload (job apply) | ✅ `storageService` |
| Resume analyzer upload | ✅ |
| Admin bulk import (JSON/CSV/XLSX) | ✅ |
| Static `/uploads/*` serving | ✅ |
| Cloudinary optional backend | ✅ |
| `logoUrl` on models | String URL only |

## 9.2 Missing

| Feature | Priority | Complexity |
|---------|----------|------------|
| Admin media library (browse/upload/delete) | P1 | L |
| Company / university logo upload | P1 | M |
| Blog / career featured images | P1 | M |
| PDF attachments on jobs | P2 | M |
| Unused file cleanup | P2 | M |
| Image optimization / CDN admin | P2 | M |
| Employer logo upload in portal | P1 | M |

---

# PHASE 10 — Final Report & Implementation Roadmap

## 10.1 Recommended Architecture (Target State)

```
Admin Panel (control center)
├── Dashboard & Analytics (unified)
├── Content Hub
│   ├── Jobs / Internships
│   ├── Scholarships / Intl / Admissions
│   ├── Blogs / Career / Foreign Studies
│   ├── Exam Prep (Exams, MCQs, Quizzes, Past Papers)
│   └── Resume Templates
├── Directory
│   ├── Companies / Universities / Employers
│   └── Users & Roles
├── Moderation & Trust
│   ├── Queues (jobs, employers, reports, ads)
│   └── Verification
├── Marketing
│   ├── Notifications & Campaigns
│   ├── Newsletter
│   ├── Ad Slots
│   └── SEO Manager
├── Operations
│   ├── Import / Export
│   ├── Audit Log
│   ├── Payments
│   ├── Support Tickets
│   └── System (scraper, settings) — SuperAdmin
└── CMS (Phase 2)
    ├── Static Pages
    ├── Navigation (nav/footer)
    └── Home / Landing sections
```

## 10.2 Database Changes (Recommended)

| Change | Purpose | Phase |
|--------|---------|-------|
| `seo` subdocument on Job, Scholarship, Blog, etc. | Admin SEO fields | 2 |
| `SupportTicket` model | Support workflow | 3 |
| `MediaAsset` model | Media library | 3 |
| `StaticPage` model (optional) | CMS for legal/marketing | 4 |
| `NavigationMenu` model (optional) | Nav/footer CMS | 4 |
| `ContentVersion` (optional) | Version history | 5 |
| Career article admin CRUD (model exists) | — | 1 |

## 10.3 API Changes (Recommended)

| Change | Priority |
|--------|----------|
| Align legacy routes to RBAC (`v1/analytics`, `v1/alerts`) | **P0** |
| Wire `payments:read` to payments list endpoint | **P0** |
| Companies CRUD `/admin/companies` | P1 |
| Career articles CRUD `/admin/career-articles` | P1 |
| Bulk endpoints `POST /admin/{resource}/bulk` | P1 |
| Media `POST /admin/media/upload` | P1 |
| SEO `GET/PUT /admin/seo/:entity/:id` | P2 |
| Support tickets CRUD | P2 |

## 10.4 Frontend Changes (Recommended)

| Change | Priority |
|--------|----------|
| Shared `AdminDataTable` (pagination, filters, bulk) | **P0** |
| Full CRUD forms: Jobs, Scholarships, Admissions | **P0** |
| User management + role assignment UI | **P0** |
| Payments admin page | **P0** |
| RBAC route guards per admin child route | **P0** |
| Admin tabs: Blogs, Internships, Universities, Companies | P1 |
| Exam/MCQ builder | P1 |
| Notifications composer | P1 |
| Ad slot manager | P1 |
| Media library | P1 |
| SEO manager | P2 |
| Static page CMS | P2 |

## 10.5 Estimated Implementation Order

### Sprint A — Stabilize & unblock (P0, ~1–2 weeks)
1. Fix RBAC mismatches (analytics, alerts APIs)
2. Shared admin data table + filters + pagination
3. Full CRUD UI: Jobs, Scholarships, Admissions
4. User management UI (list, role assign — SuperAdmin)
5. Payments admin (list, link to export)
6. Per-route permission guards

### Sprint B — Surface existing APIs (P1, ~2–3 weeks)
7. Admin modules: Blogs, Internships, Universities, Intl Scholarships
8. Companies CRUD (API + UI)
9. Career articles CRUD (API + UI)
10. Foreign studies UI + fix public page
11. Notifications composer (wire `/admin/notifications`)
12. Moderation: report review + suspend actions
13. Ad slot manager
14. Bulk actions on content tables
15. Media upload for logos (jobs, companies, universities)

### Sprint C — Operations & trust (P1, ~2 weeks)
16. Support tickets (model, contact form, admin queue)
17. Newsletter campaign UI + real email delivery
18. Employer admin (profile review beyond verify)
19. Per-resource export UI
20. Analytics gaps (resume, AI usage)

### Sprint D — Exam prep & advanced CMS (P1–P2, ~3–4 weeks)
21. Exam / MCQ / Quiz / Past paper admin builder
22. SEO manager (listing-level meta)
23. Resume template admin
24. AI job generator → save as draft job

### Sprint E — Full CMS (P2–P3, ~3+ weeks)
25. Static page CMS (legal, about, FAQ)
26. Navigation/footer CMS
27. Home hero & section manager
28. SEO landing page copy editor
29. Version history, scheduling (optional)

## 10.6 Risk Register

| Risk | Mitigation |
|------|------------|
| Scope creep (“manage every page”) | Phase CMS separately; prioritize API-backed content first |
| RBAC regressions | Permission matrix tests + `verify-admin-stability.mjs` extension |
| Editor vs Admin confusion | Clear role docs; route guards |
| Performance on large tables | Server pagination mandatory |
| i18n for CMS content | Urdu/RTL fields in CMS from start |

## 10.7 Success Criteria (Launch-Ready Admin)

- [ ] All primary listing types (jobs, scholarships, admissions, blogs, internships) have full admin CRUD
- [ ] Every admin table has search, filters, pagination
- [ ] Moderation queue handles jobs, employers, reports, ads
- [ ] Users, payments, audit accessible to authorized roles
- [ ] RBAC consistent across all admin APIs
- [ ] Import + per-type export working
- [ ] Apply links, logos, SEO basics editable per listing
- [ ] No `requireAdmin` bypass on staff-facing features
- [ ] Executive dashboard reflects all major KPIs

---

## Appendix A — Admin Route Inventory

**Client routes:** `/admin`, `/admin/moderation`, `/admin/audit`, `/admin/jobs`, `/admin/scholarships`, `/admin/admissions`, `/admin/growth-dashboard`, `/admin/ai-job-generator`, `/admin/analytics`, `/admin/alerts`, `/admin/import`

**Server:** Full inventory in `server/src/routes/admin.js` (130+ endpoints across content, moderation, system).

## Appendix B — Related Docs

- `docs/PRE_LAUNCH_OPERATIONS_REPORT.md`
- `docs/ADMIN_STABILITY_QA_REPORT.md`
- `docs/LAUNCH_CONTENT_TRUST_REPORT.md`
- `docs/RESPONSIVE_UI_STABILIZATION_REPORT.md`

---

**Status:** Audit complete. Awaiting approval before implementation phases begin.
