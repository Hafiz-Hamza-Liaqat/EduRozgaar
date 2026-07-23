# Sprint C.8.0.0 — Career Intelligence Platform Architecture Audit

**Document type:** Architecture audit (documentation only)  
**Date:** July 2026  
**Prerequisite:** Platform complete through C.7.0.9 (production-ready)  
**Next phase:** Business value — Career Intelligence, not infrastructure  
**Constraint:** No code, schema, API, route, or migration changes proposed as implementation

---

## Purpose

This audit evaluates whether the existing EduRozgaar platform can evolve from a **Pakistan-focused education and jobs portal** into a **Global Career Intelligence Platform** centered on a canonical **Talent Profile**, while reserving **GigRadar** as a future sibling product on shared platform services.

The audit inspects the live codebase and answers fourteen architectural questions before any C.8 implementation begins.

---

## SECTION 1 — Current Architecture Review

### 1.1 Platform inventory

| Layer | Key assets | Location |
|-------|-----------|----------|
| **Authentication** | JWT access + Redis-backed refresh tokens | `tokenStore.js`, `authController.js` |
| **Users & roles** | `User` (Student + Staff), separate `Employer` auth | `User.js`, `Employer.js`, `rbac.js` |
| **Workflow** | Editorial states, locale-aware | `WorkflowService.js`, `shared/workflow/*` |
| **Analytics** | Canonical events, aggregation cache | `AnalyticsEventService.js`, `shared/analytics/*` |
| **Notifications** | Province/interest targeting, email queue | `Notification.js`, `notificationService.js`, `jobQueueService.js` |
| **Search** | Unified index, locale-aware | `SearchIndexService.js`, `shared/search/*` |
| **Media** | Asset library, S3/Supabase/local | `MediaAsset.js`, `storage/*` |
| **Forms** | Dynamic definitions, submissions | `FormDefinition.js`, `shared/formSchema.js` |
| **Page Builder** | Blocks, revisions, global blocks | `CmsPageLayout.js`, `shared/pageBuilder*` |
| **Dynamic blocks** | Runtime content resolution | `DynamicContentService.js`, `shared/dynamicBlocks/*` |
| **CMS** | Static pages, homepage, navigation | `CmsStaticPage.js`, `cmsController.js` |
| **Queues** | Mongo `BackgroundJob`, worker process | `jobQueueService.js`, `worker.js` |
| **Localization** | en/ur content, translation groups | `shared/localization/*`, `TranslationService.js` |
| **Integration hub** | Single mutation pipeline | `contentIntegration.js` |
| **Cache** | Redis + L1 via `config/cache.js` | Search, analytics, dynamic caches |
| **Production** | Docker, health, metrics, graceful shutdown | `docker-compose.yml`, `config/shutdown.js` |

### 1.2 Reuse matrix

| Component | Reuse | Extend | Leave untouched | Never duplicate |
|-----------|-------|--------|-----------------|-----------------|
| Authentication | ✓ JWT pattern | Unified talent + employer identity bridge | Password hashing, refresh flow | New auth systems per product |
| RBAC | ✓ Staff permissions | Employer team roles, recruiter seats | Core permission enum pattern | Per-feature ad-hoc guards |
| Workflow | ✓ | Assessment publishing, credential verification | Editorial content workflow | Separate approval engines |
| Analytics | ✓ Event registry | Application, assessment, readiness events | `scheduleAnalyticsEvent` hub | Per-module event writers |
| Notifications | ✓ Queue + templates | Interview reminders, stage changes | Email transport abstraction | SMS/WhatsApp one-offs |
| Search | ✓ Index service | Talent, application, credential entities | Scoring/ranking in `shared/search` | Per-page Mongo text search |
| Media | ✓ | Portfolio docs, certificates | Storage provider factory | Upload path duplication |
| Forms | ✓ | Assessment surveys, application forms | Validation in `shared/formSchema` | Custom form builders |
| Page Builder | ✓ | Career dashboard layout templates | Block schema, revision system | Dashboard as hardcoded JSX only |
| Dynamic blocks | ✓ | Dashboard widgets (jobs, learning) | Registry + resolver pattern | Widget-specific DB queries in UI |
| CMS | ✓ | Career roadmaps, learning paths as content | Static page + SEO pipeline | Marketing pages in React only |
| Queues | ✓ | Score recomputation, GitHub sync (future) | `enqueueJob` + worker | Cron one-offs outside queue |
| Localization | ✓ | Market packs (MENA, EU) | `shared/localization` as sole locale source | Duplicate locale arrays |
| `contentIntegration` | ✓ | Register career entity invalidation | Hub pattern for mutations | Scatter invalidation in controllers |

### 1.3 Architectural strengths for C.8

1. **Canonical service discipline** — C.7 established single pipelines for search indexing, analytics, cache, and content mutation. Career modules must plug into these, not bypass them.
2. **Additive schema culture** — Translation fields, locale indexes, and mixed metadata patterns support incremental Talent Profile growth.
3. **Employer portal exists** — Job posting, applications inbox, basic analytics are a foundation for Employer Intelligence.
4. **Resume domain is rich** — `Resume.js` already holds structured career data separate from `User.js`.
5. **Assessment seed** — `Quiz`, `Mcq`, `QuizAttempt`, `Exam` provide MCQ infrastructure.
6. **Production ops ready** — Redis, workers, Docker allow background score computation and reminders without new infra sprints.

