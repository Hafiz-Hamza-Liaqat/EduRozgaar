# Sprint C.8.0.3B — OpportunityApplication UI Integration

**Status:** Complete  
**Date:** 2026-07-13  
**Scope:** First user-facing application management UI powered by OpportunityApplication APIs. No Kanban, employer CRM, AI, analytics dashboards, bulk actions, timeline editing, or collaboration.

---

## Summary

Exposed the C.8.0.3A OpportunityApplication backend through a clean, reusable client layer. Users can list, filter, search, and sort applications; view read-only detail sections (stage history, notes, documents, reminders, activity); and create new applications via platform or external flows with optional TalentProfile document attachment.

All UI reads and writes go through `applicationsApi` → `/api/applications/*`. No direct writes to legacy `Application` models from these screens.

---

## UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Pages (ProtectedRoute)                                         │
│  ├── MyApplications      /applications                          │
│  ├── CreateApplication   /applications/new                      │
│  └── ApplicationDetail   /applications/:id                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  applicationsApi.js  →  GET/POST/PATCH/DELETE /api/applications │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│ applicationUi   │ │ careerFeature   │ │ talentApi            │
│ (filter/sort/   │ │ Flags           │ │ (DocumentPicker      │
│  badges/dates)  │ │ VITE_OPPORTUNITY│ │  listDocuments)      │
└─────────────────┘ │ _APPLICATION_   │ └──────────────────────┘
                    │ ENABLED         │
                    └─────────────────┘

