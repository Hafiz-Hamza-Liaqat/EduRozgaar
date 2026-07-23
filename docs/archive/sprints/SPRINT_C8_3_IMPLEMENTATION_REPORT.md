# Sprint C.8.3 — Career Dashboard v2 (Career Operating System)

**Status:** Complete  
**Date:** 2026-07-14  
**Scope:** Expand the career dashboard into the primary workspace via widget-composition only. No AI scoring, employer dashboard, assessments, messaging, or learning platform. Backward-compatible with V1 layout via feature flags.

---

## Summary

The Career Dashboard is now a **Career Operating System**: goal- and action-oriented widgets composed from a single `GET /api/career/dashboard` call. Shared server context loads TalentProfile, OpportunityApplication, Readiness, Timeline, Documents, Credentials, recommendations, and notifications once — widgets remain presentational.

---

## Architecture

```
CareerDashboardPage
  └── useDashboardComposition → careerDashboardApi.get()  (single call)
        └── DashboardLayout (responsive: mobile / tablet / desktop)
              └── WidgetZone → WidgetRenderer → widgets/* (data prop only)

GET /api/career/dashboard
  └── DashboardCompositionService.composeForUser
        ├── loadSharedContext (one round of platform fetches)
        ├── resolveDefaultLayout(v1|v2) + optional preference overlay
        └── PROVIDERS[ctx] → widgets map
```

No Mongo / platform API usage inside widget React components.

---

## Widget Registry

| Module | Widgets |
|--------|---------|
| Foundation | profile-summary, readiness-score, applications-summary, timeline-recent, documents-recent, credentials-summary, recommendations, dynamic-content, quick-links |
| V2 | career-health, weekly-progress, profile-completion, upcoming-deadlines, interview-schedule, recommended-jobs/scholarships/admissions, recommended-learning (placeholder), goals-targets, notification-center, recent-achievements, layout-customize |

Layouts:

- **V1** (`CAREER_DASHBOARD_V2_ENABLED=0`) — classic C.8.0.6 + readiness layout  
- **V2** (default on) — Career OS layout with health, deadlines, interviews, split recommendations, goals, notifications  

---

## Personalization

| Flag | Default | Behavior |
|------|---------|----------|
| `CAREER_DASHBOARD_V2_ENABLED` | on unless `0` | Select V2 widget set/layout |
| `DASHBOARD_PERSONALIZATION_ENABLED` | **off** unless `1` | Persist layout / hidden widgets |

APIs (when personalization on):

- `GET/PUT/DELETE /api/career/dashboard/layout`  
- Model: `DashboardPreference` (`dashboardPreferences`)

Drag-and-drop reorder UI is intentionally a **placeholder** noting that persistence APIs are ready; full DnD polish is deferred.

---

## Verification

```bash
npm run verify:career-dashboard-v2
npm run verify:career-dashboard
npm run verify:readiness
```

---

## QA Checklist

### Widgets

- [x] Career Health
- [x] Weekly Progress
- [x] Profile Completion
- [x] Upcoming Deadlines
- [x] Interview Schedule
- [x] Recommended Jobs / Scholarships / Admissions
- [x] Recommended Learning (placeholder)
- [x] Goals & Targets
- [x] Notification Center
- [x] Recent Achievements
- [x] Layout customize (flag + placeholder)

### Architecture

- [x] Extensible registry
- [x] Composition-only client
- [x] Shared server context (no per-widget duplicate platform load pattern in compose)
- [x] Readiness / Tracker / Timeline / Docs / Credentials integration
- [x] Localization en/ur
- [x] Permissions + feature flags
- [x] Responsive layout
- [x] V1 backward compatibility flag

### Verification

- [x] `verify:career-dashboard-v2` PASS
- [x] `verify:career-dashboard` PASS
- [x] Client build PASS

---

## Known Limitations

1. Full drag-and-drop editor UI deferred; preference API exists behind personalization flag.  
2. Recommended Learning is copy-only until Assessment platform.  
3. Dynamic content blocks may still fetch listing content independently (Page Builder path) — career domain aggregates stay on composition.  
4. Notification center is read-only summary (no mark-read from the widget).  

---

## Rollout

1. Keep `CAREER_DASHBOARD_ENABLED=1` and `CAREER_DASHBOARD_V2_ENABLED=1` for Career OS.  
2. Set `CAREER_DASHBOARD_V2_ENABLED=0` to restore classic layout instantly.  
3. Opt into personalization with `DASHBOARD_PERSONALIZATION_ENABLED=1` after QA.  

---

## Key Files

| Area | Path |
|------|------|
| Registry | `shared/career/dashboardWidgetRegistry.js` |
| Composition | `server/src/services/career/DashboardCompositionService.js` |
| Preferences | `server/src/services/career/DashboardPreferenceService.js` |
| Layout UI | `client/src/dashboard/DashboardLayout.jsx` |
| Widgets | `client/src/dashboard/widgets/*` |
| Verify | `scripts/verify-career-dashboard-v2.mjs` |

---

## Recommended Next Sprint

**C.8.4 — Assessment Platform** — feed credentials and learning recommendations into readiness and the learning widget placeholder.