### 1.4 Architectural gaps for C.8

1. **No Talent Profile** — Career data split across `User` (minimal), `Resume` (document-centric), and disconnected arrays (`savedJobs`, etc.).
2. **Dual identity systems** — `User` vs `Employer` with no shared platform identity layer.
3. **Application model is thin** — Seven statuses, one note, no history, no documents, no reminders.
4. **Pakistan coupling** — Hardcoded geo defaults in search mappers, scrapers, profile options, currency.
5. **Scoring is fragmented** — Resume completeness, badge points, quiz scores — no unified scoring engine.
6. **Dashboard is education-centric** — Aggregates saved listings and trending; not career intelligence.

---

## SECTION 2 — Talent Profile Audit

### 2.1 Current `User` model assessment

**File:** `server/src/models/User.js`

| Field category | Present | Missing for Talent Profile |
|----------------|---------|---------------------------|
| Auth | email, password, refresh tokens, emailVerified | OAuth IDs (commented future) |
| Identity | name | headline, photo, bio, public slug |
| Geo | province (string) | country, city, work authorization, relocation willingness |
| Preferences | interests[], preferredLanguage | career goals, target roles, salary range, remote preference |
| Engagement | saved* arrays, recentlyViewed*, totalPoints | Unified bookmarks, profile strength |
| Notifications | channel toggles | Granular career notification prefs |

**Verdict:** `User` must remain **authentication and account lifecycle only**. It is not suitable as the career intelligence root.

### 2.2 Existing career data elsewhere

| Data | Location | Issue |
|------|----------|-------|
| Structured education, experience, skills | `Resume.js` (per-document) | Tied to resume artifact, not canonical profile |
| Portfolio links | `Resume.personalInfo` (LinkedIn, GitHub, portfolio) | Duplicated if multiple resumes |
| Certifications, awards | `Resume` sections | Not linked to verified credentials |
| Application history | `Application.js` | Not surfaced on profile |
| Learning | `QuizAttempt`, `WebinarRegistration` | No progress model |
| Badges | `UserBadge` + `BadgeDefinition` | Gamification, not credentials |
| Assessments | Exam/quiz vertical | Pakistan exam prep, not career skills |

### 2.3 Recommended canonical architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM IDENTITY                         │
├─────────────────────────────────────────────────────────────┤
│  User (auth)          │  Employer (auth)                   │
│  - credentials        │  - company credentials             │
│  - role (staff)       │  - verificationLevel               │
│  - accountStatus      │  - billingCustomerId (future)      │
└──────────┬────────────┴──────────────┬────────────────────┘
           │ 1:1                         │ 1:1
           ▼                             ▼
