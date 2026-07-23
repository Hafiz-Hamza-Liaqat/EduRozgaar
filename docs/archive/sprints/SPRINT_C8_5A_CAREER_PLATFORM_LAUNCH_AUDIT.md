# Sprint C.8.5A — Career Platform Stabilization & Launch Readiness Audit

**Status:** Complete  
**Date:** 2026-07-14  
**Type:** Enterprise audit (documentation + verification + **minimal P0/P1 fixes only**)  
**Release gate:** `npm run verify:career-launch-readiness`

---

## Executive Verdict

**GO — Career Intelligence platform is launch-ready** as the production foundation for EduRozgaar career surfaces and the shared platform base for future GigRadar (C.9).

No new user-facing features, domain models, or workflows were introduced beyond fixes required to boot and secure the stack.

---

## Scope Audited

| Area | Result |
|------|--------|
| Cross-module integration | PASS |
| Feature flags | PASS |
| CareerEventBus | PASS (with intentional non-timeline list) |
| Timeline | PASS |
| Migration | PASS (import paths fixed — was P0) |
| Search | PASS (entity registry includes talent-profile + credential) |
| Analytics | PASS |
| Performance | PASS with P2 debt noted (employer card composition still multi-query) |
| Security / Permissions | PASS (assessment authoring staff-gated) |
| Localization | PASS (dashboard ur notification keys restored) |
| Dashboard V2 | PASS |
| Employer Intelligence | PASS |
| Assessments | PASS |
| Readiness | PASS |
| Notifications | PASS |

---

## Integration Matrix (C.8 complete)

| Subsystem | Canonical model | Flag | Bus emit | Timeline | Analytics | Search | Notifications |
|-----------|-----------------|------|----------|----------|-----------|--------|---------------|
| TalentProfile | `TalentProfile` | `TALENT_PROFILE_*` | ✅ | ✅ | ✅ | ✅ public | — |
| OpportunityApplication | `opportunityApplications` | `OPPORTUNITY_APPLICATION_*` | ✅ | ✅ | ✅ | ❌ private | ✅ milestones |
| Timeline | `timelineEvents` | `TIMELINE_ENABLED` | meta | — | ✅ | — | — |
| Documents | `documents` | `DOCUMENTS_PLATFORM_*` | ✅ | ✅ | ✅ | — | — |
| Credentials | `credentials` | documents + verified | ✅ | ✅ | ✅ | ✅ active | — |
| Readiness / Scoring | `ScoreSnapshot` | `SCORING_ENABLED` | ✅ | intentional non-TL* | ✅ | — | — |
| Assessments | Assessment / Attempt | `ASSESSMENTS_*` | ✅ | ✅ (not Published*) | ✅ | — | — |
| Career Dashboard V2 | composition | `CAREER_DASHBOARD*_` | — | reads | — | — | widget |
| Employer Intelligence | projections + legacy Application bridge | `EMPLOYER_INTELLIGENCE_*` | ✅ hiring.* | ✅ | ✅ | cache invalidate | ✅ talent |

\*See intentional non-timeline events below.

---

## Event Bus Policy

### Timeline-mapped

All `CAREER_DOMAIN_EVENTS` either appear in `CAREER_EVENT_TO_TIMELINE` **or** are listed in `INTENTIONAL_NON_TIMELINE_CAREER_EVENTS`:

| Event | Reason |
|-------|--------|
| `TimelineEventCreated` | Meta — would recurse |
| `CareerScoreComputed` | High-frequency score infra |
| `ScoreSnapshotCreated` | Snapshot plumbing |
| `ReadinessUpdated` | Optional UI can use score.improved path later |
| `AssessmentPublished` | Catalog admin action; not talent activity |

Handlers registered at startup:

- `registerCareerTimelineHandlers`
- `registerCareerNotificationHandlers`
- `registerCareerScoringHandlers` (assessment + credential → readiness)

Controllers remain thin — no direct Timeline / Analytics / Notification calls on mutations.

---

## End-to-End Journeys (contract verified)

