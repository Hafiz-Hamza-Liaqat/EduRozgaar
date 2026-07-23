# Sprint C.6.4.2 — SlugService & URL Architecture

**Date:** 2026-07-12  
**Status:** Implemented  
**Scope:** Central slug service, admin slug field, validation API, 10 content resources  
**Client build:** Pass (`npm run build`)  
**Server:** Running (MongoDB connected; existing dev instance on port 5000)  
**Verify script:** Pass (`cd server && node --env-file=.env ../scripts/verify-sprint-c6-4-2.mjs` — 8/8)

---

## Summary

Introduced a **central SlugService** on the backend and a reusable **AdminSlugField** component on the frontend. Slug normalization, reserved-word checks, uniqueness validation, and canonical URL preview are now shared across Jobs, Scholarships, Admissions, Blogs, Companies, Institutions, Webinars, CMS static pages, Foreign Studies, and Internships.

**Published slugs are locked** when titles change; only draft records auto-regenerate slugs unless an admin explicitly edits the slug field. Public routes were **not changed**.

---

## Architecture

```
Admin form (AdminSlugField)
  ├── local normalize + live preview (VITE_APP_URL)
  └── GET /api/admin/slugs/check?type=&slug=&excludeId=&locale=
        └── slugController → slugService.checkSlugAvailability()

Admin create/update controller
  └── applyResolvedSlug(resourceType, doc, body, isCreate)
        └── slugService.resolveSlugForSave()
              ├── validateSlug (format + reserved words)
              ├── isSlugLocked (non-draft → keep existing slug)
              ├── generateSlugForResource (draft / create)
              └── ensureSlugUnique (suffix -1, -2, …)
```

### Backend — new files

| File | Purpose |
|------|---------|
| `server/src/config/reservedSlugs.js` | Blocklist (`admin`, `jobs`, `auth`, `api`, etc.) |
| `server/src/services/slugService.js` | Single source of truth: normalize, validate, uniqueness, preview, save resolution |
| `server/src/controllers/admin/slugController.js` | `GET /admin/slugs/check` |
| `server/src/utils/adminSlugHelpers.js` | `applyResolvedSlug()`, `slugErrorResponse()` |

### Backend — modified

| Area | Change |
|------|--------|
| `server/src/routes/admin.js` | Registered `GET /slugs/check` |
| `server/src/utils/bulkUpsert.js` | Delegates uniqueness to SlugService |
| Model pre-save hooks | `Job`, `Scholarship`, `Admission`, `Blog`, `Company`, `Institution`, `ForeignStudy`, `Internship` — generate slug only when empty (no title-change overwrite) |
| Admin controllers | `applyResolvedSlug` before save in jobs, scholarships, admissions, blogs, companies, institutions, internships, foreign studies, webinars, CMS |

### Frontend — new files

| File | Purpose |
|------|---------|
| `client/src/components/admin/AdminSlugField.jsx` | Auto-generate, manual edit, live preview, copy URL, debounced availability check |

### Frontend — modified

| File | Change |
|------|--------|
| `client/src/services/adminContentApi.js` | `checkSlug(params)` |
| `client/src/i18n/locales/en/admin.json` | Slug field strings |
| Admin CRUD pages | Integrated `AdminSlugField` (see table below) |

---

## Resource coverage

| Resource | Type key | Public path | Admin page |
|----------|----------|-------------|------------|
| Jobs | `job` | `/jobs/:slug` | `AdminContentJobs.jsx` |
| Scholarships | `scholarship` | `/scholarships/:slug` | `AdminContentScholarships.jsx` |
| Admissions | `admission` | `/admissions/:slug` | `AdminContentAdmissions.jsx` |
| Blogs | `blog` | `/blog/:slug` | `AdminContentBlogs.jsx` |
| Companies | `company` | `/company/:slug` | `AdminCompanies.jsx` |
| Institutions | `institution` | `/schools-and-colleges/:slug` | `AdminInstitutions.jsx` |
| Webinars | `webinar` | `/webinars/:slug` | `AdminWebinars.jsx` |
| CMS pages | `cms-page` | `/:slug` or `/:locale/:slug` | `AdminSiteCms.jsx` |
| Foreign studies | `foreign-study` | `/foreign-studies/:slug` | `AdminForeignStudies.jsx` |
| Internships | `internship` | `/internships/:slug` | `AdminContentInternships.jsx` |

