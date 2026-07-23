# Sprint C.8.0.2A — TalentProfile Backend Foundation

**Status:** Complete  
**Scope:** Backend only — no UI, no scoring, no tracker, no dashboard

---

## Objective

Establish the canonical career identity backend:

```
User
 └── TalentProfile
      ├── ResumeVersions
      ├── ProfileDocuments
      ├── Credentials (read model)
      └── Preferences / Social / Languages / Certifications / Portfolio (embedded)
```

---

## Deliverables

| Layer | Location |
|-------|----------|
| Shared constants | `shared/career/constants.js` |
| Shared validation | `shared/career/validation.js` |
| Models | `server/src/models/career/*` |
| Repositories | `server/src/repositories/career/*` |
| Services | `server/src/services/career/*` |
| Event bus | `server/src/services/career/CareerEventBus.js` |
| Controllers | `server/src/controllers/career/*` |
| Routes | `server/src/routes/talent.js` |
| Feature flags | `server/src/config/careerFeatureFlags.js` |
| Hydration script | `server/src/scripts/hydrateTalentProfiles.js` |
| Search hooks | `onCareerEntitySaved` in `contentIntegration.js` |
| Verification | `npm run verify:talent-profile` |

---

## API Endpoints (backend only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/talent/me` | Get or auto-create profile |
| POST | `/api/talent/me` | Create profile |
| PATCH | `/api/talent/me` | Update profile |
| DELETE | `/api/talent/me` | Archive profile |
| GET/POST | `/api/talent/me/resume-versions` | Resume version CRUD |
| PATCH/DELETE | `/api/talent/me/resume-versions/:id` | |
| POST | `/api/talent/me/resume-versions/:id/publish` | Publish version |
| GET/POST/PATCH/DELETE | `/api/talent/me/documents` | Profile documents |
| GET | `/api/talent/me/credentials` | List credentials (read-only) |
| POST | `/api/admin/talent/hydrate` | Staff bulk hydration |
| POST | `/api/admin/talent/hydrate/:userId` | Staff single-user hydration |

All talent routes require `requireAuth` + `requireUserAuth` + `TALENT_PROFILE_ENABLED`.

---

## Domain Events

Every mutation emits exactly one event via `CareerEventBus`:

- `TalentProfileCreated`
- `TalentProfileUpdated`
- `ResumeVersionCreated`
- `ResumePublished`

Handlers (timeline, scoring, recommendations) deferred to C.8.0.4+.

Analytics bridge maps events to `profile_created`, `profile_updated`, `resume_version_created`, `resume_published`.

---

## Feature Flags

| Env var | Default | Purpose |
|---------|---------|---------|
| `TALENT_PROFILE_ENABLED` | `1` | Gate `/api/talent/*` |
| `TALENT_PROFILE_DUAL_WRITE` | `0` | Sync legacy `Resume` on profile save |
| `TALENT_PROFILE_READ_CANONICAL` | `0` | Future: read from TalentProfile in UI |

---

## Migration

```bash
# Dry run
node server/src/scripts/hydrateTalentProfiles.js --dry-run

# Execute hydration
node server/src/scripts/hydrateTalentProfiles.js
```

Hydrates from `User` + latest `Resume` → `TalentProfile` + primary `ResumeVersion` + credential stubs.

---

## Verification

```
npm run verify:talent-profile
```

**Result:** 53 passed, 0 failed — PASS

---

## Explicitly out of scope

- Career Dashboard
- Readiness Score / ScoringEngine
- Application Tracker
- Assessments platform
- Employer Portal
- AI features
- Recommendation Engine
- Timeline UI
- Notifications UI
- Frontend profile editor (→ C.8.0.2B)

---

## Next sprint

**C.8.0.2B** — TalentProfile UI integration (profile editor, localization wiring, end-to-end validation)