| Journey | Surfaces |
|---------|----------|
| Talent profile / resume | TalentProfileEditor → TalentProfileService → Documents / ResumeVersions |
| Applications | MyApplications / Detail → OpportunityApplicationService → bus → timeline/notifications |
| Assessments | Catalog → Take → AssessmentService → Credential → readiness recompute |
| Employer hiring | Intelligence dashboard → Candidates → Detail / Pipeline → EmployerIntelligenceService |
| Career dashboard | CareerDashboardPage → DashboardCompositionService → platform providers |

---

## P0 Fixes Applied (launch blockers)

| ID | Issue | Fix |
|----|-------|-----|
| P0-1 | Migration services under `services/career/migration/` used wrong relative imports → **server could not load routes** | Corrected `../../../models|repositories|config`, `../` sibling services, `../../../../../shared` |
| P0-2 | `employerIntelligenceController.js` imported via `../` instead of `../../` | Fixed |
| P0-3 | `admin/adminSearchController.js` same depth bug (blocked `routes/index.js`) | Fixed |

---

## P1 Fixes Applied

| ID | Issue | Fix |
|----|-------|-----|
| P1-1 | Assessment catalog authoring open to any talent JWT | Authoring routes require `requireAdmin` (`staffAuth`) |
| P1-2 | Employer → OA stage could silently skip sync | Employer transitions always sync OA when linked (`forced` metadata if template would block) |
| P1-3 | `listCandidates` sequential N+1 | Batched with concurrency 8 |
| P1-4 | Talent profile client missing feature flag | `TalentProfileEditor` gates on `isTalentProfileEnabled` |
| P1-5 | Domain events without timeline map / exclusion list | Added `INTENTIONAL_NON_TIMELINE_CAREER_EVENTS` + launch verifier policy |
| P1-6 | Dashboard ur missing notification keys | Added en/ur parity keys |
| P1-7 | `verify:search` expected exactly 10 entity types | Updated for career types (`talent-profile`, `credential`) |

---

## Accepted Debt (P2 — not launch-blocking)

| Item | Notes |
|------|-------|
| Analytics still largely inline bridges | Unify to bus subscribers in a future ops sprint |
| Legacy Application + OA dual-write | Controlled by flags; employer bridge documented |
| Dashboard recommendations load Job/Scholarship models directly | Composition still correct; extract recommendation service later |
| Employer card still multi-service per candidate | Mitigated with concurrency; batch APIs later |
| Timeline warm-tier archival | Not required for launch |

---

## Explicitly Not Done (deferred products)

- **C.9 GigRadar** — separate product; reuse auth, TalentProfile, Credentials, Readiness, Timeline, Assessments, Billing, Search, Analytics — **no second identity system**
- **C.10 Global Expansion** — country packs, multi-currency, visas, etc.

---

## Verification

```bash
npm run verify:career-launch-readiness
```

Cascades (among others): career-platform, career-domain, talent-profile, opportunity-application, application-tracker, timeline, documents, readiness, assessments, career-dashboard-v2, employer-intelligence, migration, search, analytics, security, plus client build and module-load smoke tests.

---

## 📋 Implementation Checklist (C.8.5 Review — confirmed)

### Employer Intelligence
- [x] Composition-only Candidate Card
- [x] Employer Workspace
- [x] Candidate List / Detail / Pipeline / Ranking
- [x] Saved Views / Search & Filters / Notes / Interview Scheduling
- [x] Timeline / Document / Credential Viewers

### Platform Integration
- [x] TalentProfile / OpportunityApplication / Timeline / Credentials / Documents
- [x] Readiness / Search / Analytics / Notifications
- [x] Localization / Permissions / Feature flags

### Verification
- [x] verify:employer-intelligence PASS
- [x] verify:career-platform PASS
- [x] verify:career-dashboard-v2 PASS
- [x] verify:readiness PASS
- [x] Client build PASS
- [x] **verify:career-launch-readiness PASS** (C.8.5A gate)

---

## Roadmap Clarity After Go

1. **Operate** Career Intelligence under flags in production  
2. **C.9 — GigRadar Foundation** on shared identity + career platform  
3. **C.10 — Global Expansion** after GigRadar foundation