┌──────────────────────┐       ┌──────────────────────┐
│   TalentProfile      │       │   EmployerProfile    │
│   (career root)      │       │   (hiring root)      │
└──────────────────────┘       └──────────────────────┘
```

**TalentProfile** (new canonical object — conceptual only):

| Domain section | Fields (conceptual) |
|----------------|---------------------|
| **Identity** | displayName, headline, avatarMediaId, publicSlug, visibility |
| **Location** | countryCode, regionCode, city, willingToRelocate, workAuthorization[] |
| **Preferences** | targetRoles[], industries[], workModes (remote/hybrid/onsite), salaryMin/Max, currency, markets[] |
| **Education** |[] — degree, institution, field, dates, GPA (normalized) |
| **Experience** |[] — company, title, dates, description, skillsUsed[] |
| **Skills** |[] — skillId, level, source (self/reported/verified), lastUsed |
| **Languages** |[] — code, proficiency |
| **Certifications** |[] — name, issuer, date, credentialId (link to verified) |
| **Licenses** |[] — type, jurisdiction, expiry |
| **Career goals** |[] — goalType, targetDate, status |
| **Portfolio links** |[] — type (linkedin/github/behance), url, verified |
| **Documents** |[] — mediaAssetId, type (cv, cover letter, portfolio), label |
| **Resume versions** |[] — resumeId refs, isPrimary, marketTag |
| **Profile completeness** | computed snapshot ref |
| **Readiness snapshot** | latest score ref |

**Relationship rules:**

- `User` → `TalentProfile` is **1:1** for job seekers
- `Resume` documents become **views/exports** of TalentProfile, not the source of truth
- GigRadar `DeveloperProfile` becomes an **extension** of TalentProfile (product entitlement), not a separate user

### 2.4 Separation of concerns

| Layer | Responsibility | Must NOT contain |
|-------|----------------|------------------|
| **Authentication** | Login, tokens, password, verification | Skills, applications, scores |
| **Identity** | Who the person is (name, contact, avatar) | Employer company data |
| **Career data** | TalentProfile + children | Auth secrets |
| **Employer data** | Company, hiring prefs, billing | Student career timeline |

### 2.5 Migration strategy (conceptual)

1. **Phase 1:** Create TalentProfile; hydrate from primary Resume + User fields
2. **Phase 2:** Resume builder reads/writes TalentProfile; Resume becomes generated PDF/view
3. **Phase 3:** Applications, assessments, badges link to `talentProfileId` not only `userId`
4. **Never:** Stuff career fields back into `User`

---

## SECTION 3 — Application Tracker Audit

### 3.1 Current `Application` model

**File:** `server/src/models/Application.js`

```
Statuses: submitted | applied | viewed | shortlisted | rejected | interview | hired
Fields: userId, jobId, resumeURL, coverLetter, status, appliedDate, note
Constraints: unique (userId, jobId)
```

**Parallel:** `InternshipApplication` — smaller status set, separate collection.

### 3.2 Sufficiency verdict

**Insufficient** for Career Intelligence vision. Adequate as a **job apply webhook**, not as a **tracker**.

| Capability | Current | Required |
|------------|---------|----------|
| Multi-stage pipeline | Partial (7 flat statuses) | 12+ stages with history |
| Status history | ✗ | Audit trail per transition |
| Notes | Single `note` | Threaded notes (user + system) |
| Attachments | resumeURL string only | Document collection |
| Deadlines | ✗ | Per-stage due dates |
| Reminders | ✗ | Queue-backed notifications |
| External applications | ✗ | User-logged off-platform applies |
| Interview scheduling | ✗ | Date, location, type, outcome |
| Employer contacts | ✗ | Recruiter name, email |
| Statistics | ✗ | Funnel metrics per user |
| Assessments linked | ✗ | Employer-requested tests |

### 3.3 Recommended tracker architecture

**Conceptual model: `OpportunityApplication` (generalized tracker)**

```
OpportunityApplication
├── talentProfileId
├── opportunityType: job | internship | scholarship | admission | graduate_program | fellowship
├── opportunityId (polymorphic ref)
├── source: platform | external | recruiter
├── pipelineStage (current)
├── stageHistory[] → { stage, at, by, note }
├── documents[] → DocumentAttachment
├── notes[] → Comment (shared service)
├── reminders[] → Reminder
├── employerContacts[]
├── assessmentRequests[] → AssessmentAttempt ref
├── offerDetails (conditional)
├── rejectionDetails (conditional)
├── withdrawnAt
└── analytics metadata
```

**Pipeline stages (recommended canonical enum):**

`interested → preparing → applied → acknowledged → assessment → interview_1 → interview_2 → final_review → offer → rejected → withdrawn → accepted → joined`

Employers see subset; users see full timeline.

### 3.4 Reusability across opportunity types

| Type | Reuse tracker? | Notes |
|------|----------------|-------|
| Jobs | ✓ Primary | Extend existing `Application` conceptually |
| Internships | ✓ | Merge `InternshipApplication` into unified model |
| Scholarships | ✓ | Different stages (submitted → interview → awarded) |
| Graduate programs | ✓ | Similar to admissions |
| Admissions | ✓ | Already listing domain; tracker adds user journey |
| Global opportunities | ✓ | Requires geo on opportunity + profile market prefs |

**Design principle:** One tracker engine, **stage templates per opportunityType** (config-driven, not separate codebases).

### 3.5 Platform services consumed

- **Timeline/Activity** — every stage transition emits activity event
- **Notifications** — reminders via `jobQueueService`
- **Media** — attachment storage
- **Analytics** — `application_stage_change`, funnel metrics
- **Forms** — post-apply surveys

---

## SECTION 4 — Career Dashboard Audit

### 4.1 Current state

**API:** `dashboardController.js` — returns saved listings, recently viewed, trending, province-targeted notifications.

**UI:** `Dashboard.jsx` — education portal hub (resume, exam prep, scholarships, chatbot).

**Gap:** No applications summary, readiness, deadlines, or career health.

### 4.2 Future dashboard architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Career Dashboard Composition API                │
│  GET /api/career/dashboard?widgets=...&market=PK           │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Widget      │    │ Dynamic     │    │ CMS         │
│ Providers   │    │ Blocks      │    │ Slots       │
│ (computed)  │    │ (content)   │    │ (marketing) │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4.3 Widget catalog

| Widget | Source type | Data source |
|--------|-------------|-------------|
| Application progress | **Computed** | OpportunityApplication aggregates |
| Career health / readiness | **Computed** | ScoringEngine snapshot |
| Resume strength | **Computed** | Resume analyzer + profile completeness |
| Upcoming interviews | **Computed** | Application reminders |
| Deadlines | **Computed** | Applications + saved jobs with deadlines |
| Saved jobs | **Query** | Bookmark service |
| Recommended jobs | **Computed** | Recommendation engine (profile + behavior) |
| Recommended learning | **Computed** | Learning progress + goals |
| Recent searches | **Query** | SearchQueryLog |
| Employer messages | **Query** | Notifications (employer-originated) |
| Notifications | **Query** | UserNotification |
| Achievements | **Query** | Badges + credentials |
| Career timeline | **Computed** | PlatformActivity feed |
| Trending jobs | **Dynamic block** | Existing `latest-jobs` block |
| Career articles | **Dynamic block** | `career-guidance` source |
| Promo banners | **CMS** | Homepage/banner system |

### 4.4 Dynamic blocks vs widgets vs computed

| Pattern | When to use | Example |
|---------|-------------|---------|
| **Dynamic block** | Content listing from Mongo; same for anonymous + logged-in | Latest jobs, scholarships |
| **Widget** | User-specific; requires auth; KPI or list | Application progress, readiness |
| **Computed** | Derived metric; cacheable per user | Readiness score, profile strength % |
| **CMS slot** | Editorial/marketing | Feature announcements |

**Recommendation:** Career Dashboard v1 should be **widget-composition API** with optional Page Builder layout wrapper later (C.8.2+). Do not build dashboard as only static React — reuse dynamic blocks for content halves.

### 4.5 Caching strategy

- Widget responses: Redis via `platformCacheGet('career-dashboard', userId:hash)` — TTL 60–120s
- Invalidate on: application stage change, profile update, assessment complete
- Use existing `contentIntegration` invalidation pattern extended for career entities

---

## SECTION 5 — Career Readiness Engine

### 5.1 Current scoring fragments

| Fragment | Location | Scope |
|----------|----------|-------|
| Resume completeness | `resumesController.computeResumeScore`, `ResumeScore.jsx` | Document fields filled % |
| Badge points | `User.totalPoints`, `BadgeDefinition` | Gamification |
| Quiz score | `QuizAttempt.score` | Exam prep |
| Recommendations | `recommendationsController.js` | Rule-based province/interests |
| Search ranking | `shared/search/scoring.js` | Content relevance |

**No unified readiness score exists.**

### 5.2 Recommended scoring architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ScoringEngine (platform)                  │
│  computeScore(profileId, scoreType, version) → ScoreSnapshot │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ ScoreProvider │  │ ScoreProvider │  │ ScoreProvider │
│ resume        │  │ assessments   │  │ applications  │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                  ┌───────────────┐
                  │ ScoreProvider │
                  │ learning      │
                  │ portfolio     │
                  │ experience    │
                  └───────────────┘
```

