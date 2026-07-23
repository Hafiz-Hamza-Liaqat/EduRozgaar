# Sprint C.8.0.2B.1 — TalentProfile Editor (UI Integration)

**Status:** Complete  
**Scope:** UI only — Talent Profile editor consuming canonical `/api/talent/*` APIs

---

## Objective

Production-ready Talent Profile editor for international career identity. All career data reads/writes via `TalentProfile` APIs only — never `User` model fields.

---

## Files added

| File | Purpose |
|------|---------|
| `client/src/services/talentApi.js` | Canonical talent API client |
| `client/src/pages/TalentProfile/TalentProfileEditor.jsx` | Main editor shell + tabs + save |
| `client/src/pages/TalentProfile/TalentProfileForm.jsx` | Form sections (personal → portfolio) |
| `client/src/pages/TalentProfile/talentProfileMapper.js` | API ↔ form state mapping |
| `client/src/pages/TalentProfile/ResumeVersionsPanel.jsx` | Resume version CRUD/publish/preview |
| `client/src/pages/TalentProfile/DocumentsPanel.jsx` | Document upload/list/delete/download |
| `client/src/i18n/locales/en/talent.json` | English translations |
| `client/src/i18n/locales/ur/talent.json` | Urdu translations |
| `scripts/verify-career-domain.mjs` | Mandatory C.8 verification suite |

### Minimal backend alignment (schema + upload only)

| File | Purpose |
|------|---------|
| `server/src/models/career/PersonalInfo.js` | firstName, lastName, DOB, location, phone, timezone |
| `server/src/controllers/career/profileDocumentUploadController.js` | User document upload |
| Extended `TalentProfile`, `CareerPreference`, `shared/career/validation.js` | Editor field persistence |

---

## Files modified

| File | Change |
|------|--------|
| `client/src/routes/index.jsx` | Route `/talent-profile` |
| `client/src/constants/index.js` | `ROUTES.TALENT_PROFILE` |
| `client/src/i18n/config.js` | `talent` namespace |
| `client/src/components/layout/UserAccountMenu.jsx` | Nav link |
| `client/src/i18n/locales/en/navbar.json` | `talentProfile` key |
| `client/src/i18n/locales/ur/navbar.json` | `talentProfile` key |
| `server/src/routes/talent.js` | `POST /talent/me/documents/upload` |
| `package.json` | `verify:career-domain` script |

---

## Architecture decisions

1. **Single write path:** `talentApi.updateMe(formToProfilePayload(form))` — no `authApi` for career fields.
2. **Mapper layer:** `profileToForm` / `formToProfilePayload` isolates API shape from UI state; `displayName` derived from first + last name.
3. **Shared validation:** Client uses `@shared/career/validation.js` before save.
4. **Tabbed mobile-first layout:** Horizontal scroll tabs on mobile; sticky save on profile sections.
5. **Resume versions:** Created from current profile snapshot via existing backend APIs; preview shows JSON snapshot (PDF render deferred).
6. **Documents:** Upload → `POST /talent/me/documents/upload` → `ProfileDocument` with `metadata.fileUrl`.
7. **Email read-only:** Shown from `useAuth().user.email`; not stored on TalentProfile.

---

## Editor sections

| Tab | Fields |
|-----|--------|
| Personal | Name, photo URL, DOB, gender, country, region, city, nationality, visibility |
| Contact | Email (read-only), phone, website, LinkedIn, GitHub, portfolio, X/Twitter |
| Career | Title, summary, employment status, work mode, countries, timezone, salary |
| Education | Repeatable institution/degree/field/dates/grade/description |
| Experience | Repeatable company/title/dates/responsibilities/achievements |
| Skills | Technical + soft groups with proficiency |
| Languages | Repeatable with proficiency levels |
| Certifications | Repeatable with dates and URL |
| Portfolio | Repeatable projects with technologies |
| Resume versions | List, create, publish, preview, delete |
| Documents | Upload PDF/DOCX, download, delete |

---

## Manual QA checklist

- [ ] Log in → Account menu → **Talent Profile**
- [ ] Load profile (auto-create on first GET `/talent/me`)
- [ ] Edit personal + contact + career → Save → reload persists
- [ ] Add education, experience, skills, languages, certs, portfolio entries
- [ ] Toggle public visibility on public profile test account
- [ ] Create resume version from profile → publish → preview
- [ ] Upload PDF document → download link works → delete
- [ ] Switch language EN ↔ UR — all labels translate
- [ ] Mobile viewport: tabs scroll, touch targets ≥44px
- [ ] Confirm Account Profile (`/profile`) does NOT show career sections mixed in

---

## Verification results

```
npm run verify:career-domain   → 21 passed, 0 failed — PASS
npm run verify:talent-profile    → 53 passed, 0 failed — PASS
cd client && npm run build       → PASS
```

---

## Known limitations

1. **Profile photo:** URL field only (no image picker/upload in this sprint).
2. **Resume preview:** JSON snapshot view; PDF/HTML render remains in Resume Builder until unified export sprint.
3. **Legacy Resume Builder** (`/resume-builder`) still writes legacy `Resume` model — migration to TalentProfile-only editing is a follow-up (C.8.0.2B.2 or migration sprint).
4. **Account Profile** (`/profile`) still has legacy `province`/`interests` on User — not removed; talent editor does not use them.
5. **Salary period** select labels (hourly/monthly/yearly) not yet in i18n keys.

---

## Explicitly out of scope (honored)

- Job tracker, Career dashboard, Readiness engine, Assessments, Employer tools, AI, Recommendations, Timeline UI

---

## Next sprint

**C.8.0.3** — OpportunityApplication foundation (backend) or **C.8.0.2B.2** — wire Resume Builder to TalentProfile read/write behind feature flag.
