# Employer Intelligence Architecture (C.8.5)

## Principle

**Compose, do not recreate.** Employer Intelligence is a projection and action surface over canonical career platform services. There is no second candidate aggregate and no AI hiring decision engine.

```
TalentProfile
        ↓
OpportunityApplication
        ↓
Timeline
        ↓
Readiness
        ↓
Credentials
        ↓
Employer Workspace
```

## Canonical services (reuse only)

| Service | Role in Employer Intelligence |
|---------|-------------------------------|
| TalentProfile (+ ReadService) | Identity, headline, location, skills, resume version |
| OpportunityApplication | Pipeline stages, notes, interviews (when linked) |
| Legacy Application | Employer job inbox source; status ↔ stage bridge |
| Scoring / Readiness | Readiness score on Candidate Card + ranking factor |
| Credential Platform | Credential viewer |
| Document Platform | Document viewer |
| Timeline Platform | Timeline viewer + hiring.* verbs via CareerEventBus |
| Assessment Platform | Employer-visible verified skills |
| Dashboard Composition | Employer dashboard mirrors Career Dashboard V2 pattern |
| CareerEventBus | Domain events + fan-out |
| Search cache | Invalidated on hiring mutations |
| Analytics | Employer hiring event types |
| Notifications | Talent notified on hiring milestones |
| Localization / Permissions / Feature Flags | en/ur(+ar) strings, employer JWT, flags |

## Candidate Card

`EmployerCandidateCardService.buildCandidateCard(userId, applicationCtx)` returns a **projection**:

- Basic profile / headline / location / work preference — from TalentProfile
- Readiness Score — ScoringService
- Verified Skills — AssessmentService.getEmployerVisibleSkills
- Credentials / Documents / Timeline — platform services
- Application history / interview status / pipeline stage — OA + legacy bridge

It does **not** introduce `EmployerCandidate` persistence.

## Ranking

`EmployerRankingService` loads weights from `shared/employer/ranking/v1.json` (versioned, sum = 1).

Outputs:

```json
{
  "score": 0.72,
  "percent": 72,
  "version": "1.0.0",
  "weights": { "...": "..." },
  "factors": [{ "key": "readiness", "weight": 0.4, "rawScore": 0.8, "contribution": 0.32, "explanationKey": "..." }],
  "deterministic": true,
  "aiUsed": false
}
```

No hidden factors. No LLM / embeddings.

## Pipeline

Canonical stages from `PIPELINE_STAGES`. Employer mutations:

1. Update legacy Application status (employer job ownership)
2. Sync OpportunityApplication stage history when `legacyApplicationId` link exists
3. Emit hiring domain event (one write path → one event family)

Stage machine transitions for OA use `canTransition` / existing templates.

## Employer Dashboard Composition

```
Employer Dashboard
        ↓
Widget Registry (shared/employer/employerDashboardWidgetRegistry.js)
        ↓
EmployerDashboardCompositionService
        ↓
loadSharedContext → PROVIDERS → presentational widgets
```

Widgets never call APIs or mongoose. Client uses a single `GET /employer/intelligence/dashboard` composition fetch.

Widgets:

- Hiring Overview, Open Positions, Pipeline Metrics
- Candidate Rankings, Upcoming Interviews, Recent Activity
- Hiring Tasks, Recommended Candidates (deterministic rank filter), Verified Skills Summary

## Workspace APIs

All under employer auth + `EMPLOYER_INTELLIGENCE_ENABLED`:

| Method | Path |
|--------|------|
| GET | `/employer/intelligence/dashboard` |
| GET | `/employer/intelligence/candidates` |
| GET | `/employer/intelligence/candidates/:id` |
| GET | `/employer/intelligence/pipeline` |
| POST | `/employer/intelligence/candidates/:id/stage` |
| POST | `/employer/intelligence/candidates/:id/notes` |
| PUT | `/employer/intelligence/candidates/:id/interview` |
| POST | `/employer/intelligence/candidates/:id/interview/complete` |
| GET/POST/DELETE | `/employer/intelligence/saved-filters` |
| GET | `/employer/intelligence/ranking/weights` |
| GET | `/employer/intelligence/candidates/:id/timeline\|documents\|credentials` |

## Boundaries

| Layer | Responsibility |
|-------|----------------|
| Controllers | Auth context → service → JSON |
| Services | Composition, ranking, mutations, `emitCareerEvent` |
| Repositories | Persistence only |
| Bridges / handlers | Timeline, analytics, notifications, cache invalidation |

## Out of scope

AI recommendations, messaging, ATS/HRIS, video/proctoring, offer letters, CRM automation, payroll, background checks (see sprint report).
