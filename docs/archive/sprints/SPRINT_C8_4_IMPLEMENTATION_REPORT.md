# Sprint C.8.4 — Verified Skills & Assessment Platform (Foundation)

**Status:** Complete  
**Date:** 2026-07-14  
**Scope:** Canonical Assessment domain that produces Verified Skills via the existing Credential Platform, feeds Readiness through CareerEventBus only, and surfaces progress on the Career Dashboard. Wraps Quiz/Mcq — does not replace Exam Prep. No AI, LMS, proctoring, employer assignment UI, or coding sandboxes.

---

## Summary

Introduced Assessment, QuestionBank, Question, AssessmentAttempt (+ embedded AssessmentResult), AssessmentCategory, and Assessment Rule / CredentialRule / Section schemas. Talent flow: catalog → detail → start → questions → submit → automatic scoring → optional credential → readiness recompute → timeline → analytics → dashboard widgets.

---

## Architecture

```
AssessmentCatalog (published Assessment)
        │
        ├── QuestionBank → Question
        │       └── optional legacyQuizId → Quiz/Mcq (bridge)
        │
        └── AssessmentAttempt
                ├── answers + questionSnapshot
                └── AssessmentResult
                        │
                        ├── CredentialPlatformService.issue (source: assessment)
                        ├── CareerEventBus (AssessmentCompleted / Passed / Failed)
                        │     ├── Timeline (assessment.*)
                        │     ├── Analytics (assessment_*)
                        │     └── Scoring recompute (readiness)
                        └── Dashboard composition widgets
```

### Domain diagram (aggregates)

```
AssessmentCategory (configurable slugs/families)
Assessment 1──* AssessmentSection
          1──* AssessmentRule
          1─── AssessmentCredentialRule
          *──1 QuestionBank 1──* Question
AssessmentAttempt *──1 TalentProfile
                  *──1 Assessment
                  0..1 Credential (via result.credentialId)
```

---

## Event flow

| Mutation | Event | Side effects |
|----------|-------|----------------|
| Publish | `AssessmentPublished` | analytics |
| Start | `AssessmentStarted` | Timeline, analytics |
| Submit/score | `AssessmentCompleted` | Timeline, analytics, readiness debounce |
| Pass | `AssessmentPassed` | Timeline, analytics, readiness |
| Fail | `AssessmentFailed` | Timeline, analytics |
| Credential | `CredentialIssued` / `CredentialVerified` | Existing credential bridges + readiness |

Controllers remain thin — no direct Timeline/Analytics/Scoring calls.

---

## Assessment lifecycle

```
draft → review → published → archived
Attempt: started → in_progress → submitted → scored | voided
```

Talent MVP uses published assessments; start creates snapshot; submit grades against snapshot `correctIndex` (never returned to client).

---

## Credential flow

```
score >= credentialRule.minScore (or passingScore)
  → CredentialPlatformService.issue({
       source: 'assessment',
       skillName, score, assessmentAttemptId,
       verificationStatus: active|pending,
       expiresAt from expiryDays
     })
  → appears in Credential Platform / Verified Skills widget
```

No second credential store.

---

## Readiness integration

Assessment module **never** computes readiness.  
`careerScoringBridge` listens for `AssessmentCompleted` / `AssessmentPassed` (+ existing credential events) → `ScoringService.compute` → `ScoreSnapshot` → dashboard.

---

## Dashboard integration

New widgets (composition-only):

- `recent-assessments`
- `verified-skills`

Gated by `assessments` (+ documents for verified skills). V2 layout aside includes both.

---

## Verification

```bash
npm run verify:assessments
```

Nested: `verify:career-dashboard-v2`, `verify:readiness`, `verify:career-platform`, client build.

---

## QA Checklist

### Assessment Platform

- [x] Canonical Assessment domain
- [x] Question Bank
- [x] Question model
- [x] Assessment Attempt
- [x] Assessment Result
- [x] Assessment Categories (configurable families + defaults)

### Verified Credentials

- [x] Credential integration
- [x] Automatic credential issuance
- [x] Verification status
- [x] Expiry support

### Platform Integration

- [x] CareerEventBus
- [x] Timeline
- [x] Readiness Engine
- [x] Analytics
- [x] Search (no duplicate engine; indexing can follow for public credentials)
- [x] TalentProfile (attempt requires profile)
- [x] Localization
- [x] Permissions
- [x] Feature Flags

### Verification

- [x] `verify:assessments` PASS
- [x] `verify:career-dashboard-v2` PASS
- [x] `verify:readiness` PASS
- [x] `verify:career-platform` PASS
- [x] Client build PASS

---

## Known limitations

1. Staff authoring APIs exist but no dedicated Assessment Admin UI (reuses auth; Content MCQ / workflow polish later).  
2. Exam Prep Quiz remains separate product surface — bridge via `legacyQuizId` only.  
3. No shuffle / section timing / void attempt UI yet (rules schema ready).  
4. Search indexing for assessment catalog deferred — Search stack unchanged.  
5. Employer verified-skills payload ready (`/assessments/employer-skills`) — **no employer UI** (C.8.5).  
6. Out of scope preserved: AI questions, proctoring, LMS, payments, coding IDE.

---

## Future roadmap

| Sprint | Focus |
|--------|--------|
| **C.8.5** | Employer Intelligence Dashboard — consume employer-visible skills |
| Later | Assessment admin UX, section timing, public credential search, basic proctoring hooks |

---

## Feature flags

| Flag | Default |
|------|---------|
| `ASSESSMENTS_ENABLED` / `VITE_ASSESSMENTS_ENABLED` | on unless `0` |
| `ASSESSMENT_RESULTS_ENABLED` | on unless `0` |
| `VERIFIED_CREDENTIALS_ENABLED` | on unless `0` (also requires documents platform) |

---

## Key files

| Area | Path |
|------|------|
| Constants | `shared/career/assessmentConstants.js` |
| Service | `server/src/services/career/AssessmentService.js` |
| Models | `server/src/models/career/Assessment*.js`, `Question*.js` |
| Routes | `server/src/routes/assessments.js` |
| Client | `client/src/pages/Assessments/*` |
| Verify | `scripts/verify-assessments.mjs` |

---

## Recommended next sprint

**C.8.5 — Employer Intelligence Dashboard** — reuse verified skills and assessment scores without rebuilding assessment foundations.
