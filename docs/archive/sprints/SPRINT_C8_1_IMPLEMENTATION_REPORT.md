# Sprint C.8.1 — Job Application Tracker (MVP)

**Status:** Complete  
**Date:** 2026-07-14  
**Scope:** Product-first retention feature on the existing OpportunityApplication platform — Kanban/table tracker, detail mutations, dashboard metrics widget, CareerEventBus → notifications. No AI scoring. No employer OA inbox. No parallel status logic.

---

## Summary

Applications are an active workflow, not a static list. Talent users manage the full 13-stage pipeline with notes, reminders, contacts, interview scheduling, attachments, and timeline — all powered by the OpportunityApplication aggregate from C.8.0.3A. The career dashboard surfaces lightweight tracker metrics and quick actions so users have a reason to return daily.

---

## Architecture

```
My Applications (list | kanban | table | calendar placeholder)
        │  applicationsApi
        ▼
opportunityApplicationsRouter (requireAuth + requireUserAuth + flag)
        │
        ├── OpportunityApplicationService
        │     ├── ApplicationStageMachine (shared, 13 stages)
        │     ├── notes / documents / reminders / contacts / interview
        │     └── emitCareerEvent (exactly one per mutation)
        │
        ├── ApplicationMetricsService  → GET /applications/metrics
        │
        └── CareerEventBus
              ├── careerEventHandlers → Timeline
              ├── careerApplicationBridge → analytics / reminder jobs
              └── careerNotificationBridge → notifyUser (P1 close)
```

Dashboard path (composition only — widgets do not call tracker APIs directly):

```
GET /api/career/dashboard
  └── DashboardCompositionService
        ├── OpportunityApplicationService.listForUser
        └── ApplicationMetricsService.getForUser
              └── ApplicationsSummaryWidget (metrics + CTAs)
```

---

## Tracker Workflow

Canonical stages (enforced by `shared/career/applicationStageMachine.js`):

```
Interested → Preparing → Applied → Viewed → Screening → Assessment
  → Interview → Offer → Negotiation → Accepted → Joined
Terminal: Rejected | Withdrawn | Joined
```

| Concern | Implementation |
|---------|----------------|
| Stage changes | `POST /applications/:id/stage` → `assertValidTransition` |
| Notes | `POST /applications/:id/notes` |
| Reminders | CRUD on `/reminders`; queue job `application_reminder` |
| Documents | Attach from TalentProfile DocumentPicker |
| Contacts | `POST/DELETE …/contacts` + `ApplicationContact` schema |
| Interview | `PUT …/interview` → `InterviewScheduled` event |
| Timeline | ActivityFeed + mapped CareerEventBus events |
| Status history | `stageHistory[]` + StageTimeline |

Kanban and detail stage controls call `getAllowedTransitions` only — there is no second status enum in the UI.

---

## UI Flows

### My Applications

1. Metrics strip: active, interviews, offers, response rate, completion rate.
2. Search, type filter, stage filter, sort.
3. View toggle: **Kanban** (default), list, table, calendar (placeholder copy).
4. Kanban: per-card allowed-transition select → `transitionStage` → reload.
5. Rows/cards link to Application Detail.

### Application Detail

Editable panels:

- Stage transition (reason optional)
- Interview schedule (mode, when, location/URL, notes)
- Notes composer + list
- Document attach/remove (TalentProfile-backed)
- Reminder schedule
- Contacts add/remove
- Stage history timeline + ActivityFeed
- Archive

### Dashboard widget

`ApplicationsSummaryWidget` shows tracker metrics tiles, stage counts, **Open tracker**, and **Track new application** — data from dashboard composition payload (`metrics` + `byStage`).

---

## Event Integration

| Event | Timeline | Notification | Notes |
|-------|----------|--------------|-------|
| StageChanged | Yes | Yes | Title includes target stage |
| ReminderCreated | Yes | Yes | Due time in body |
| InterviewScheduled | Yes | Yes | Category `interview` |
| ContactAdded | Yes | — | Timeline verb localized |
| DocumentAttached | Yes | — | Existing |
| OfferAccepted | Yes | Yes | |
| ApplicationWithdrawn | Yes | Yes | |

`registerCareerNotificationHandlers()` runs at server boot beside timeline handlers (`server/src/index.js`). Reminder due dates still enqueue `application_reminder` jobs via `careerApplicationBridge`.

