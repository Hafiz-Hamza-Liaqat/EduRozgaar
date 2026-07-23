# Sprint C.7.0.2 — Forms Builder Foundation

**Status:** Implemented  
**Date:** July 2026  
**Milestone:** C.7.0 — Platform Forms Service

## Summary

Built a reusable **Forms Builder platform service** with separate `FormDefinition` and `FormSubmission` models, drag-and-drop admin builder, shared client/server validation, notifications, spam protection, Media Library file uploads, Page Builder **Form** block, and a single `FormRenderer` runtime.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin Builder  │────▶│  FormDefinition  │     │ FormSubmission  │
│  /admin/forms   │     │  (MongoDB)       │     │ (MongoDB)       │
└────────┬────────┘     └────────┬─────────┘     └────────▲────────┘
         │                       │                         │
         │              ┌────────▼─────────┐               │
         │              │  Public API      │───────────────┘
         │              │  POST /forms/:slug/submit
         │              └────────┬─────────┘
         │                       │
┌────────▼────────┐     ┌────────▼─────────┐
│ Page Builder    │     │  FormRenderer    │
│ Form Block      │────▶│  (single runtime)│
└─────────────────┘     └──────────────────┘
```

Definitions and submissions are **never mixed**. Published forms are read-only at runtime; submissions store field values + file references separately.

## Data Model

### FormDefinition (`server/src/models/FormDefinition.js`)

| Field | Purpose |
|-------|---------|
| `name`, `slug`, `description`, `category` | Identity & organization |
| `status` | `draft` \| `published` |
| `version` | Auto-increment on field changes |
| `fields[]` | Field definitions (type, label, name, validation, options) |
| `settings` | Submit label, layout |
| `notifications` | Admin/user email config |
| `successMessage`, `redirectUrl` | Post-submit UX |
| `spamSettings` | Honeypot, rate limit hints, CAPTCHA provider |

### FormSubmission (`server/src/models/FormSubmission.js`)

| Field | Purpose |
|-------|---------|
| `formId`, `formSlug`, `formVersion` | Reference to definition snapshot |
| `data` | Submitted field values |
| `files[]` | Media asset references (URL, assetId, filename) |
| `status` | `new` \| `read` |
| `ipHash`, `userAgent`, `spamScore` | Audit & spam |

## Field Types (17)

Text, Textarea, Email, Phone, Number, Date, Select, Radio, Checkbox, Multi-checkbox, File Upload, URL, Hidden, Divider, Heading, Rich text, Consent.

Each input field supports: required, placeholder, help text, validation rules, default value, conditional hook (`conditional: null` for future).

## APIs

### Public (`/api/forms`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/forms/:slug` | Published form definition (sanitized) |
| GET | `/forms/id/:id` | Published form by ID (for page builder) |
| POST | `/forms/:slug/submit` | Submit (JSON or multipart) |
| POST | `/forms/:slug/upload` | Pre-upload file field (rate limited) |