### 5.3 Score providers (pluggable)

| Provider | Input signals | Weight (initial) |
|----------|---------------|------------------|
| `profile_completeness` | TalentProfile fields | 15% |
| `resume_quality` | Analyzer + ATS heuristics | 20% |
| `verified_skills` | Assessment credentials | 25% |
| `experience_depth` | Years, relevance | 10% |
| `education_fit` | Degree level, field | 5% |
| `application_activity` | Tracker engagement | 10% |
| `learning_progress` | Courses, webinars | 5% |
| `portfolio_presence` | Links, projects | 5% |
| `interview_outcomes` | Stage progression | 5% |

Weights stored in **versioned config** (`readiness_weights_v1.json` in shared config), not hardcoded — enables tuning without schema changes.

### 5.4 ScoreSnapshot model (conceptual)

```
ScoreSnapshot
├── talentProfileId
├── scoreType: career_readiness | resume_strength | market_fit
├── version: "1.0.0"
├── overall: 0–100
├── factors[]: { providerId, score, weight, explanation, evidence[] }
├── computedAt
└── expiresAt (cache TTL)
```

### 5.5 Versioning and AI integration

| Concern | Approach |
|---------|----------|
| **Versioning** | `scoreType` + `version`; never overwrite history — append snapshots |
| **Explainability** | Each factor returns human-readable `explanation` + `evidence` links |
| **AI later** | AI produces **narrative insights** and **suggested actions**, not the numeric score directly |
| **Anti-debt rule** | LLM calls are `InsightProvider`, not embedded in `ScoringEngine` core |

**Technical debt avoidance:** ScoringEngine returns deterministic scores from providers. AI summarizes results in a separate `CareerInsightService` (C.8.4+).

---

## SECTION 6 — Assessment Platform

### 6.1 Current reusable infrastructure

| Component | Exists | Reuse for assessments |
|-----------|--------|----------------------|
| **Forms** | `FormDefinition`, validation | Pre-assessment surveys, feedback forms |
| **Workflow** | Editorial publish flow | Assessment catalog publishing |
| **Analytics** | Event registry | `assessment_start`, `assessment_complete` |
| **Media** | Asset library | Question images, certificate PDFs |
| **Notifications** | Email queue | Results, reminders |
| **Scoring** | Quiz attempt score | Per-question scoring → extend |
| **Question engine** | `Mcq.js`, `Quiz.js`, `QuizAttempt.js` | **Core reuse** — needs taxonomy layer |
| **Badge engine** | `BadgeDefinition`, `UserBadge` | Extend to **Credential** for verified skills |
| **Result engine** | QuizAttempt stores score | Needs pass/fail thresholds, percentile |

### 6.2 Current limitation

`Quiz` is bound to `Exam` (Pakistan competitive exam prep). Architecture:

```
Exam → Quiz → Mcq → QuizAttempt
```

Career assessments need:

