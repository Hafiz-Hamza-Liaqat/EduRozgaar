# Sprint C.8.5 — Employer Intelligence Platform (Foundation)

**Status:** Complete  
**Date:** 2026-07-14  
**Scope:** Employer hiring workspace that **composes** TalentProfile, OpportunityApplication, Timeline, Readiness, Credentials, and Documents. Deterministic ranking with explanations. No second hiring system, no AI matching, no ATS/HRIS.

---

## Summary

Delivered the Employer Intelligence foundation: candidate list/detail, hiring pipeline (canonical OA stages), deterministic ranking, saved filters, notes, interview scheduling, viewers (timeline / documents / credentials), and an Employer Dashboard composition layer mirroring Career Dashboard V2. Employer actions emit CareerEventBus events; Timeline, Analytics, Notifications, and search caches update only through registered handlers/bridges.

---

## Architecture

```
TalentProfile
        ↓
OpportunityApplication  (+ legacy Application bridge for employer job inbox)
        ↓
Timeline / Readiness / Credentials / Documents / Assessments
        ↓
EmployerCandidateCard (projection)
        ↓
Employer Ranking (deterministic weights)
        ↓
Employer Workspace + Dashboard Composition
```

See `docs/EMPLOYER_INTELLIGENCE_ARCHITECTURE.md`.

---

## Deliverables

| Artifact | Path |
|----------|------|
| Implementation report | `docs/SPRINT_C8_5_IMPLEMENTATION_REPORT.md` |
| Architecture | `docs/EMPLOYER_INTELLIGENCE_ARCHITECTURE.md` |
| Verifier | `scripts/verify-employer-intelligence.mjs` |
| npm script | `npm run verify:employer-intelligence` |

---

## Key files

| Layer | Path |
|-------|------|
| Ranking weights | `shared/employer/ranking/v1.json`, `rankingWeights.js` |
| Widget registry | `shared/employer/employerDashboardWidgetRegistry.js` |
| Candidate card | `server/src/services/career/EmployerCandidateCardService.js` |
| Ranking | `server/src/services/career/EmployerRankingService.js` |
| Workspace | `server/src/services/career/EmployerIntelligenceService.js` |
| Dashboard composition | `server/src/services/career/EmployerDashboardCompositionService.js` |
| Event bridge | `server/src/services/career/careerEmployerBridge.js` |
| Routes | `server/src/routes/employerIntelligence.js` |
| Client UI | `client/src/pages/Employer/EmployerIntelligence*.jsx`, `EmployerCandidates.jsx`, `EmployerPipeline.jsx`, `EmployerCandidateDetail.jsx` |
| Widgets | `client/src/employerIntelligence/widgets/*` |

---

## Event flow

| Employer action | Domain event | Side effects (handlers only) |
|-----------------|--------------|------------------------------|
| Open candidate | `CandidateViewed` | Timeline, analytics, cache |
| Move to screening | `CandidateShortlisted` | Timeline, analytics, notifications |
| Schedule interview | `InterviewScheduled` | Timeline, analytics, notifications |
| Complete interview | `InterviewCompleted` | Timeline, analytics, notifications |
| Move to offer | `OfferSent` | Timeline, analytics, notifications |
| Accept / hire | `OfferAccepted` / `CandidateHired` | Timeline, analytics, notifications |
| Reject | `CandidateRejected` / `OfferRejected` | Timeline, analytics, notifications |
| Add note | `HiringNoteAdded` | Timeline, analytics |

Controllers never call Timeline / Analytics / Notifications / Search directly.

---

## Ranking (deterministic)

Configurable weights (`shared/employer/ranking/v1.json`):

| Factor | Weight |
|--------|--------|
| Readiness | 40% |
| Verified assessments | 25% |
| Experience | 20% |
| Profile completeness | 10% |
| Recent activity | 5% |

Every ranked candidate includes `ranking.factors[]` with weight, raw score, contribution, and explanation key. `aiUsed: false`.

---

## Pipeline

Reuses `PIPELINE_STAGES` / OpportunityApplication state machine. Legacy Application statuses are projected via `LEGACY_STATUS_TO_PIPELINE` / `PIPELINE_TO_LEGACY_STATUS`. No second pipeline.

---

## Feature flags

- `EMPLOYER_INTELLIGENCE_ENABLED` (server)
- `VITE_EMPLOYER_INTELLIGENCE_ENABLED` (client)

Routes gated with `requireAuth` + `requireEmployerAuth` + `requireEmployerIntelligenceEnabled`.

---

## Explicitly out of scope (deferred)

AI hiring recommendations, LLM matching, resume AI scoring, messaging, email marketing, payroll, ATS/HRIS, video interviews, coding IDE, proctoring, webcam monitoring, offer letter generation, background verification, referrals, recruitment CRM automation.

---

## Verification

```bash
npm run verify:employer-intelligence
```

Gates nested: `verify:career-platform`, `verify:career-dashboard-v2`, `verify:readiness`, plus client build.

---

## 📋 Implementation Checklist

### Employer Intelligence Foundation
- [x] Employer Workspace implemented
- [x] Employer Dashboard composition layer
- [x] Candidate List
- [x] Candidate Detail
- [x] Candidate Cards
- [x] Hiring Pipeline
- [x] Candidate Ranking
- [x] Search & Filters
- [x] Saved Views
- [x] Interview Scheduling
- [x] Notes
- [x] Timeline Viewer
- [x] Document Viewer
- [x] Credential Viewer

### Platform Integration
- [x] TalentProfile integration
- [x] OpportunityApplication integration
- [x] Timeline integration
- [x] Credential Platform integration
- [x] Document Platform integration
- [x] Readiness integration
- [x] Search integration
- [x] Analytics integration
- [x] Notifications integration
- [x] Localization preserved
- [x] Permissions enforced
- [x] Feature flags honored

### Verification
- [x] verify:employer-intelligence PASS
- [x] verify:career-platform PASS
- [x] verify:career-dashboard-v2 PASS
- [x] verify:readiness PASS
- [x] Client build PASS
