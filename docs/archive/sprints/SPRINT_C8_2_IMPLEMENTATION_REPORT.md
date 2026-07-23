# Sprint C.8.2 — Career Readiness Engine (Foundation)

**Status:** Complete  
**Date:** 2026-07-14  
**Scope:** Deterministic, explainable scoring platform + dashboard readiness widget. No generative AI. No Score fields on TalentProfile/User. Roadmap note: product order places Readiness before Dashboard v2 (canonical contracts previously numbered this as C.8.3).

---

## Summary

Introduced a versioned **ScoringEngine** with a **ScoreProvider** registry, append-only **ScoreSnapshot** storage, **ScoreExplanation** / **ScoreHistory** APIs, and six foundation providers. The Career Dashboard surfaces overall readiness, factor breakdown (“What affects my score?”), improvement checklist, and a simple history trend — all from composition data (widgets do not call scoring APIs).

---

## Scoring Architecture

```
Profile / Resume / Docs / Credentials / Applications
                    │
                    ▼
            ScoreContext (read-only)
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 ScoreProviders (deterministic rules)
     │
     ▼
 ScoringEngine.compute(scoreType, version)
     │  weights from shared/scoring/weights/v1.json
     ▼
 ScoreSnapshot (append-only Mongo collection)
     │
     ├── ScoreExplanation (factors + improvements)
     ├── ScoreHistory (prior snapshots)
     └── CareerEventBus
           ├── ScoreSnapshotCreated / CareerScoreComputed
           ├── ReadinessUpdated
           └── CareerScoreUpdated (Δ ≥ 5) → timeline score.improved
```

Dashboard path:

```
GET /api/career/dashboard
  └── readinessScoreProvider → ScoringService.getDashboardPayload
        └── ReadinessScoreWidget (score / trend / factors / checklist)
```

---

## Provider Model

| Provider ID | Signals |
|-------------|---------|
| `profile_completeness` | TalentProfile fields (name, headline, summary, edu, exp, skills, languages, avatar) |
| `resume_quality` | Primary ResumeVersion snapshot depth + published/primary |
| `verified_skills` | Active Credentials (+ skill linkage) |
| `document_completeness` | Canonical Document types/counts |
| `application_engagement` | OpportunityApplication active count + stage depth |
| `skill_coverage` | Profile skills count, levels, verified source |

Providers return `{ score, explanation, evidence[], improvements[] }`. They **never** call LLMs.

---

## Weighting Strategy

- Config: `shared/scoring/weights/v1.json` (`version: "1.0.0"`).
- `career_readiness` weights sum to **1.0**.
- Changing weights → bump version → new snapshots; old snapshots retained for trend.
- Engine computes `overall = round(Σ score_i × weight_i / Σ weight_i)`.

---

## Versioning

| Concern | Behavior |
|---------|----------|
| Weight config | Explicit version string on each snapshot |
| Snapshots | Append-only — never updated in place |
| TTL | `validUntil` from config `ttlMinutes` (15) |
| Recompute | Debounced (`careerScoringBridge`, 5s) on profile/doc/cred/application events; `POST /scoring/recompute` for manual refresh |

---

## Dashboard Integration

Widget type: `readiness-score` (main zone), flags: `scoring` + `talentProfile`.

Shows:

1. Overall score card (0–100) + delta  
2. Score history sparklines (simple bar trend)  
3. Factor breakdown panel  
4. Improvement checklist  

---

## APIs

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/scoring/latest` | user + `SCORING_ENABLED` |
| GET | `/api/scoring/history` | user + flag |
| GET | `/api/scoring/explanation` | user + flag |
| POST | `/api/scoring/recompute` | user + flag |

Feature flags: `SCORING_ENABLED` / `VITE_SCORING_ENABLED` (default on unless `=0`).

---

## Verification

```bash
npm run verify:readiness
npm run verify:career-platform
npm run verify:application-tracker
```

`verify:readiness` covers provider registration, weighting, snapshot versioning, deterministic calculation, explanations, platform integrations, dashboard gating, localization, permissions, client build, and nested platform/tracker gates.

---

## QA Checklist

### Scoring Platform

- [x] ScoringEngine
- [x] ScoreProvider registry
- [x] ScoreSnapshot
- [x] ScoreExplanation
- [x] ScoreHistory

### Providers

- [x] Profile completeness
- [x] Resume quality
- [x] Credentials
- [x] Documents
- [x] Application activity
- [x] Skills

### Dashboard

- [x] Readiness score widget
- [x] Score trend
- [x] Improvement checklist
- [x] Explanation panel

### Platform Integration

- [x] TalentProfile
- [x] OpportunityApplication
- [x] Timeline (`score.improved` on Δ≥5)
- [x] Documents
- [x] Credentials
- [x] Localization (en/ur)
- [x] Permissions

### Verification

- [x] `verify:readiness` PASS
- [x] `verify:career-platform` PASS
- [x] `verify:application-tracker` PASS
- [x] Client build PASS

---

## Known Limitations

1. **No AI narrative** — explanations are rule templates, not generative insights.
2. **No Redis latest-score cache yet** — Mongo latest + dashboard composition TTL (2 min); Redis optional per contracts §9.7.
3. **Debounced recompute is in-process** — multi-instance deployments should move to job queue `score_recompute` (deferred).
4. **Resume quality is structural** — not a full ATS/PDF analyzer.
5. **learning_progress / employer_match / interview_readiness** types exist in enums but providers are not fully implemented until Assessments / Dashboard v2.
6. **Roadmap renumber:** product C.8.2 = Readiness; Dashboard v2 becomes C.8.3.

---

## Rollout Considerations

1. Keep `SCORING_ENABLED=1` and `VITE_SCORING_ENABLED=1`.
2. TalentProfile must exist for meaningful scores; missing profile returns a soft dashboard empty state.
3. Smoke: update profile → wait debounce → refresh dashboard readiness widget.
4. Rollback: set `SCORING_ENABLED=0` — routes 503, widget gated off; snapshots retained.

---

## Key Files

| Area | Path |
|------|------|
| Weights | `shared/scoring/weights/v1.json` |
| Engine | `shared/scoring/ScoringEngine.js` |
| Providers | `server/src/services/career/scoring/providers.js` |
| Service | `server/src/services/career/ScoringService.js` |
| Model | `server/src/models/career/ScoreSnapshot.js` |
| Bridge | `server/src/services/career/careerScoringBridge.js` |
| Routes | `server/src/routes/scoring.js` |
| Widget | `client/src/dashboard/widgets/ReadinessScoreWidget.jsx` |
| Verify | `scripts/verify-readiness.mjs` |

---

## Recommended Next Sprint

**C.8.3 — Career Dashboard v2** — compose readiness insights into a richer daily surface (layout polish, personalization, more widgets) now that scores are explainable.