```
AssessmentCatalog → AssessmentDefinition → QuestionBank → AssessmentAttempt → Credential
```

**Recommendation:** Wrap existing MCQ engine; do not fork a second question system.

### 6.3 Assessment taxonomy (conceptual)

| Category | Examples | Employer visibility |
|----------|----------|---------------------|
| **Language** | English, Urdu, Arabic communication | High |
| **Cognitive** | Logical reasoning, problem solving | Medium |
| **Productivity** | Excel, Word, PowerPoint | High |
| **Domain** | Accounting, HR, Sales, Teaching | High |
| **Technical** | Programming, Cloud, AI, Cybersecurity | High (GigRadar overlap) |
| **Soft skills** | Situational judgment (future) | Medium |

**IQ tests:** Deprioritize — ethical/hiring bias concerns; if included, never sole filter.

### 6.4 Verified credentials flow

```
AssessmentAttempt (passed) → Credential issued → TalentProfile.skills updated (verified)
                                              → Employer can filter applicants
                                              → Badge wallet (public share link)
```

**Workflow:** Credential verification for manual certificates (photo upload → admin review).

### 6.5 Components to build (conceptual)

| New (conceptual) | Reuses |
|------------------|--------|
| `AssessmentCatalog` | CMS categories |
| `AssessmentDefinition` | Quiz schema pattern |
| `QuestionBank` | Mcq |
| `AssessmentAttempt` | QuizAttempt |
| `Credential` | BadgeDefinition + new verification fields |
| `AssessmentResultService` | ScoringEngine provider |

---

## SECTION 7 — Employer Intelligence

### 7.1 Current employer capabilities

| Feature | File | Maturity |
|---------|------|----------|
| Dashboard KPIs | `EmployerDashboard.jsx`, `getDashboard` | Basic |
| Job posting | `EmployerPostJob.jsx` | Solid |
| Applications inbox | `EmployerApplications.jsx` | List + status update |
| Per-job analytics | `EmployerAnalytics.jsx` | Views, conversion % |
| Payments | `JobPlan`, Stripe | Job posting monetization |
| Moderation | Admin approval queue | Works |

### 7.2 Employer Intelligence gaps

| Capability | Platform support today | Gap |
|------------|------------------------|-----|
| Candidate ranking | ✗ | Needs readiness + credentials on applicant card |
| Skill filtering | Job.skillsRequired only | No applicant skill index |
| Hiring pipeline (kanban) | Flat list | No stage columns |
| Assessment comparison | ✗ | Needs assessment platform |
| Readiness comparison | ✗ | Needs ScoringEngine |
| Resume comparison | ✗ | Side-by-side view |
| Communication | Email via automation | No in-app thread |
| Notes | ✗ | Needs Comment service |
| Bookmarks | ✗ | Employer talent pool |
| Hiring analytics | Basic views | No funnel, time-to-hire |

### 7.3 Architecture recommendation

```
Employer Intelligence Layer
├── PipelineView (kanban over OpportunityApplication)
├── CandidateCard (readiness + credentials + resume preview)
├── CandidateCompare (2–4 applicants)
├── TalentPool (employer bookmarks of TalentProfiles)
├── HiringAnalytics (extends AnalyticsAggregator)
└── AssessmentRequest (send assessment to applicant)
```

**Reuse:** Existing employer auth, job model, application status updates, analytics events, notification queue.

**Extend:** Application tracker must be built first — employer intelligence is a **view layer** on tracker + scoring + assessments.

---

## SECTION 8 — Global Expansion Audit

### 8.1 Pakistan-specific assumptions (codebase evidence)

| Assumption | Evidence | Impact |
|------------|----------|--------|
| Country = Pakistan | `documentMappers.js` sets `country: 'Pakistan'` for jobs | Search facets wrong internationally |
| Province-first geo | `User.province`, `Job.province`, `PROVINCES` in listings | No country hierarchy |
| PKR currency | `Job.salaryCurrency` default `'PKR'` | Salary filters wrong abroad |
| Government/Private job types | `Job.jobType` enum | Not universal taxonomy |
| PPSC/FPSC/NTS scrapers | `scrapers/index.js` | Pakistan-only job ingestion |
| Province SEO landings | `/jobs/province/:slug` routes | Marketing is PK-centric |
| Exam prep | `Exam` model (PPSC/NTS style) | Content vertical, not blocker |
| University default country | `University` defaults Pakistan | Admin forms pre-filled |
| Notification targeting | `target_province` on `Notification` | Needs `target_market` |
| Locale BCP47 | `en-PK`, `ur-PK` in locale config | Fine; add markets not replace |

### 8.2 Recommended canonical geo architecture

**Shared config:** `shared/geo/markets.js` (conceptual — documentation only)

```
Market
├── code: PK | AE | SA | GB | US | REMOTE
├── label
├── defaultLocale
├── currency
└── regions[] → Region

Region
├── code (ISO 3166-2 or custom)
├── label
├── countryCode
└── cities[] (optional catalog)

WorkMode
├── remote | hybrid | onsite

Location (on Job, TalentProfile, Opportunity)
├── countryCode (ISO 3166-1 alpha-2)
├── regionCode
├── city
├── workMode
└── timezone (optional)
```

