# Sprint C.8.0.2B.2 — Platform-wide TalentProfile Adoption

**Status:** Complete  
**Date:** 2026-07-13  
**Objective:** Replace duplicate profile reads so TalentProfile is the single consumer-facing source of career identity. No new user-facing features — integration and migration only.

---

## Summary

This sprint introduces a **read/adoption layer** on top of the C.8.0.2A backend and C.8.0.2B.1 editor. Resume Builder becomes a **view/export** over TalentProfile. Platform modules read career data through `TalentProfileReadService` and new `/api/talent/me/*` adoption endpoints, with legacy `Resume` and `User` fields retained for backward compatibility during rollout.

---

## Architecture

```
User (auth, notification prefs)
        │
        ▼
TalentProfile (canonical career identity)
        │
        ├── ResumeVersion (primary snapshot for builder/export)
        ├── ProfileDocument (uploaded assets)
        └── legacy Resume (optional dual-write)
```

**Read path:** `TALENT_PROFILE_READ_CANONICAL=1` → canonical TalentProfile first; otherwise legacy Resume fallback when present.

**Write path:** Resume Builder saves → `TalentProfileService.update` → optional `dualWriteLegacyResume` when `TALENT_PROFILE_DUAL_WRITE=1`.

---

## Modules Migrated

| Module | Change |
|--------|--------|
| **Resume Builder** | Loads/saves via `GET/PUT /talent/me/resume-builder`; legacy `resumesApi` fallback when talent API disabled |
| **Job Apply (JobDetail)** | Apply-kit document picker; server resolves profile resume URL when no upload |
| **Scholarship Apply** | `ApplyKitBanner` on detail page — profile summary + document links for external apply |
| **Admission Apply** | Same apply-kit banner pattern |
| **Employer candidate preview** | `getJobApplications` enriches with `candidate` card from TalentProfile |
| **Candidate cards** | `talentProfileToCandidateCard` in shared bridge + employer UI |
| **Dashboard** | Career headline, resumes from dashboard API summary (no separate `resumesApi` list) |
| **Dashboard header / profile summary** | `UserAccountMenu` loads `/talent/me/summary` for headline |
| **Forms autofill** | `FormRenderer` prefills from `/talent/me/prefill` when authenticated |
| **Document picker** | Job apply + apply-kit surfaces `ProfileDocument` assets |
| **Recommendations** | Scoring uses `getCareerTargetingContext` (province/interests from profile when canonical) |
| **Notifications (dashboard)** | Targeting filters use career context from TalentProfile when canonical |
| **Search** | Already canonical via `mapTalentProfileToSearchDocument` (unchanged) |

---

## New / Modified Files

### Shared
- `shared/career/resumeBridge.js` — profile ↔ resume-builder ↔ candidate card ↔ form prefill

### Server
- `server/src/services/career/TalentProfileReadService.js`
- `server/src/controllers/career/profileAdoptionController.js`
- `server/src/routes/talent.js` — adoption routes
- `server/src/controllers/dashboardController.js`
- `server/src/controllers/applicationsController.js`
- `server/src/controllers/employerController.js`
- `server/src/controllers/recommendationsController.js`
- `server/src/models/Application.js` — `talentProfileId`, `resumeVersionId`, `resumeSource`

### Client
- `client/src/config/careerFeatureFlags.js`
- `client/src/services/talentApi.js` — adoption methods
- `client/src/components/career/ApplyKitBanner.jsx`
- `client/src/pages/ResumeBuilder/ResumeBuilder.jsx`
- `client/src/pages/Dashboard/Dashboard.jsx`
- `client/src/pages/Jobs/JobDetail.jsx`
- `client/src/pages/Scholarships/ScholarshipDetail.jsx`
- `client/src/pages/Admissions/AdmissionDetail.jsx`
- `client/src/pages/Employer/EmployerApplications.jsx`
- `client/src/components/forms/FormRenderer.jsx`
- `client/src/components/layout/UserAccountMenu.jsx`

### Verification
- `scripts/verify-profile-adoption.mjs`
- `scripts/verify-career-domain.mjs` — delegates to profile-adoption suite
- `package.json` — `verify:profile-adoption` script

---

## Remaining Legacy Consumers

| Consumer | Status | Notes |
|----------|--------|-------|
| `resumesApi` / `resumesController` | **Retained** | Backward compat; AI suggest & optimize-for-job still use legacy routes |
| `Profile.jsx` (account settings) | **Partial** | User account fields (name, province on User) unchanged; career editing via `/talent-profile` |
| `coverLetterApi` | **Legacy** | Not migrated this sprint |
| Dynamic blocks (candidate spotlight) | **None exist** | Registry has no candidate blocks yet; search mapper already canonical |
| Notification prefs on User | **By design** | Channel preferences stay on User; career *targeting* reads from TalentProfile |

---

## Migration Progress