---

## Metrics (user-scoped)

`ApplicationMetricsService.getForUser`:

| Metric | Definition |
|--------|------------|
| Active | Non-terminal pipeline stages |
| Interviews scheduled | Stage `interview` or `interview.scheduledAt` set |
| Offers received | offer / negotiation / accepted / joined |
| Response rate | (viewed+ non-terminal beyond applied) / (applied+) |
| Completion rate | (accepted + joined) / closed terminal-ish set |

No employer or AI scoring in this sprint.

---

## Feature Flags & Permissions

- Server: `OPPORTUNITY_APPLICATION_ENABLED` + `requireOpportunityApplicationEnabled`
- Client: `VITE_OPPORTUNITY_APPLICATION_ENABLED` / `isOpportunityApplicationEnabled`
- Dashboard widget remains gated by career dashboard + OA flags in the widget registry
- All tracker mutation routes: `requireAuth` + `requireUserAuth`

Migration flags from C.8.0.7 are unchanged.

---

## Verification

```bash
npm run verify:application-tracker
npm run verify:career-platform
npm run verify:migration
```

`verify:application-tracker` covers state machine, transitions, timeline maps, reminders, notification bridge, documents/TalentProfile, dashboard widget, i18n, permissions, flags, responsive UI, sub-suites (`verify:opportunity-application`, `verify:application-ui`), and client build.

---

## QA Checklist

### Application Tracker

- [x] Kanban view
- [x] Table view
- [x] Application detail enhancements
- [x] Stage management (shared 13-stage machine only)
- [x] Notes management
- [x] Reminder management
- [x] Contacts
- [x] Attachments

### Dashboard

- [x] Tracker widget
- [x] Application metrics
- [x] Quick actions (Open tracker / Track new)

### Platform Integration

- [x] OpportunityApplication
- [x] Timeline
- [x] Documents
- [x] TalentProfile
- [x] Notifications (CareerEventBus bridge)
- [x] Localization (en + ur)
- [x] Permissions

### Verification

- [x] `verify:application-tracker` PASS
- [x] `verify:career-platform` PASS
- [x] `verify:migration` PASS
- [x] Client build PASS

---

## Known Limitations

1. **Calendar view** is a placeholder — reminders and interview fields are the scheduling surface for MVP.
2. **No drag-and-drop Kanban** — stage moves use an allowed-transition select (a11y-friendly, machine-safe).
3. **Notification copy** is English-first in the bridge; UI i18n covers pages/widgets, not push title generation.
4. **No employer OpportunityApplication inbox** or recruiter stage edits.
5. **No AI scoring / fit** — deferred to readiness/intelligence sprints.
6. **Urdu `applications.json`** mirrors English structure for parity; polish of long-form tracker strings can continue in a localization pass.
7. **M5 legacy write deprecation** remains out of scope (C.8.0.7).

---

## Rollout Considerations

1. Keep `OPPORTUNITY_APPLICATION_ENABLED=1` and `VITE_OPPORTUNITY_APPLICATION_ENABLED=1` for talent users.
2. Confirm reminder workers process `application_reminder` jobs in environments with the job queue enabled.
3. Smoke: create OA → move stage → add note/reminder/contact/interview → confirm Notification + Timeline rows.
4. Dashboard: ensure `CAREER_DASHBOARD_ENABLED` so the enhanced applications widget is visible.
5. Dual-write/migration flags from C.8.0.7 can stay as currently configured; this sprint does not flip M5.
6. Rollback: disable opportunity-application flags; notification bridge is additive and harmless when idle.

---

## Key Files

| Area | Path |
|------|------|
| Metrics | `server/src/services/career/ApplicationMetricsService.js` |
| Notifications | `server/src/services/career/careerNotificationBridge.js` |
| Contacts schema | `server/src/models/career/ApplicationContact.js` |
| Routes | `server/src/routes/opportunityApplications.js` |
| List UX | `client/src/pages/Applications/MyApplications.jsx` |
| Detail UX | `client/src/pages/Applications/ApplicationDetail.jsx` |
| Widgets | `client/src/dashboard/widgets/ApplicationsSummaryWidget.jsx` |
| Verify | `scripts/verify-application-tracker.mjs` |

---

## Recommended Next Sprint

**C.8.2** — Employer application inbox / stage collaboration, or full calendar + reminder UX polish — building on this MVP retention loop.