### Admin (`/api/admin/forms`)

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/forms` | `content:site` |
| GET/PUT/DELETE | `/forms/:id` | `content:site` |
| POST | `/forms/:id/duplicate` | `content:site` |
| GET | `/forms/published` | `content:site` |
| GET | `/forms/submissions` | `users:read` |
| GET/PATCH/DELETE | `/forms/submissions/:id` | `users:read` / `users:manage` |
| GET | `/forms/submissions/export` | `export:data` |

## Validation

- **Shared:** `shared/formSchema.js` — `validateFormDefinition`, `validateFieldValue`, `validateSubmission`
- **Client:** `FormRenderer` validates before submit
- **Server:** `formPublicController` re-validates all submissions

Rules: required, email, URL, phone, number min/max, regex, char limits, file size/type, select option whitelist.

## Notifications

`server/src/services/formNotificationService.js` — swappable provider pattern:

- Admin email via `sendFormAdminAlertEmail` + `queueEmail` template `formAdminAlert`
- User confirmation via `formConfirmation` template (when enabled)
- Staff in-app notification via `notifyStaff`

## Spam Protection

`server/src/services/formSpamService.js`:

- Honeypot field (silent 201 on bots)
- `formSubmissionLimiter` — 10/hour per IP (prod)
- reCAPTCHA / Turnstile abstraction (`captchaProvider: none` by default; requires env secrets)

## Media Library Integration

File uploads use `getStorageProvider()` + `MediaAsset` records in `forms/{slug}/` folders (`formSubmissionService.uploadFormFile`). No separate upload stack.

## Page Builder Integration

- New block type: `form` in `shared/blockRegistry.js`
- `FormBlock` → `FormRenderer` with `formId`
- `FormPickerField` in `BlockCustomField.jsx` for form selection
- Block registry: **17 blocks** (verify:blocks PASS)

## Admin UI

| Route | Page |
|-------|------|
| `/admin/forms` | Form list, duplicate, delete |
| `/admin/forms/new` | Create form |
| `/admin/forms/:id` | Drag-and-drop builder + live preview |
| `/admin/forms/submissions` | Inbox, search, filter, CSV export |

Builder features: add/delete/duplicate/reorder fields (@dnd-kit), collapse/expand, settings, notifications, spam config, live preview.

## Files Added / Modified

### Added
- `shared/formSchema.js`, `shared/formValidation.js`
- `server/src/models/FormDefinition.js`, `FormSubmission.js`
- `server/src/services/formService.js`, `formSubmissionService.js`, `formNotificationService.js`, `formSpamService.js`
- `server/src/controllers/formPublicController.js`
- `server/src/controllers/admin/formAdminController.js`, `formSubmissionAdminController.js`
- `server/src/middleware/formUpload.js`
- `server/src/routes/forms.js`
- `client/src/services/formsApi.js`
- `client/src/components/forms/FormRenderer.jsx`, `FormFieldInput.jsx`, `FormPickerField.jsx`
- `client/src/pages/Admin/AdminForms.jsx`, `AdminFormEditor.jsx`, `AdminFormSubmissions.jsx`
- `scripts/verify-forms.mjs`
- `docs/SPRINT_C7_0_2_IMPLEMENTATION_REPORT.md`

### Modified
- `shared/blockRegistry.js` — `form` block
- `client/src/components/pageBuilder/blockComponentMap.js`, `blocks/index.jsx`, `editors/BlockCustomField.jsx`, `SortableBlockRow.jsx`
- `client/src/services/adminContentApi.js`
- `client/src/routes/index.jsx`, `config/adminNavConfig.js`, `i18n/locales/en/admin.json`
- `server/src/routes/admin.js`, `routes/index.js`, `index.js`
- `server/src/middleware/rateLimit.js`
- `server/src/services/emailService.js`, `templates/emailTemplates.js`
- `package.json`

## Verification

```bash
npm run verify:forms    # 30 checks — PASS
npm run verify:blocks   # 17 blocks — PASS
cd client && npm run build  # PASS
```

## Manual QA Checklist

- [ ] Create form at `/admin/forms/new`, add email + textarea fields, publish
- [ ] Open Page Builder, add **Form** block, select published form, save layout
- [ ] View public page — form renders, submit valid data → success message
- [ ] Submit invalid email → inline field errors
- [ ] Fill honeypot field (dev tools) → silent success, no submission in inbox
- [ ] Add file field, upload image/PDF, submit → file URL in submission detail
- [ ] `/admin/forms/submissions` — mark read, export CSV, delete
- [ ] Duplicate form, edit slug, verify both work independently

## Constraints Honored

- No changes to Page Builder architecture (additive block only)
- Advertisement, slug, routing, CMS runtime unchanged
- Media Library architecture reused, not duplicated
- Existing APIs unchanged except additive routes
- Backward compatible — contact/newsletter forms still work

## Known Limitations

- CAPTCHA providers stubbed until `RECAPTCHA_SECRET_KEY` / `TURNSTILE_SECRET_KEY` configured
- Conditional field visibility schema present but UI/runtime not wired (future-ready)
- Rich text field renders static HTML from `defaultValue` only (no WYSIWYG in builder)
- Submission search uses basic regex on serialized data (not full-text indexed)
- Per-form custom rate limits stored in schema but global `formSubmissionLimiter` used at route level

## Roadmap

| Sprint | Focus |
|--------|-------|
| C.7.0.3 | Dynamic Content Blocks |
| C.7.0.4 | Global Search & Indexing |
| C.7.0.5 | Analytics & Insights |