---

## Slug lock behavior (SEO-safe)

| Status | Title/name change | Slug field | Result |
|--------|-------------------|------------|--------|
| `draft` | Yes | Not manually set | Auto-regenerates from source text |
| `draft` | Yes | Manually edited | Keeps admin value (validated + uniquified) |
| Non-draft (e.g. `active`, `published`) | Yes | Not sent in body | **Existing slug preserved** |
| Non-draft | — | Explicitly edited | New slug validated before save |

Backend: `resolveSlugForSave()` uses `isSlugLocked()` when `status` is not in `draftStatuses`.  
Frontend: `AdminSlugField` hides auto-generate button and shows locked hint when `status !== 'draft'`.

---

## Validation API

**Endpoint:** `GET /api/admin/slugs/check`  
**Auth:** Admin JWT required  
**Query:** `type`, `slug`, optional `excludeId`, optional `locale` (CMS)

**Example responses:**

```json
// Reserved
{ "valid": false, "available": false, "reserved": true, "message": "This slug is reserved." }

// Duplicate
{ "valid": true, "available": false, "message": "This slug is already in use.", "previewUrl": "http://localhost:5173/jobs/accountant-faisalabad-punjab" }

// Available
{ "valid": true, "available": true, "previewUrl": "http://localhost:5173/jobs/my-new-slug" }
```

Save-time errors (400) from controllers use the same messages via `slugErrorResponse()`.

---

## AdminSlugField features

- **Auto-generate** from title / program / name (draft only)
- **Manual editing** with client-side normalization on blur
- **Live URL preview** (`VITE_APP_URL` or `window.location.origin`)
- **Copy URL** button (clipboard API)
- **Debounced availability check** (400 ms) against `/admin/slugs/check`
- **Status messages:** available, taken, reserved, invalid characters
- **Accessibility:** `role="status"` + `aria-live="polite"` on validation text

---

## Verification evidence

### Automated

| Check | Result |
|-------|--------|
| `npm run build` (client) | ✓ Pass |
| `verify-sprint-c6-4-2.mjs` | ✓ 8/8 passed |
| Server / MongoDB | ✓ Connected (port 5000) |

**Verify script covers:** normalization, reserved words, invalid characters, resource registry, duplicate detection, excludeId self-match, published slug lock, draft auto-generate.

### Live API (2026-07-12)

| Test | Result |
|------|--------|
| `slug=admin` | `reserved: true`, message: "This slug is reserved." |
| `slug=accountant-faisalabad-punjab` | `available: false`, message: "This slug is already in use." |
| Empty / invalid slug | 400, "Slug contains invalid characters." |

### Manual QA checklist

- [ ] Open admin job form (draft) — edit title, slug auto-updates
- [ ] Publish job — change title, slug stays unchanged
- [ ] Enter duplicate slug — red "already in use" message
- [ ] Enter `admin` — reserved warning
- [ ] Copy URL button copies full preview URL
- [ ] CRUD smoke test per resource type (create draft → publish → edit)

---

## Out of scope (deferred)

- Redirect middleware / slug history
- Page builder / block builder
- Employer dashboard redesign
- PKR pricing / catalog changes
- Public navbar / footer changes
- Student-facing UI redesign
- Route restructuring

---

## Environment

| Variable | Used by |
|----------|---------|
| `SITE_URL` / `FRONTEND_URL` / `APP_URL` | Server `previewUrl()` |
| `VITE_APP_URL` | Client `AdminSlugField` preview |

Set `VITE_APP_URL=https://edurozgaar.pk` in production for correct admin preview URLs.

---

## Notes

- **CMS pages** use compound uniqueness `{ slug, locale }` via `compoundFilter` in SlugService.
- **Internships** append a short ID suffix in `generate()` to reduce collisions.
- **Foreign studies** new records default to `draft` so slugs auto-generate before publish (consistent with other resources).
- **Urdu/Arabic** slug i18n keys deferred; English keys added in `en/admin.json`.

---

## Files reference

```
server/src/
  config/reservedSlugs.js
  services/slugService.js
  controllers/admin/slugController.js
  utils/adminSlugHelpers.js

client/src/
  components/admin/AdminSlugField.jsx
  services/adminContentApi.js  (+ checkSlug)

scripts/
  verify-sprint-c6-4-2.mjs
```