| Area | Progress |
|------|----------|
| Canonical read service | 100% |
| Resume Builder → TalentProfile | 100% |
| Job apply flow | 100% |
| Scholarship / admission external apply | 100% (apply-kit banner) |
| Employer candidate preview | 100% |
| Dashboard / header summary | 100% |
| Form autofill | 100% |
| Document picker integration | 100% |
| Legacy Resume deprecation | ~60% — dual-read/dual-write paths active; full cutover pending `READ_CANONICAL=1` in production |

---

## Feature Flags

| Flag | Server | Client | Purpose |
|------|--------|--------|---------|
| `TALENT_PROFILE_ENABLED` | `!== '0'` (default on) | `VITE_TALENT_PROFILE_ENABLED` | Gate talent API |
| `TALENT_PROFILE_DUAL_WRITE` | `=== '1'` | — | Mirror profile → legacy Resume |
| `TALENT_PROFILE_READ_CANONICAL` | `=== '1'` | `VITE_TALENT_PROFILE_READ_CANONICAL` | Prefer TalentProfile on reads |

**Rollout recommendation:** Enable dual-write first, then flip read-canonical after hydration QA.

---

## Verification Results

| Command | Result |
|---------|--------|
| `npm run verify:career-domain` | **PASS** (22 checks) |
| `npm run verify:talent-profile` | **PASS** (53 checks) |
| `npm run verify:profile-adoption` | **PASS** (28 checks) |
| `cd client && npm run build` | **PASS** |

---

## Implementation Checklist

### TalentProfile Adoption
- [x] Resume Builder consumes TalentProfile
- [x] Job Apply flow consumes TalentProfile
- [x] Scholarship Apply consumes TalentProfile
- [x] Admission Apply consumes TalentProfile
- [x] Employer candidate preview consumes TalentProfile
- [x] Candidate cards consume TalentProfile
- [x] Dashboard header/profile summary consumes TalentProfile
- [x] Forms support profile autofill from TalentProfile
- [x] Document picker integrates with TalentProfile assets

### Migration
- [x] Legacy Resume remains backward compatible
- [x] No duplicate career writes introduced
- [x] Feature flags verified
- [x] Dual-read/dual-write paths validated

### Verification
- [x] verify:career-domain PASS
- [x] verify:talent-profile PASS
- [x] verify:profile-adoption PASS
- [x] Client build PASS

---

## Manual QA Checklist

1. **Resume Builder (logged in)** — Open `/resume-builder`; confirm data loads from profile; save; reload and verify persistence.
2. **Legacy edit URL** — Open `/resume-builder?edit=<legacyId>` with `READ_CANONICAL=0`; confirm legacy resume still loads.
3. **Job apply** — Apply without upload when profile has a document; confirm application stores `resumeSource=talent-profile-document`.
4. **Job apply upload** — Upload PDF; confirm `resumeSource=upload`.
5. **Employer applications** — View applications; confirm candidate name, headline, skills appear when profile exists.
6. **Dashboard** — Confirm headline under welcome message; resume list shows versions.
7. **Account menu** — Open menu; confirm career headline under display name.
8. **Form autofill** — Submit a form with `name`, `email`, `phone` fields while logged in; confirm prefill.
9. **Scholarship / admission detail** — Log in; confirm apply-kit banner with profile link and documents.
10. **Recommendations** — Update talent profile province/interests; confirm job recommendations shift (cache TTL ~10 min).
11. **Flags off** — Set `TALENT_PROFILE_ENABLED=0`; confirm Resume Builder falls back to legacy `resumesApi`.
12. **i18n** — Switch EN/UR; confirm talent namespace strings on apply-kit banner.

---

## Known Limitations

1. **AI resume features** (`ai-suggest`, `optimize-for-job`) still use legacy resume routes.
2. **Account Profile page** (`/profile`) may still show User-level province/interests; canonical career editing is on `/talent-profile`.
3. **External scholarship/admission apply** remains off-platform; apply-kit is informational only (no in-platform submission).
4. **Email in resume builder** is not stored on TalentProfile (auth email used at apply/form time).
5. **No dynamic block** for candidate cards in page builder yet — employer UI and API enrichment only.
6. **Production cutover** requires running hydration script and enabling `READ_CANONICAL` deliberately.

---

## What Comes After This?

**Sprint C.8.0.3 — OpportunityApplication Foundation**

- Unified application entity across jobs, scholarships, admissions, internships
- Application workflow states aligned with `C8_CAREER_DOMAIN_EVENT_WORKFLOW_ARCHITECTURE.md`
- Replace ad-hoc `Application` model extensions with canonical `OpportunityApplication`
- Event bus integration for apply → review → outcome pipelines
- Application tracker UI for talent users

TalentProfile adoption (this sprint) is the **final TalentProfile sprint** before OpportunityApplication, per roadmap.

---

## Related Documents

- `docs/C8_CAREER_DOMAIN_CANONICAL_CONTRACTS.md`
- `docs/C8_CAREER_DOMAIN_EVENT_WORKFLOW_ARCHITECTURE.md`
- `docs/SPRINT_C8_0_2A_IMPLEMENTATION_REPORT.md`
- `docs/SPRINT_C8_0_2B_1_IMPLEMENTATION_REPORT.md`
