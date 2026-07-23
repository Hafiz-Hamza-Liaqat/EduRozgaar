# Sprint C.8.0.5 — Documents & Credentials Platform

**Status:** Complete  
**Date:** 2026-07-13  
**Scope:** Unified Document & Credential platform services. No Readiness Score, Assessment Engine, AI verification, OCR, employer approval workflows, badge marketplace, or blockchain.

---

## Summary

Introduced the canonical **Document** aggregate (`documents` collection) as the single attachment store for the career platform, with version groups, ownership, tags, expiry, visibility, and download permissions. **Credential** remains a separate aggregate for verified achievements (issuer, score, expiry, verification status). Uploads reuse **MediaAsset** via `createMediaAssetFromBuffer` — no new global upload routes. Talent-facing routes delegate to the canonical services; new `/api/documents` and `/api/credentials` APIs expose full read/write access.

---

## Architecture

```
Upload (existing /talent/me/documents/upload)
        │
        ▼
createMediaAssetFromBuffer() ──► MediaAsset
        │
        ▼
DocumentService.create / createFromUpload
        │
        ├──► documents (canonical)
        ├──► emitCareerEvent(DocumentCreated|Updated|VersionCreated|Archived)
        ├──► careerDocumentBridge → analytics + timeline (via CareerEventBus handlers)
        └──► TalentProfileReadService / ApplyKit / Application attach

CredentialPlatformService.issue / verify / revoke
        │
        ├──► credentials
        ├──► emitCareerEvent(CredentialIssued|Verified|Revoked)
        ├──► onCareerEntitySaved('credential') → search index (when verified)
        └──► timeline + analytics
```

### Model relationship

| Model | Collection | Role |
|-------|------------|------|
| **Document** | `documents` | Canonical file metadata + MediaAsset link |
| **ProfileDocument** | `profileDocuments` | Legacy; talent routes now write via DocumentService |
| **Credential** | `credentials` | Verified achievement separate from raw files |
| **MediaAsset** | `mediaassets` | Shared storage layer (dedupe by checksum) |

---

## Document Model

**File:** `server/src/models/career/Document.js`

| Field | Purpose |
|-------|---------|
| `parentType` / `parentId` | Polymorphic owner (`talent_profile`, `application`, `credential`) |
| `talentProfileId` / `userId` | Ownership queries |
| `documentType` | resume, cv, cover_letter, transcript, degree, passport, visa, portfolio, certificate, other |
| `mediaAssetId` | Link to MediaAsset |
| `versionGroupId` / `versionNumber` / `isCurrentVersion` | Version history |
| `tags[]` | User tags |
| `expiresAt` | Optional expiry |
| `visibility` | private, employer_scoped, public |
| `downloadPermission` | owner_only, employer_scoped, public |
| `status` | active, archived, deleted |

---

## Credential Model (extended)

**File:** `server/src/models/career/Credential.js`

| Field | Purpose |
|-------|---------|
| `title`, `issuer`, `description` | Display |
| `verificationStatus` | pending_verification, active, expired, revoked |
| `source` | manual, assessment, import, hydration |
| `issuedAt` / `expiresAt` | Lifecycle |
| `documentId` | Optional proof document link |
| `skillName` / `score` | e.g. JavaScript 92% |
| `mediaAssetId` | Optional badge/certificate image |

---

## APIs

### Documents (`/api/documents`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/documents` | List user's documents (filter: type, parent) |
| POST | `/api/documents` | Create with `mediaAssetId` |
| GET | `/api/documents/:id` | Get one |
| PATCH | `/api/documents/:id` | Update metadata |
| DELETE | `/api/documents/:id` | Soft delete |
| POST | `/api/documents/:id/archive` | Archive |
| GET | `/api/documents/:id/versions` | Version history |
| POST | `/api/documents/:id/versions` | New version |

### Credentials (`/api/credentials`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/credentials` | List credentials |
| POST | `/api/credentials` | Issue credential |
| GET | `/api/credentials/:id` | Get one |
| PATCH | `/api/credentials/:id` | Update metadata |
| POST | `/api/credentials/:id/verify` | Mark verified (active) |
| POST | `/api/credentials/:id/revoke` | Revoke |

### Legacy talent routes (unchanged paths, canonical backend)

- `GET/POST/PATCH/DELETE /api/talent/me/documents`
- `POST /api/talent/me/documents/upload` → `DocumentService.createFromUpload`
- `GET /api/talent/me/credentials`

---

## Platform Integration