Components (client/src/components/applications/)
├── ApplicationCard   — list row with StageBadge, type, updated date
├── StageBadge        — localized 13-stage label + aria-label
├── StageTimeline     — read-only vertical stage history
└── DocumentPicker    — TalentProfile document selection
```

### Navigation entry points

| Location | Route / action |
|----------|----------------|
| User account menu | `ROUTES.APPLICATIONS` |
| Dashboard quick link | Primary “My Applications” |
| Scholarship detail | “Track new application” → external create |
| Admission detail | “Track new application” → external create |
| My Applications | “Track new application” → `/applications/new` |

---

## Screens Implemented

### My Applications (`/applications`)

- Lists user applications from `applicationsApi.list()`
- Type filters: All, Jobs, Scholarships, Admissions, Internships
- Search by title, company, or stage
- Sort: recently updated, oldest updated, title A–Z, stage order
- `StageBadge` on each `ApplicationCard`
- Responsive header and filter toolbar (`flex-col` / `sm:flex-row`)
- Keyboard-friendly controls (`min-h-[44px]`, `focus-visible:ring`, `aria-pressed` on filter chips)

### Application Detail (`/applications/:id`)

| Section | Data source | Mode |
|---------|-------------|------|
| Opportunity summary | `application.opportunityRef`, resolved listing metadata | Read-only |
| Current stage | `application.pipelineStage` | `StageBadge` |
| Stage history | `application.stageHistory` | `StageTimeline` (read-only) |
| Notes | `application.notes` | Viewer |
| Documents | `application.documentReferences` | Viewer |
| Reminders | `application.reminderReferences` | Viewer |
| Activity | `application.activityReferences` | Read-only feed |

Sections use `aria-labelledby` and semantic `<section>` markup.

### Create Application (`/applications/new`)

- **Platform mode:** `opportunityType` + `opportunityId` → `POST /applications` with `source: 'platform'`
- **External mode:** title, company, external URL → `source: 'external'`
- Query params prefill: `?external=1&type=…&title=…&url=…` (scholarship/admission detail links)
- Optional resume attach via `DocumentPicker` → `applicationsApi.attachDocument` with `role: 'resume'`
- Redirects to detail page on success

---

## API Consumption

`client/src/services/applicationsApi.js` is the sole integration surface for application UI:

| Method | Endpoint | Used by |
|--------|----------|---------|
| `list` | `GET /applications` | MyApplications |
| `getById` | `GET /applications/:id` | ApplicationDetail |
| `create` | `POST /applications` | CreateApplication |
| `attachDocument` | `POST /applications/:id/documents` | CreateApplication |

Detail viewers do not call mutation endpoints (notes/documents/reminders add flows deferred to later sprints).

**TalentProfile:** `DocumentPicker` uses `talentApi.listDocuments()` only — no legacy resume APIs.

---

## Feature Flag Behavior

| Flag | Default | Effect when disabled |
|------|---------|----------------------|
| `VITE_OPPORTUNITY_APPLICATION_ENABLED` | enabled (`!== '0'`) | Pages show `applications:featureDisabled`; no API calls |
| Server `OPPORTUNITY_APPLICATION_ENABLED` | enabled | API returns 503/feature gate |

Client flag is checked via `isOpportunityApplicationEnabled()` in `careerFeatureFlags.js`. Scholarship and admission “Track new application” links are hidden when the flag is off.

---

## Localization

- Namespace: `applications` (en + ur)
- Registered in `client/src/i18n/config.js`
- All 13 pipeline stages localized under `applications.stages.*`
- Dates formatted via `formatApplicationDate()` in `applicationUi.js` using `getLanguageConfig()` locale

---

## Accessibility

- Filter chips: `aria-pressed`, `aria-label` on search/sort controls
- Stage badge: `aria-label` with interpolated stage name
- Detail sections: `aria-labelledby`, activity list `role="list"`
- Touch/keyboard targets: `min-h-[44px]`, visible focus rings
- Error/empty states: `role="alert"`

---

## Verification

### Script

```bash
npm run verify:application-ui
```

Checks (35 assertions):

- Route constants and protected lazy routes
- Pages use `applicationsApi` only; no legacy Application writes
- TalentProfile document picker integration
- `applications` i18n namespace + all stage labels
- Client feature flag honored
- UI components exist; responsive layout patterns
- Accessibility attributes on list/detail/badge
- Detail sections (notes, documents, reminders, activity, stage history)
- External flow (scholarship link + create external mode)
- `.env.template` documents `VITE_OPPORTUNITY_APPLICATION_ENABLED`
- Sub-suite: `verify:opportunity-application`

### Results (2026-07-13)

| Command | Result |
|---------|--------|
| `npm run verify:application-ui` | **PASS** (35/35) |
| `npm run verify:opportunity-application` | **PASS** (sub-suite) |
| `npm run verify:career-domain` | **PASS** (24/24) |
| `client` `npm run build` | **PASS** |

`verify:application-ui` is wired into `verify:career-domain`.

---

## Manual QA Checklist

- [ ] Sign in → Dashboard → “My Applications” opens `/applications`
- [ ] User menu → “My Applications” works
- [ ] Empty state shows “Track your first application”
- [ ] Create platform application (job ID) → lands on detail
- [ ] Create external application (manual title/URL) → detail shows external source
- [ ] Scholarship detail → “Track new application” prefills external form
- [ ] Admission detail → “Track new application” prefills external form
- [ ] Attach resume from TalentProfile documents on create
- [ ] Filter by Jobs / Scholarships / Admissions / Internships
- [ ] Search and sort change visible list
- [ ] Detail page shows stage badge, timeline, notes, documents, reminders, activity (when data exists)
- [ ] Switch locale (en ↔ ur) — labels and dates update
- [ ] Set `VITE_OPPORTUNITY_APPLICATION_ENABLED=0` — feature disabled message, no track links on listings
- [ ] Mobile viewport — list and detail layouts remain usable

---

## Known Limitations

| Item | Notes |
|------|-------|
| Read-only detail | No inline note edit, stage transition, or reminder creation in UI |
| Job / Internship listing links | No “Track application” CTA on JobDetail or InternshipDetail yet; use `/applications/new` manually |
| Activity feed | Displays references only; full timeline platform is C.8.0.4 |
| Legacy Application model | Employer job applications and internship `myApplications` APIs unchanged |
| Kanban / CRM / AI | Explicitly out of scope for this sprint |

---

## Files Added / Modified

### New

- `client/src/services/applicationsApi.js`
- `client/src/utils/applicationUi.js`
- `client/src/components/applications/*` (4 components)
- `client/src/pages/Applications/*` (3 pages)
- `client/src/i18n/locales/en/applications.json`
- `client/src/i18n/locales/ur/applications.json`
- `scripts/verify-application-ui.mjs`
- `docs/SPRINT_C8_0_3B_IMPLEMENTATION_REPORT.md`

### Modified

- `client/src/routes/index.jsx` — protected application routes
- `client/src/constants/index.js` — `APPLICATIONS`, `APPLICATIONS_NEW`
- `client/src/config/careerFeatureFlags.js` — `isOpportunityApplicationEnabled`
- `client/src/i18n/config.js` — `applications` namespace
- `client/src/components/layout/UserAccountMenu.jsx`
- `client/src/pages/Dashboard/Dashboard.jsx`
- `client/src/pages/Scholarships/ScholarshipDetail.jsx`
- `client/src/pages/Admissions/AdmissionDetail.jsx`
- `package.json` — `verify:application-ui`
- `scripts/verify-career-domain.mjs` — includes application-ui sub-suite
- `.env.template` — `VITE_OPPORTUNITY_APPLICATION_ENABLED`

---

## Implementation Checklist

### OpportunityApplication UI

- [x] My Applications page implemented
- [x] Application Detail page implemented
- [x] Opportunity summary section
- [x] Stage history timeline (read-only)
- [x] Notes viewer
- [x] Documents viewer
- [x] Reminders viewer
- [x] Activity feed (read-only)

### Application Creation

- [x] Create application via OpportunityApplication API
- [x] Resume selection from TalentProfile
- [x] Document picker integration
- [x] External application support preserved (scholarship + admission detail links; external create mode)

### Platform Integration

- [x] TalentProfile integration
- [x] Localization integration
- [x] Permissions enforced (ProtectedRoute + server auth on API)
- [x] Feature flags honored

### Verification

- [x] `verify:application-ui` PASS
- [x] `verify:opportunity-application` PASS
- [x] `verify:career-domain` PASS
- [x] Client build PASS

---

## Next Sprint

**C.8.0.4 — Timeline Platform** (activity feed enrichment, timeline service)  
**C.8.1 — Full Job Application Tracker** (Kanban, mutations, advanced UX)
