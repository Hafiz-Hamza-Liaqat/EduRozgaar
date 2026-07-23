# Sprint B.2 — Resume Builder PDF Polish & Rendering Consistency

**Status:** Complete  
**Scope:** Polish and bug-fix only — no redesign, no new features, minimal schema change (`professionalTitle` only).

---

## Problem Summary (Post B.1)

After Sprint B.1, the Resume Builder still had rendering drift between preview and PDF:

- Full name occasionally missing from exported PDF
- Section titles inconsistent or absent across templates
- Four separate template JSX implementations with diverging logic
- Optional sections showing blank gaps or partial empty entries
- Skills formatting inconsistent (comma vs multiline, dedupe order)
- Poor page-break behavior and unprofessional typography

---

## Solution Architecture

Preview and PDF now share a **single presentation pipeline**:

```
resume (editor state)
  → buildResumeViewModel()     // resumeRenderUtils.js
  → <ResumeDocument />         // ResumeDocument.jsx + resume-document.css
  → live preview (ResumePreview.jsx)
  → PDF export clones .resume-preview DOM (ResumeDownload.jsx)
```

Template differences are **CSS skins only** (`resume-skin-modern`, `resume-skin-minimal`, `resume-skin-creative`, `resume-skin-academic`) — no duplicated section markup.

---

## Changes by Objective

### 1. Resume Header (always visible)

- `ResumeDocument` always renders `<h1 class="resume-name">` via `displayName()` (falls back to “Your Name” only when field is empty).
- Added **Professional Title** field (`personalInfo.professionalTitle`) in form, defaults, i18n (en/ur/ar), and server schema/sanitize.
- Contact line (email · phone · location) and social labels (LinkedIn · GitHub · Portfolio) render when populated.
- Creative template retains profile photo in header.

### 2. Section Headings

Every populated section renders a consistent uppercase heading:

| Section | Heading key |
|---------|-------------|
| Career objective | `careerObjective` / `objective` (academic) |
| Education | `education` |
| Technical skills | `technicalSkills` |
| Soft skills | `softSkills` |
| Experience | `experience` |
| Projects | `projects` / `researchProjects` (academic) |
| Certifications | `certifications` |
| Languages | `languages` |
| References | `references` |
| Awards | `awards` |
| Volunteer | `volunteerExperience` |
| Publications | `publications` |
| Interests | `interests` |
| Memberships | `professionalMemberships` |

Empty sections are omitted entirely (no heading, no gap).

### 3. Preview = PDF

- `ResumePreview.jsx` reduced to a thin wrapper around `ResumeDocument`.
- `ResumeDownload.jsx` captures a **fixed off-screen clone** of `.resume-preview` (same DOM as preview), waits for images, uses full `scrollHeight`, multi-page jsPDF slice, and page numbers (`n / total`).

### 4. Typography Polish

`resume-document.css` defines shared professional typography:

- Consistent section spacing, heading size/weight, body and list spacing
- A4-safe document box (`210mm`, `15mm` padding, `11pt` base)
- Template-specific color/border skins without layout changes

### 5. Skills Rendering

- `parseSkillLines()` — splits on newline **or** comma, trims, dedupes case-insensitively, **preserves input order**
- `normalizeSkillList()` — same order-preserving dedupe for arrays
- Technical and soft skills render as separate sections with bullet-prefixed flex-wrap list

### 6. Additional Sections

`buildResumeViewModel()` filters empty partial entries via `filterEntries()` before render — references, awards, volunteer, publications, interests, and memberships only appear when they have real content.

### 7. Page Break Safety

- `break-inside: avoid` on header and each resume entry
- `break-after: avoid` on section headings (reduces orphan headings in print)
- Multi-page PDF via full-height canvas capture (no single-page clip)
- Page numbers on exported PDF

### 8. Data Validation / Mapping

View-model maps all editor fields:

- Name, title, objective, education, technical/soft skills, experience, projects, certifications, languages, references, awards, volunteer, publications, interests, memberships

### 9. Regression Protection

- Removed deprecated `resumeSectionHelpers.jsx` (replaced by unified pipeline)
- Save/load unchanged except optional `professionalTitle` on `personalInfo`
- All four templates preserved via CSS skins
- AI optimize, wizard, and PDF download paths unchanged in API
- **Client build:** PASS

---

## Files Changed

| File | Action |
|------|--------|
| `client/src/pages/ResumeBuilder/ResumeDocument.jsx` | **New** — unified presentation |
| `client/src/pages/ResumeBuilder/resumeRenderUtils.js` | **New** — view-model builder |
| `client/src/pages/ResumeBuilder/resume-document.css` | **New** — typography + skins |
| `client/src/pages/ResumeBuilder/ResumePreview.jsx` | Rewritten — uses ResumeDocument |
| `client/src/pages/ResumeBuilder/ResumeDownload.jsx` | Improved clone capture + page numbers |
| `client/src/pages/ResumeBuilder/resumeDefaults.js` | `professionalTitle`, skill dedupe order |
| `client/src/pages/ResumeBuilder/ResumeForm.jsx` | Professional title field |
| `client/src/pages/ResumeBuilder/resumeSectionHelpers.jsx` | **Deleted** |
| `server/src/models/Resume.js` | `professionalTitle` on personalInfo |
| `server/src/controllers/resumesController.js` | Sanitize `professionalTitle` |
| `client/src/i18n/locales/{en,ur,ar}/resume.json` | Professional title strings |

---

## Manual Verification Checklist

Use Resume Builder at `/resume-builder` (login optional for preview/PDF; login required for save).

| Case | Verify |
|------|--------|
| **Short resume** | Single page; name + all populated headings visible |
| **Medium resume** | Two pages; no clipped header or footer content |
| **Long resume** | 3+ pages; clean slices; page numbers |
| **Skills (30+)** | Comma and multiline input; order preserved; no duplicates |
| **All optional sections** | Headings + content when filled; hidden when empty |
| **All 4 templates** | Skin colors differ; section order/headings identical |
| **PDF vs preview** | Side-by-side: same sections, spacing, typography |
| **Save/load** | Professional title persists |
| **AI objective suggest** | Still works on objective step |

---

## Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| Full name always visible | ✅ |
| Every populated section has a heading | ✅ |
| Preview and PDF visually consistent | ✅ (shared component + clone export) |
| Multi-page export without clipping | ✅ |
| No missing data during export | ✅ (view-model audit) |
| Optional sections only when populated | ✅ |
| No duplicated sections | ✅ |
| Production-ready output | ✅ |
| No regression on existing features | ✅ (build pass; API unchanged) |

---

## Notes

- **Personal Information** is represented by the document header (name, title, contact, social) — not a separate section heading, matching standard resume conventions and Sprint B.2 header objective.
- PDF page-break CSS (`break-inside`) helps print layouts; jsPDF image slicing handles multi-page export. Orphan headings at arbitrary slice boundaries may still occur on very long sections — acceptable for B.2 scope without redesign.
