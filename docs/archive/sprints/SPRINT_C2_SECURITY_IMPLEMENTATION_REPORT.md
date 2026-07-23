# Sprint C.2 — Security Hardening Implementation Report

**Date:** 2026-07-12  
**Scope:** Sprint C.2 only (production-grade security). No new user-facing features. Sprint C.3+ not started.

## Executive Summary

Sprint C.2 replaces weak regex-based HTML handling with **sanitize-html** (server) and **DOMPurify** (client defense-in-depth), enables a **production CSP and security headers** via Helmet, hardens **all upload paths** with magic-byte validation and generated filenames, adds **employer auth rate limiting** and **upload rate limiting**, expands **production env validation**, and documents remaining risks.

**Verification:** Client build ✅ | Server start ✅ | `scripts/verify-sprint-c2.mjs` **10/10** ✅

---

## Security Improvements Implemented

### 1. HTML Sanitization (P0)

| Layer | Implementation |
|-------|----------------|
| Server | `server/src/utils/htmlSanitize.js` — `sanitize-html` with allowlist tags/attributes |
| CMS | `cmsController.js` — `content` + `sections[].body` sanitized |
| Career articles | `adminCareerArticlesController.js` — `content` via `sanitizeHtml` |
| Blogs | `adminBlogsController.js` — `content` via `sanitizeHtml` |
| Imports | `importHandlers.js` — HTML fields sanitized, plain text stripped |
| Employer jobs | `employerController.js` — descriptions via `stripAllHtml` |
| Applications | `applicationsController.js` — cover letters stripped |
| Client | `client/src/utils/sanitizeHtml.js` — DOMPurify before `dangerouslySetInnerHTML` |
| Render sites | `CmsPageView.jsx`, `CareerArticleDetail.jsx` |

**Allowed:** headings, paragraphs, lists, links, emphasis, tables, images (safe attrs)  
**Stripped:** `<script>`, iframes, event handlers, `javascript:` URLs, dangerous attributes

### 2. Content Security Policy (CSP)

| Location | File |
|----------|------|
| API / server responses | `server/src/config/security.js` → Helmet in `server/src/index.js` |
| SPA dev/preview | `client/vite.config.js` — matching CSP response headers |

**Third-party allowlist:** Google AdSense, Google Analytics/Tag Manager, Stripe, Cloudinary, Brevo/Sendinblue, Google Fonts.

**Development exceptions:** `'unsafe-inline'` + `'unsafe-eval'` for Vite HMR only.

### 3. Security Headers (Helmet)

Configured in `getHelmetOptions()`:

- Content-Security-Policy
- X-Content-Type-Options (`nosniff`)
- X-Frame-Options (via `frameguard: sameorigin`)
- Referrer-Policy (`strict-origin-when-cross-origin`)
- Permissions-Policy (via Helmet defaults + SPA `Permissions-Policy` in Vite)
- Strict-Transport-Security (production only)
- Cross-Origin-Opener-Policy (`same-origin-allow-popups` — Stripe/popups)
- Cross-Origin-Resource-Policy (`cross-origin`)

Static `/uploads` also sets `X-Content-Type-Options: nosniff`, denies dotfiles, disables directory index.

### 4. File Upload Hardening

| Endpoint | Changes |
|----------|---------|
| `POST /admin/upload/image` | SVG removed; magic-byte sniff; permission check; upload rate limit; generated names |
| `POST /jobs/:id/apply` | Resume magic-byte validation; upload rate limit |
| `POST /users/resume-analyze` | Same resume validation; upload rate limit |
| `POST /admin/import/:resource` | Random filenames; dangerous extension rejection |

**Utilities:** `server/src/utils/fileValidation.js` — MIME sniffing (JPEG/PNG/GIF/WebP/ICO/PDF/DOCX), double-extension rejection, size caps.

**Storage:** `storageService.js` — extensions from detected MIME, never from user filename; Cloudinary public IDs use random suffixes.

### 5. API & Auth Hardening

- **Employer auth rate limit** — `employerAuthLimiter` on register/login (`routes/employer.js`)
- **Upload rate limit** — `uploadLimiter` (20/min prod) on upload routes
- **Admin image upload RBAC** — requires `content:site|blogs|career|jobs` permission
- **Production env** — `validateEnv.js` now requires `MONGO_URI`; warns on missing CORS/Cloudinary config

Existing controls retained: JWT + refresh rotation, auth/forgot-password limiters, mongo-sanitize, 1MB JSON cap, CORS allowlist, production-safe error handler.

### 6. Authentication & Authorization (Review Findings)

| Area | Status | Notes |
|------|--------|-------|
| JWT access/refresh | ✅ | Rotation, revocation list, typed refresh tokens |
| Rate limits (user auth) | ✅ | login/register/reset/forgot |
| Rate limits (employer) | ✅ Fixed | Added in C.2 |
| RBAC on admin | ✅ | CMS, content modules, upload permissions |
| Tokens in localStorage | ⚠️ | Known XSS risk if sanitizer bypassed; mitigated by C.2 sanitization |
| Error stack leakage | ✅ | Hidden in production |

### 7. Dependency Audit Summary