### 8.3 Migration principles (conceptual)

1. Add `countryCode` alongside `province` — never remove province in v1 (backward compatible)
2. Search documents: stop hardcoding country; use job's country or market default
3. Profile: replace single `province` with `primaryMarket` + `locations[]`
4. Scrapers: Pakistan scrapers remain; add `ingestionSource` registry for international feeds
5. Admin: market switcher on content forms

### 8.4 Global expansion is blocked without

- TalentProfile with market preferences
- Geo on Job model (partially exists: `remote`, `hybrid` — needs country)
- Search mapper fix (`documentMappers.js`)
- Application tracker (users engage globally only if they can track outcomes)

---

## SECTION 9 — GigRadar Positioning

### 9.1 Product boundary

**GigRadar** = Developer Career & Hiring Intelligence (future C.9.x)  
**EduRozgaar** = General Career Intelligence + Education adjacency

### 9.2 Shared platform (must not duplicate)

| Service | Shared? | Notes |
|---------|---------|-------|
| Authentication | ✓ | Same `User`, product entitlement flag |
| Billing | ✓ | Stripe customer; separate SKUs |
| Search | ✓ | Add `developer` entity type to same index |
| Analytics | ✓ | Same event pipeline |
| Workflow | ✓ | Credential verification |
| Assessments | ✓ | Shared engine; separate technical catalogs |
| Media | ✓ | Portfolio artifacts |
| Notifications | ✓ | Same queue |
| Scoring | ✓ | `developer_readiness` score type |
| Cache/Queue | ✓ | GitHub sync as job type |

### 9.3 GigRadar-only (never in EduRozgaar core UI)

| Capability | Rationale |
|------------|-----------|
| GitHub/GitLab/Bitbucket OAuth & sync | Developer-specific |
| Repository index & commit graphs | High complexity, dev audience |
| Code analysis / AI code review | LLM cost, dev context |
| Developer graph (followers, OSS network) | Not general career |
| Engineering hiring pipeline | Different employer UX |
| Developer search (employer) | Wellfound competitor |
| Technical portfolio renderer | Code projects, not CV |
| LeetCode-style coding sandbox | Defer to C.9.4+ |

### 9.4 Data model relationship

```
TalentProfile (base)
    └── DeveloperProfileExtension (GigRadar entitlement)
            ├── githubUsername, gitlabUsername
            ├── repositorySnapshots[]
            ├── contributionMetrics
            └── technicalCredentials[]
```

EduRozgaar users without GigRadar entitlement never see or store GitHub data.

---

## SECTION 10 — Shared Platform Services

### 10.1 Duplicate risk map

| Concept | Current state | Canonical service (recommended) |
|---------|---------------|--------------------------------|
| **Timeline** | None | `PlatformActivityService` |
| **Documents** | resumeURL strings | `DocumentAttachment` + MediaAsset |
| **Credentials** | Badges only | `CredentialService` (verified assessments + certs) |
| **Bookmarks** | User.saved* arrays | `BookmarkService` (polymorphic) |
| **Activity feed** | None | Same as Timeline |
| **Notifications** | Exists | Extend templates; don't rebuild |
| **Progress** | None | `ProgressService` (% complete, milestones) |
| **Scoring** | Fragmented | `ScoringEngine` |
| **Achievements** | Badges | Unify Badge + Credential display |
| **Comments** | EditorialComment only | `CommentService` (scoped: application, candidate, content) |
| **Attachments** | Multer uploads scattered | `DocumentAttachment` |

### 10.2 Service dependency order

```
1. PlatformActivityService + CommentService  (tracker needs these)
2. BookmarkService                           (dashboard + employer pool)
3. DocumentAttachment                        (tracker + profile)
4. ScoringEngine                             (readiness)
5. CredentialService                         (assessments)
6. ProgressService                           (learning)
```

### 10.3 Never duplicate rule

Any feature that needs "notes on X" uses **CommentService**.  
Any feature that needs "score for X" uses **ScoringEngine**.  
Any feature that needs "saved X" uses **BookmarkService**.

---

## SECTION 11 — Monetization Audit

### 11.1 Current revenue

| Stream | Implementation | Maturity |
|--------|----------------|----------|
| Job posting plans | `JobPlan`, Stripe, `Payment` | Live |
| Featured jobs | `isFeatured`, `boostLevel` on Job | Live |
| Advertisements | Ad platform C.6 | Live |

**User note:** Do not recommend advertising-first monetization for career intelligence phase.

### 11.2 Recommended monetization priority

