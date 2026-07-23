# Sprint C.1 — CMS Foundation Implementation Report

**Date:** 2026-07-11  
**Scope:** Sprint C.1 only (site chrome CMS). Sprint C.2+ not started.

## Summary

Sprint C.1 delivers a production-oriented CMS foundation for global website content: homepage, navigation, footer, static pages, and homepage banners. Content is stored in MongoDB, managed through a new **Site CMS** admin area, exposed via public read APIs, and consumed on the public site with **i18n JSON fallback** when CMS content is draft or missing.

---

## Objectives Status

| Objective | Status | Notes |
|-----------|--------|-------|
| Homepage CMS | ✅ | Hero, stats, section toggles, CTAs, testimonials, partners, SEO, draft/publish/schedule |
| Navigation CMS | ✅ | Header items, labels (en/ur/ar), ordering, visibility, external links |
| Footer CMS | ✅ | Social, contact, copyright, newsletter text; columns seeded (admin column editor limited — see limitations) |
| Static Pages CMS | ✅ | CRUD, rich HTML, SEO, slug, draft/publish, preview endpoint |
| Hero Banner Manager | ✅ | Multiple banners, order, schedule, CTA, images, active flag |
| Media Support | ✅ | Reuses `AdminImageUrlField` + `POST /admin/upload/image` |
| SEO Support | ✅ | Meta title/description, canonical, OG image, Twitter card, schema type |
| RBAC | ✅ | `content:site`, `content:navigation`, `content:pages`, `content:cms:publish` |
| Audit Logging | ✅ | Create/update/delete/publish on all CMS mutations |
| Verification | ✅ | Client build pass; API smoke tests 5/5 |

---

## New Database Models

| Model | File | Purpose |
|-------|------|---------|
| `CmsHomepage` | `server/src/models/CmsHomepage.js` | Per-locale homepage (hero, stats, sections, SEO) |
| `CmsNavigation` | `server/src/models/CmsNavigation.js` | Header/footer per locale |
| `CmsStaticPage` | `server/src/models/CmsStaticPage.js` | Slug + locale static pages |
| `CmsBanner` | `server/src/models/CmsBanner.js` | Homepage banners with schedule |

---

## New / Updated Routes

### Public (`/api/cms`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/site/homepage?locale=` | Published homepage |
| GET | `/site/navigation?locale=&placement=header\|footer` | Published nav/footer |
| GET | `/site/banners?locale=` | Active published banners |
| GET | `/site/pages/:slug?locale=` | Published static page |

### Admin (`/api/admin/cms`)

| Method | Path | Permission |
|--------|------|------------|
| GET/PUT | `/homepage` | `content:site` |
| POST | `/homepage/:locale/publish` | `content:cms:publish` |
| GET | `/homepage/preview?locale=` | `content:site` |
| GET/PUT | `/navigation` | `content:navigation` |
| POST | `/navigation/:placement/:locale/publish` | `content:cms:publish` |
| CRUD | `/pages`, `/pages/:id` | `content:pages` |
| POST | `/pages/:id/publish` | `content:cms:publish` |
| GET | `/pages/:id/preview` | `content:pages` |
| CRUD | `/banners`, `/banners/:id` | `content:site` |

---

## RBAC

| Role | CMS capabilities |
|------|------------------|
| **Editor** | Edit homepage, nav, pages, banners (draft saves only) |
| **Moderator+** | Includes `content:cms:publish` — publish/unpublish |
| **Admin / Super Admin** | Full CMS + system config |

Server: `server/src/config/rbac.js`  
Client: `client/src/config/rbac.js`

---

## Audit Actions

Logged via `auditService` on all CMS mutations:

- `cms.homepage.create|update|publish`
- `cms.navigation.create|update|publish`
- `cms.page.create|update|delete|publish`
- `cms.banner.create|update|delete`

Includes user, timestamp, before/after (where applicable), optional `reason`.

---

## Files Modified / Added

### Server
- `server/src/models/CmsHomepage.js` *(new)*
- `server/src/models/CmsNavigation.js` *(new)*
- `server/src/models/CmsStaticPage.js` *(new)*
- `server/src/models/CmsBanner.js` *(new)*
- `server/src/utils/cmsHelpers.js` *(new)*
- `server/src/controllers/cmsController.js` *(new)*
- `server/src/routes/cms.js` *(new)*
- `server/src/routes/admin.js` — CMS admin routes
- `server/src/routes/index.js` — export `cmsRouter`
- `server/src/index.js` — mount `/api/cms`, CMS seed on startup
- `server/src/seed/cmsSiteContent.js` *(new)*
- `server/src/config/rbac.js` — CMS permissions