**Server (`npm audit`):** 9 issues — mostly dev transitive (eslint/brace-expansion) and **nodemailer** (high — upgrade to 9.x recommended, breaking). **multer 1.x** remains (upgrade to 2.x deferred — breaking).

**Client:** 16 issues — largely dev tooling; **dompurify** added as direct dependency for render safety.

**Action taken:** No breaking upgrades applied per sprint scope. Documented for follow-up.

---

## Files Modified / Added

### Server (new)
- `server/src/utils/htmlSanitize.js`
- `server/src/utils/fileValidation.js`
- `server/src/config/security.js`

### Server (modified)
- `server/src/index.js` — Helmet CSP, upload static hardening
- `server/src/utils/cmsHelpers.js` — delegates to htmlSanitize
- `server/src/controllers/cmsController.js`
- `server/src/controllers/admin/adminCareerArticlesController.js`
- `server/src/controllers/admin/adminBlogsController.js`
- `server/src/controllers/admin/adminUploadController.js`
- `server/src/controllers/applicationsController.js`
- `server/src/controllers/employerController.js`
- `server/src/controllers/resumeAnalyzerController.js`
- `server/src/services/importHandlers.js`
- `server/src/services/storageService.js`
- `server/src/middleware/imageUpload.js`
- `server/src/middleware/upload.js`
- `server/src/middleware/importUpload.js`
- `server/src/middleware/rateLimit.js`
- `server/src/routes/admin.js`
- `server/src/routes/employer.js`
- `server/src/routes/jobs.js`
- `server/src/routes/users.js`
- `server/src/config/validateEnv.js`
- `server/package.json` — `sanitize-html`

### Client (new)
- `client/src/utils/sanitizeHtml.js`

### Client (modified)
- `client/src/components/static/CmsPageView.jsx`
- `client/src/pages/CareerGuidance/CareerArticleDetail.jsx`
- `client/vite.config.js` — SPA CSP headers
- `client/package.json` — `dompurify`

### Tooling
- `scripts/verify-sprint-c2.mjs`

---

## Sanitization Strategy

```
Write path:  User/API → sanitizeHtml() or stripAllHtml() → MongoDB
Read path:   MongoDB → API → React (text) OR DOMPurify → dangerouslySetInnerHTML
```

- **Rich HTML fields** (CMS pages, career articles, blog content): `sanitizeHtml` on write + DOMPurify on render
- **Plain text fields** (job descriptions, cover letters, import descriptions): `stripAllHtml` on write; React text nodes on read

---

## Upload Validation Summary

| Type | Max size | MIME check | Magic bytes | SVG | Filename |
|------|----------|------------|-------------|-----|----------|
| Admin image | 5 MB | ✅ | ✅ | ❌ Rejected | Random + safe ext |
| Resume PDF/DOCX | 5 MB | ✅ | ✅ | N/A | Random + safe ext |
| Import JSON/CSV/XLS | 10 MB | Extension | N/A | N/A | Random prefix |

---

## Remaining Risks

1. **JWT in localStorage** — HttpOnly cookies would be stronger (future sprint).
2. **multer 1.x** — Known advisories; upgrade to 2.x when feasible.
3. **nodemailer 6.x** — Multiple high CVEs; upgrade to 9.x recommended.
4. **CSP `unsafe-inline` styles** — Required for Tailwind/React; script inline blocked in production.
5. **Admin rich-text fields** — Job/scholarship descriptions in admin controllers still use `sanitizeString` (plain text display); HTML not expected but defense-in-depth could add `stripAllHtml` everywhere.
6. **Public `/uploads`** — Local files remain publicly readable when Cloudinary not configured; use Cloudinary in production.
7. **Draft CMS preview** — Staff-only; no public draft token (by design from C.1).

---

## Manual QA Checklist

### XSS / CMS
- [ ] Save CMS page with `<script>alert(1)</script>` — stripped after save
- [ ] Save career article with `onerror=` in HTML — stripped
- [ ] Published CMS/career pages render safe formatting (headings, links, lists)

### Uploads
- [ ] Resume PDF upload on job apply works
- [ ] Resume analyzer accepts valid PDF/DOCX
- [ ] Reject `.exe` renamed as `.pdf` (magic-byte mismatch)
- [ ] Admin image upload works (JPEG/PNG); SVG rejected
- [ ] Cloudinary upload still works when configured

### Headers
- [ ] `curl -I http://localhost:5000/api/health` shows CSP, nosniff, Referrer-Policy
- [ ] Vite dev (`localhost:5173`) returns CSP headers

### Auth / RBAC
- [ ] Editor cannot upload without content permission
- [ ] Employer login rate-limited after repeated failures
- [ ] Stripe checkout/webhook still functional

### Regression
- [ ] Client `npm run build` passes
- [ ] Server starts without errors
- [ ] Login/logout/refresh works
- [ ] Existing pages load unchanged visually

---

## Verification Commands

```bash
cd client && npm run build
cd server && npm run dev
node scripts/verify-sprint-c2.mjs
```

Expected: **10/10** security checks pass with server running.

---

*End of Sprint C.2 report.*