| System | Integration |
|--------|-------------|
| **Media Library** | `createMediaAssetFromBuffer` registers uploads as MediaAsset |
| **TalentProfile** | `ProfileDocumentService` delegates; `TalentProfileReadService` reads `DocumentRepository` |
| **Applications** | Attach accepts `documentId` or legacy `profileDocumentId` |
| **Timeline** | DocumentCreated, CredentialIssued/Verified/Revoked → timeline verbs |
| **Analytics** | `document_uploaded`, `credential_issued`, `credential_verified`, etc. |
| **Search** | `credential` entity type + `mapCredentialToSearchDocument` (active only) |
| **Localization** | `documents-platform` namespace (en + ur); timeline verb labels extended |
| **Feature flag** | `DOCUMENTS_PLATFORM_ENABLED` / `VITE_DOCUMENTS_PLATFORM_ENABLED` |

---

## Feature Flags

| Server | Client | Default |
|--------|--------|---------|
| `DOCUMENTS_PLATFORM_ENABLED` | `VITE_DOCUMENTS_PLATFORM_ENABLED` | enabled (`!== '0'`) |

When disabled: platform APIs return 503; services throw/not-found appropriately.

---

## Verification

```bash
npm run verify:documents
```

### Results (2026-07-13)

| Command | Result |
|---------|--------|
| `npm run verify:documents` | **PASS** (43/43) |
| `npm run verify:timeline` | **PASS** (sub-suite) |
| `npm run verify:career-domain` | **PASS** (26/26) |
| Client build | **PASS** |

---

## Manual QA Checklist

- [ ] Upload document via `/talent/me/documents/upload` → appears in GET `/api/documents`
- [ ] Create document with existing `mediaAssetId` via POST `/api/documents`
- [ ] Create new version → `isCurrentVersion` flips; history lists all versions
- [ ] Set tags, expiry, visibility on update
- [ ] Issue credential with skillName + score via POST `/api/credentials`
- [ ] Verify credential → status `active`; search index scheduled
- [ ] Revoke credential → status `revoked`
- [ ] Attach document to application via `documentId` in create flow
- [ ] Timeline shows `document.uploaded` and `credential.earned` events
- [ ] Set `DOCUMENTS_PLATFORM_ENABLED=0` → API 503
- [ ] Locale en ↔ ur — document type labels update

---

## Known Limitations

| Item | Notes |
|------|------|
| Dedicated Documents UI | Client has APIs + i18n only; no full management pages yet |
| Employer verification | `verify` is self-service; no employer approval workflow |
| OCR / AI verification | Out of scope |
| Legacy ProfileDocument data | Not auto-migrated; new writes go to `documents` |
| Public credential catalog UI | Search indexer ready; no public browse page |
| Assessment bridge | `assessmentAttemptId` field exists; assessment engine not wired |

---

## Files Added / Modified

### New

- `server/src/models/career/Document.js`
- `server/src/repositories/career/DocumentRepository.js`
- `server/src/services/career/DocumentService.js`
- `server/src/services/career/CredentialPlatformService.js`
- `server/src/services/career/careerDocumentBridge.js`
- `server/src/controllers/career/documentController.js`
- `server/src/controllers/career/credentialController.js`
- `server/src/routes/documents.js`
- `server/src/routes/credentials.js`
- `client/src/services/documentsApi.js`
- `client/src/services/credentialsApi.js`
- `client/src/i18n/locales/en/documents-platform.json`
- `client/src/i18n/locales/ur/documents-platform.json`
- `scripts/verify-documents.mjs`

### Modified

- `shared/career/constants.js`, `validation.js`, `timelineVerbs.js`, `timelineEventMap.js`
- `server/src/models/career/Credential.js`, `ApplicationDocumentReference.js`
- `server/src/services/career/ProfileDocumentService.js`, `profileDocumentUploadController.js`
- `server/src/services/career/OpportunityApplicationService.js`, `TalentProfileReadService.js`
- `server/src/services/mediaService.js` — `createMediaAssetFromBuffer`
- `server/src/services/search/documentMappers.js`, `SearchIndexer.js`
- `shared/search/entityTypes.js`
- `server/src/config/careerFeatureFlags.js`, `index.js`, `routes/index.js`
- `client/src/config/careerFeatureFlags.js`, `i18n/config.js`, timeline locale files
- `package.json`, `scripts/verify-career-domain.mjs`, `.env.template`

---

## Implementation Checklist

### Document Platform

- [x] Canonical Document model
- [x] Document repository
- [x] Document service
- [x] Version history
- [x] Ownership
- [x] Permissions
- [x] Upload integration

### Credential Platform

- [x] Credential model (extended)
- [x] Credential repository
- [x] Credential service
- [x] Verification status
- [x] Issuer support
- [x] Expiry support

### Platform Integration

- [x] TalentProfile
- [x] Timeline
- [x] Analytics
- [x] Search
- [x] Localization
- [x] Media Library
- [x] Feature flags

### Verification

- [x] `verify:documents` PASS
- [x] `verify:timeline` PASS
- [x] `verify:career-domain` PASS
- [x] Client build PASS

---

## Next Sprint

**C.8.1** — Full Job Application Tracker, or **Assessment Platform** wiring credentials from assessments (per roadmap).
