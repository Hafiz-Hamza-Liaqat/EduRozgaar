# EduRozgaar i18n Translation Audit

**Audit date:** July 2026  
**Stack:** react-i18next · i18next · i18next-browser-languagedetector  
**Languages:** English (full) · Urdu (full) · Arabic (architecture-ready placeholders)

---

## Summary

| Metric | Count |
|--------|------:|
| Pages scanned | 67 |
| Components scanned | 35 |
| Pages migrated to `useTranslation` | 47 |
| Layout/shell components migrated | 6 |
| Translation namespaces | 22 |
| Translation keys (nested, en) | **1,160** |
| Hardcoded UI strings removed (est.) | **900+** |
| Locale JSON files (en + ur + ar) | 66 |

---

## Architecture Verification

| Check | Status |
|-------|--------|
| react-i18next (official) | ✅ |
| Custom translation engine removed | ✅ (LanguageContext wraps i18next) |
| Lazy-loaded locale chunks | ✅ (Vite dynamic `import()` per namespace) |
| No duplicate translation logic | ✅ (single source: JSON locale files) |
| Unlimited language support | ✅ (`LANGUAGES` config array) |
| RTL / LTR auto `dir` | ✅ (`applyDocumentLanguage`) |
| Font switching (Inter / Nastaliq / Noto Arabic) | ✅ |
| Language persistence localStorage | ✅ |
| Profile `preferredLanguage` sync | ✅ (login + navbar switch) |
| hreflang en / ur / ar | ✅ |
| Database content NOT translated | ✅ (job titles, blog body, etc.) |

---

## Remaining Untranslated UI (Minor)

| Page | Notes |
|------|-------|
| `ResumeAnalyzer.jsx` | Scanner UI labels |
| `ExamDetail.jsx`, `QuizTake.jsx` | Quiz UI chrome |
| `IntlScholarshipDetail.jsx` | Section headings |
| `SEOJobsPage.jsx`, `SEOScholarshipsPage.jsx` | SEO landing empty states |
| `JobsCategoryLanding.jsx`, `JobsProvinceLanding.jsx` | Landing page labels |
| `ForeignStudies.jsx`, `SchoolsAndColleges.jsx` | Short placeholder pages |
| `License.jsx`, `Advertise.jsx`, `Services.jsx`, `SubmitOpportunity.jsx` | Marketing/static pages |
| Resume subcomponents | Step labels (partial via parent) |

**Estimated remaining strings:** ~80–120 (low-traffic pages)

---

## Launch Recommendation

**English + Urdu:** Production-ready for all primary user flows.  
**Arabic:** Architecture ready — set `enabled: true` in `client/src/i18n/config.js` after completing `ar/*.json` translations.