### Client
- `client/src/services/siteContentApi.js` *(new)*
- `client/src/services/adminContentApi.js` — CMS admin methods
- `client/src/context/SiteContentContext.jsx` *(new)*
- `client/src/hooks/useCmsStaticPage.js` *(new)*
- `client/src/hooks/useHeaderNavItems.js` *(new)*
- `client/src/utils/cmsNav.js` *(new)*
- `client/src/components/admin/AdminCmsFields.jsx` *(new)*
- `client/src/pages/Admin/AdminSiteCms.jsx` *(new)*
- `client/src/components/static/CmsPageView.jsx` *(new)*
- `client/src/components/static/StaticCmsPage.jsx` *(new)*
- `client/src/pages/Static/staticCmsPages.jsx` *(new)*
- `client/src/layouts/MainLayout.jsx` — `SiteContentProvider`
- `client/src/pages/Home/Home.jsx` — CMS hero, banners, sections
- `client/src/components/layout/Navbar.jsx` — CMS nav fallback
- `client/src/components/layout/DrawerMenu.jsx` — CMS nav fallback
- `client/src/components/layout/Footer.jsx` — CMS footer fallback
- `client/src/pages/Admin/Admin.jsx` — Site CMS tab
- `client/src/routes/index.jsx` — `/admin/site-cms`, static CMS wrappers
- `client/src/i18n/locales/en/admin.json` — `siteCms` label

### Tooling / Docs
- `scripts/verify-sprint-c1.mjs` *(new)*
- `docs/SPRINT_C1_IMPLEMENTATION_REPORT.md` *(this file)*

---

## Architecture

```
Public site
  SiteContentProvider → GET /api/cms/site/*
  Static pages → GET /api/cms/site/pages/:slug
  Fallback → i18n JSON (home.json, navbar.json, footer.json, static.json)

Admin
  /admin/site-cms → tabbed UI (Homepage | Navigation | Footer | Pages | Banners)
  Editors save drafts; Moderators+ publish
```

---

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` (client) | ✅ Pass |
| CMS controller module load | ✅ Pass |
| `node scripts/verify-sprint-c1.mjs` | ✅ 5/5 public + auth checks |
| Backend dev server | ✅ Running with CMS routes (watch reload) |

```bash
# Re-run verification
node scripts/verify-sprint-c1.mjs
cd client && npm run build
```

---

## Remaining Limitations (Sprint C.1)

1. **Footer column editor** — Footer link columns are seeded and API-supported; admin UI currently edits social/contact/copyright/newsletter only. Full column CRUD UI deferred.
2. **Nav dropdown children** — Header nav JSON editor supports top-level items; nested `children` for mega-menu require manual JSON or seed updates.
3. **WYSIWYG editor** — Static pages use HTML textarea; no rich WYSIWYG component yet.
4. **Cloudinary** — Upload uses existing local `/admin/upload/image`; Cloudinary env integration not wired in this sprint.
5. **Draft preview token** — Admin preview endpoints exist; public draft preview by staff token not implemented (publish required for public view).
6. **Ur/Ar CMS seed** — Seed creates English draft docs only; ur/ar locales editable in admin but not pre-seeded.
7. **Contact page** — Contact form remains in legacy component; CMS replaces page only when published HTML/sections exist.

---

## Manual QA Checklist

### Admin (login: staff with CMS permissions)

- [ ] Open **Admin → Site CMS** tab visible for Editor/Moderator
- [ ] **Homepage**: edit hero headline, save draft, publish (Moderator+)
- [ ] **Navigation**: edit header item label/path, publish, verify navbar updates
- [ ] **Footer**: edit copyright/newsletter text, publish, verify footer updates
- [ ] **Static Pages**: edit About page HTML, publish, verify `/about` shows CMS content
- [ ] **Banners**: create banner with image upload, publish, verify homepage banner strip
- [ ] **RBAC**: Editor cannot set status Published (403 or disabled)
- [ ] **Audit**: Admin → Audit log shows `cms.*` actions after saves

### Public

- [ ] Homepage loads with i18n fallback when CMS is draft
- [ ] Homepage reflects CMS after publish
- [ ] Navbar/footer unchanged until navigation CMS published
- [ ] Static pages fall back to i18n until CMS page has content + published
- [ ] No regressions on jobs/scholarships/admissions listings

### Regression

- [ ] Client build passes
- [ ] Server starts without errors
- [ ] Existing admin content modules (jobs, blogs) unaffected

---

## Not in Scope (Sprint C.2+)

- Listing-level CMS (jobs/scholarships content templates)
- Full media library
- HTML sanitization hardening / CSP rollout
- Automated E2E test suite for CMS

---

*End of Sprint C.1 report.*