| Priority | Revenue stream | Buyer | ROI rationale |
|----------|----------------|-------|---------------|
| **P0** | Employer subscriptions (pipeline + intelligence) | Employers | Builds on existing employer portal; B2B ARPU |
| **P0** | Verified assessments (employer-visible credentials) | Talents + employers | Differentiator; recurring assessment packs |
| **P1** | Recruiter seats (multi-user employer) | Agencies | Expansion revenue |
| **P1** | Featured company profiles | Employers | Low engineering; marketing |
| **P1** | Premium talent profile (visibility boost) | Job seekers | LinkedIn Premium analog |
| **P2** | Recruitment analytics export | Employers | Enterprise tier |
| **P2** | API access (partner universities, job boards) | B2B | Platform play |
| **P2** | Career coaching marketplace | Talents | Supply-side; needs quality control |
| **P3** | Resume human review (paid service) | Talents | Manual fulfillment |
| **P3** | Learning marketplace commission | Content partners | Long-term |
| **Defer** | Advertising-first | — | Conflicts with trust positioning |

### 11.3 Monetization architecture principle

Billing attaches to **Employer** and **User** platform identities, not per-feature silos. SKUs:

- `employer_starter`, `employer_intelligence`, `employer_enterprise`
- `talent_premium`, `assessment_pack_{category}`
- `gigradar_employer` (C.9+)

---

## SECTION 12 — Implementation Roadmap

### Phase dependency graph

```
C.8.0 Career Core ─────────────────────────────────────────┐
       │                                                    │
       ├──► C.8.1 Application Tracker                     │
       │         │                                          │
       │         ├──► C.8.2 Career Dashboard                │
       │         │                                          │
       │         └──► C.8.5 Employer Intelligence (partial) │
       │                                                    │
       ├──► C.8.3 Scoring Engine                            │
       │         │                                          │
       │         └──► C.8.4 Career Readiness                │
       │                                                    │
       └──► C.8.6 Assessment Platform                      │
                 │                                          │
                 └──► C.8.5 Employer Intelligence (full)   │
                                                            │
C.8.7 Learning Progress ◄───────────────────────────────────┘
       │
       └──► C.8.8 Recommendation Engine

C.9.x GigRadar (after C.8.0 + C.8.1 prove retention)

C.10.x Global Expansion (parallel to C.8.1+ once geo in C.8.0)
```

### Sprint breakdown

| Sprint | Name | Why this order |
|--------|------|----------------|
| **C.8.0** | Career Core (TalentProfile + geo + shared services foundation) | Everything references canonical profile; geo unblocks global |
| **C.8.0.1** | Shared services: Activity, Bookmark, DocumentAttachment | Tracker and dashboard depend on these |
| **C.8.1** | Application Tracker | Highest user ROI; produces data for readiness + employer |
| **C.8.2** | Career Dashboard v2 | Surfaces tracker + profile; daily engagement loop |
| **C.8.3** | Scoring Engine (platform) | Required before marketing "readiness" |
| **C.8.4** | Career Readiness Score | Composite score; uses C.8.3 |
| **C.8.5** | Employer Intelligence (pipeline + candidate cards) | Requires tracker + partial scoring |
| **C.8.6** | Assessment Platform + Credentials | High effort; employer value unlocked in C.8.5.2 |
| **C.8.7** | Learning Progress | Enriches readiness; not blocking tracker |
| **C.8.8** | Recommendation Engine | Needs behavioral data from tracker |
| **C.8.9** | Career AI (insights, not scores) | After deterministic scoring exists |
| **C.9.0** | GigRadar foundation | After EduRozgaar career loop proves retention |
| **C.10.0** | Global market packs | After geo abstraction in C.8.0 |

### Why Career Core must be first

Without TalentProfile:
- Readiness has no stable input surface
- Dashboard widgets lack identity context
- Employer ranking has no skill index
- GigRadar has nothing to extend
- Resume and User remain duplicated sources of truth

### Why Tracker before Dashboard

Dashboard without tracker data is still an education portal. Tracker creates **daily return visits** and **signal** for scoring/recommendations.

### Why Scoring before Assessments marketing

Publishing readiness scores before ScoringEngine exists creates technical debt and trust risk if scores are hardcoded.

### Why GigRadar waits until C.9

GigRadar without Career Core forces a second identity model. Building on TalentProfile extension is cheaper and enables cross-sell.

---

## SECTION 13 — Risk Analysis

### 13.1 Technical risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| TalentProfile migration complexity | High | Hydrate from Resume; dual-write period; no big-bang cutover |
| Application tracker scope creep | High | Stage templates per type; MVP = jobs + internships only |
| Assessment anti-cheat | High | Start MCQ timed; defer proctored coding |
| Scoring trust | Medium | Explainable factors; versioned weights; no black-box |
| Search index growth | Medium | New entity types additive; TTL on old snapshots |
| Pakistan refactor breaks SEO | Medium | Keep province routes; add country parallel |
| Employer/User auth split | Medium | Platform identity bridge in C.8.0 |

### 13.2 Product risks

| Risk | Mitigation |
|------|------------|
| Feature overload | Dashboard widget gating; progressive disclosure |
| Competing with LinkedIn | Don't build social graph; own apply-track-improve loop |
| Assessment credibility | Partner with known content; employer beta program |
| Employer adoption | Intelligence dashboard as paid tier incentive |

### 13.3 UX risks

| Risk | Mitigation |
|------|------------|
| Tracker maintenance burden | Defaults + email reminders; mobile-first |
| Readiness score anxiety | Frame as growth tool; show improvement path |
| Dashboard clutter | Widget priorities; user customization in v2 |

