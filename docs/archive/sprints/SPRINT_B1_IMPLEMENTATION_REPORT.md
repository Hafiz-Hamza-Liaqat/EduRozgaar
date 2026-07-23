# Sprint B.1 — Resume Builder Completion & Image Preview Fixes

**Date:** July 11, 2026  
**Status:** Complete — build verified  
**Scope:** Image preview fixes + resume builder/PDF export only

---

## Root Causes & Fixes

### Issue 1 — Image previews not rendering

| Root cause | Fix |
|------------|-----|
| `imgError` state was not reset when the URL changed (e.g. reopening edit forms), so a prior failed load blocked subsequent previews | `useEffect` resets `imgError` and loading state whenever `previewSrc` changes |
| No loading indicator; users thought preview was broken while images fetched | Added spinner overlay during load |
| Strict `type="url"` + regex-only validation rejected valid URLs mid-typing and offered no graceful fallback | Switched to `type="text"`, relaxed validation with `normalizeImageUrl()` (http/https, protocol-relative, bare domains) |
| Broken URLs showed generic placeholder with no clear feedback | Distinct states: empty, invalid URL, loading, load failed |
| Jobs, Scholarships, Admissions still used plain `<input>` with no preview component | Wired `AdminImageUrlField` on those forms |

**Already using `AdminImageUrlField`:** Blogs, Career Guidance, Companies, Universities, Foreign Studies, Advertisements.

### Issue 2 — PDF sections missing

| Root cause | Fix |
|------------|-----|
| `ResumeDownload.jsx` rendered the full resume canvas as **one image on a single A4 page**. Content taller than 297mm was clipped beyond the first PDF page | Implemented multi-page export: slice canvas across successive A4 pages with proper Y-offset positioning |
| `html2canvas` captured only visible viewport when wrapper had `overflow` constraints | Temporarily set `overflow: visible` and pass explicit `scrollHeight` / `windowHeight` to html2canvas |
| Creative template always rendered an empty Skills section | Skills block now hidden when both arrays are empty |

### Issue 3 — Multiline skills not persisting

| Root cause | Fix |
|------------|-----|
| Skills UI only accepted one skill at a time via Enter key chips; pasting multiline text was ignored | Replaced with textarea (one skill per line) + `parseSkillLines()` |
| Server did not normalize embedded newlines in skill arrays | `sanitizeResumeBody()` splits on `\n` and `,` when saving |
| Reload did not normalize legacy skill formats | `normalizeResumeSkills()` on load in `ResumeBuilder.jsx` |

### Issue 4 — Multi-page PDF

| Root cause | Fix |
|------------|-----|
| Single-page jsPDF `addImage` call | Loop adds pages until all content height is covered |
| Fixed A4 width preserved; page numbers added (`1 / N`) at bottom-right |

### Issue 5 — Optional resume sections

Added optional sections with multi-entry support:

- References
- Awards
- Volunteer Experience
- Publications
- Interests (multiline)
- Professional Memberships

Implemented in: form wizard step “Additional”, all 4 preview templates, MongoDB schema, save/load API.

### Issue 6 — Template export parity

All four templates (`modern-professional`, `minimal-ats`, `creative-portfolio`, `academic-cv`) now share:

- `SkillsBlock` / `AdditionalSections` helpers
- Same section order and data binding
- Same html2canvas → multi-page PDF pipeline (preview WYSIWYG to export)

---

## Files Changed

### Admin image preview
- `client/src/components/admin/AdminImageUrlField.jsx` — rewritten with loading, error, URL normalization
- `client/src/pages/Admin/AdminContentJobs.jsx` — logo preview
- `client/src/pages/Admin/AdminContentScholarships.jsx` — logo preview
- `client/src/pages/Admin/AdminContentAdmissions.jsx` — logo preview

### Resume builder
- `client/src/pages/ResumeBuilder/ResumeDownload.jsx` — multi-page PDF
- `client/src/pages/ResumeBuilder/ResumePreview.jsx` — refactored templates + new sections
- `client/src/pages/ResumeBuilder/resumeSectionHelpers.jsx` — **new** shared section renderers
- `client/src/pages/ResumeBuilder/resumeDefaults.js` — new sections, skill parsing, wizard step
- `client/src/pages/ResumeBuilder/ResumeForm.jsx` — multiline skills, additional step, profile photo preview
- `client/src/pages/ResumeBuilder/ResumeBuilder.jsx` — save/load new fields + skill normalization
- `client/src/pages/ResumeBuilder/ResumeWizard.jsx` — additional step label
- `client/src/i18n/locales/en/resume.json` — new strings

### Backend
- `server/src/models/Resume.js` — optional section schemas
- `server/src/controllers/resumesController.js` — sanitize/persist new fields + skill normalization

---

## Verification

### Build
```
client: npm run build — PASS (713 modules)
```

### Manual QA checklist

| Test | Expected |
|------|----------|
| Admin → Jobs/Scholarships/Admissions → edit → paste image URL | Preview updates while typing; loading spinner; broken URL shows placeholder |
| Resume → Skills → paste 20+ skills (one per line) | All appear in preview; export includes all |
| Resume → 5+ experiences, 10+ projects, multiple certs | All sections in preview and PDF |
| Resume → Additional → fill references, awards, etc. | Sections render in preview and PDF |
| Export PDF with long content | Page 2, 3+ render; page numbers shown; no clipped sections |
| Switch templates (Modern, ATS, Creative, Academic) | Export matches on-screen preview |
| Save resume → reload edit | Skills and new sections persist |

### Screenshots

Screenshots require manual capture in the browser during QA:

1. Admin form with image URL + live preview (Jobs or Scholarships)
2. Resume preview with full content (scroll showing all sections)
3. Exported PDF page 1 and page 2+ side-by-side with preview

> Run locally: `http://localhost:5173/admin/jobs` and `http://localhost:5173/resume-builder`

---

## Known Limitations

1. **CORS-blocked images** — Some external hosts block hotlinking; preview shows “Image could not be loaded” (expected; URL still saves correctly).
2. **PDF is rasterized** — html2canvas produces image-based PDF pages (not selectable text). Acceptable for current architecture.
3. **Creative template profile photo** — Depends on external URL CORS for canvas export; may appear in preview but fail in PDF if host blocks cross-origin.

---

## Deployment Impact

- Backward-compatible MongoDB schema additions (optional fields default to empty arrays).
- No new environment variables.
- Restart server after deploy.