### 13.4 Performance risks

| Risk | Mitigation |
|------|------------|
| Dashboard N+1 queries | Composition API with parallel widget fetch |
| Score computation cost | Background queue; cache snapshots |
| Activity feed volume | Pagination; archive old events |

### 13.5 AI risks

| Risk | Mitigation |
|------|------------|
| Hallucinated career advice | AI as insight layer only; cite profile facts |
| Bias in recommendations | Auditable rules first; ML later |
| Cost at scale | Rate limit; premium tier |

### 13.6 Security risks

| Risk | Mitigation |
|------|------------|
| PII in activity feed | Strict access control per actor |
| Employer seeing hidden data | TalentProfile visibility flags |
| Credential fraud | Workflow verification for manual certs |

### 13.7 Scalability risks

| Risk | Mitigation |
|------|------------|
| Mongo document growth on timeline | Separate Activity collection with indexes |
| GitHub sync rate limits | Queue with backoff (GigRadar) |

---

## SECTION 14 — Executive Summary

### Is this the correct product direction?

**Yes.** The platform has completed infrastructure. The market opportunity is career intelligence for emerging markets and diaspora — not another job board. The Talent Profile center of gravity aligns with existing Resume, Application, and Employer assets.

### Is the platform architecture strong enough?

**Yes, with targeted extensions.** C.6–C.7 built enterprise-grade CMS, search, analytics, workflow, localization, and production ops. The gaps are **domain models** (TalentProfile, tracker, scoring), not infrastructure. The `contentIntegration` hub pattern must extend to career entities.

### Highest ROI features

1. **Job Application Tracker (C.8.1)** — solves real user pain; increases retention
2. **Career Dashboard v2 (C.8.2)** — surfaces value daily
3. **Employer Intelligence subscription (C.8.5)** — monetization on existing employer base

### What should be postponed?

| Defer | Reason |
|-------|--------|
| GigRadar (C.9) | Needs Career Core first |
| Career AI (C.8.9) | Needs data from tracker + scoring |
| Social network features | Wrong competitive set |
| Company reviews (Glassdoor) | Different product |
| Coding sandbox assessments | GigRadar scope |
| Full LMS | Partner instead |
| IQ-centric hiring filters | Ethical/reputational risk |

### Deploy before or after C.8.0?

**Deploy now (post C.7.0.9).** Production infrastructure is complete. C.8 is business value on a live platform. Waiting delays revenue, feedback, and employer data. C.8.0 Career Core is **additive** — it does not require holding deployment.

Recommended path:
1. Deploy production stack immediately
2. Run C.8.0 Career Core on production branch with feature flags
3. Beta tracker with existing user cohort before marketing "Career Intelligence"

### What to change before public beta?

| Item | Action |
|------|--------|
| Geo hardcoding | Fix search mapper country default (C.8.0) |
| Application UX | Ship tracker MVP before calling platform "Career Intelligence" |
| Resume analyzer | Label as beta; don't tie to readiness until v2 parser |
| Dashboard copy | Stop education-only framing when tracker ships |
| Employer pitch | Lead with pipeline intelligence, not job listings |
| Analytics | Add `application_*` events before growth marketing |
| Mobile | Ensure tracker works on mobile web (app update later) |

### Final architectural decision

| Decision | Choice |
|----------|--------|
| Canonical career object | **TalentProfile** (separate from User auth) |
| Tracker model | **OpportunityApplication** (generalized, stage templates) |
| Scoring | **ScoringEngine** with versioned providers |
| Assessments | Extend Quiz/MCQ; add Credential layer |
| GigRadar | Sibling product C.9; extends TalentProfile |
| Global geo | **countryCode + region + workMode** alongside legacy province |
| Dashboard | Widget composition API + dynamic blocks for content |
| Deploy timing | **Now**; C.8 ships incrementally behind flags |

---

## Appendix — Codebase reference index

| Domain | Primary files |
|--------|---------------|
| User (auth) | `server/src/models/User.js` |
| Resume (document) | `server/src/models/Resume.js` |
| Application | `server/src/models/Application.js` |
| InternshipApplication | `server/src/models/InternshipApplication.js` |
| Employer | `server/src/models/Employer.js` |
| Job | `server/src/models/Job.js` |
| Quiz/Assessment seed | `Quiz.js`, `Mcq.js`, `QuizAttempt.js`, `Exam.js` |
| Badges | `BadgeDefinition.js`, `UserBadge.js` |
| Dashboard API | `server/src/controllers/dashboardController.js` |
| Search registry | `shared/search/entityTypes.js` |
| Search mappers (PK hardcode) | `server/src/services/search/documentMappers.js` |
| Analytics registry | `shared/analytics/eventTypes.js` |
| Integration hub | `server/src/utils/contentIntegration.js` |
| Monetization | `JobPlan.js`, Stripe controllers |
| Profile options | `client/src/constants/profileOptions.js`, `listings.js` |

---

*Sprint C.8.0.0 — Documentation only. No implementation, code, schema, API, route, or migration changes were made.*
