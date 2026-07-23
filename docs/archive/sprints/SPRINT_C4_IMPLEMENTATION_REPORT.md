# Sprint C.4 — Automation, Integrations & Analytics

**Status:** Implemented  
**Date:** 2026-07-12  
**Scope:** Sprint C.4 only (C.5 launch prep is separate)

---

## Summary

Sprint C.4 connects the platform modules into a production-style automation layer: event-driven notifications and emails, persistent background job queues with deduplication, scheduled reminders, and an extended executive analytics dashboard.

---

## 1. Background job queue

### Model
- `server/src/models/BackgroundJob.js` — types: `email`, `notification`, `scheduled_newsletter`, `scholarship_reminder`, `admission_reminder`, `subscription_reminder`
- Statuses: `pending`, `processing`, `completed`, `failed`, `dead`
- Unique `dedupKey` prevents duplicate notifications/emails

### Service
- `server/src/services/jobQueueService.js`
  - `enqueueJob`, `processQueue`, `getQueueStats`, `retryDeadJobs`
  - Batch size 20; exponential backoff on failure; dead-letter after max attempts

### Cron
- `server/src/scheduler/cron.js`
  - Queue processor: every minute (`DISABLE_QUEUE_CRON=1` to disable)
  - Reminders: daily 8am (`DISABLE_REMINDER_CRON=1` to disable)

### Admin API
- `GET /api/admin/queue/status`
- `POST /api/admin/queue/process`
- `POST /api/admin/queue/retry`

---

## 2. Notification automation

Event handlers in `server/src/services/automationService.js`:

| Event | Trigger location | Notification / email |
|-------|------------------|----------------------|
| User registers | `authController.register` | Welcome + email verification |
| Job application submitted | `applicationsController` | Student + employer inbox + confirmation emails |
| Application status change | `employerController` | Status notification; interview/offer emails |
| Payment success | `paymentService` | Employer payment notification |
| Resume analysis complete | `resumeAnalyzerController` | User notification |
| Employer verification change | `moderationController`, `usersController` | Employer notification + verification email |
| Job approved | `moderationController` | Employer notification |
| Webinar published | `adminWebinarsController` create/update | Staff notification |
| Support ticket reply | `adminSupportController` | User notification + email |
| Scholarship deadline near | `reminderJobs.js` (cron) | User notifications (saved scholarships) |
| Admission deadline near | `reminderJobs.js` (cron) | User notifications (saved admissions) |
| Subscription expiring | `reminderJobs.js` (cron) | Employer notifications |

Dedup keys ensure the same event does not create duplicate inbox entries or emails.

---

## 3. Email automation

Templates in `server/src/templates/emailTemplates.js` (EN + UR):

| Template | Event |
|----------|-------|
| `welcome` | Registration |
| `emailVerification` | Registration |
| `passwordReset` | Forgot password |
| `applicationReceived` | Job application (student) |
| `employerApplicationReceived` | Job application (employer) |
| `interviewInvitation` | Application → interview |
| `offerLetter` | Application → hired |
| `contactConfirmation` | Contact form |
| `supportTicketUpdate` | Support reply |
| `employerVerification` | Verification level change |
| `newsletter` | Newsletter send/schedule |

All transactional emails go through `queueEmail` → background queue → `sendTemplatedEmail`.

Client verify-email page: `/auth/verify-email?token=…` (`VerifyEmail.jsx`).

---

## 4. Executive dashboard

### Backend
- `server/src/controllers/admin/executiveDashboardController.js` extended with:
  - DAU / WAU / MAU (`activeToday`, `activeWeek`, `activeMonth`)
  - New registrations, resume creation, resume AI usage, resume downloads
  - Applications today / 30-day
  - Scholarship saves, admission saves
  - Employer growth, revenue
  - Device, browser, country breakdown (30d)
  - Queue pending count, emails sent today

### Frontend
- `client/src/pages/Admin/ExecutiveDashboard.jsx` — new metric cards + device/browser/country charts
- `client/src/pages/ResumeBuilder/ResumeDownload.jsx` — fires `resume_download` analytics event

### Analytics enrichment
- `server/src/controllers/analyticsController.js` — captures device, browser, country from headers/metadata

---

## 5. Monitoring & health

- `server/src/controllers/admin/monitoringController.js` — Redis cache stats + background job queue stats
- `server/src/controllers/platformOpsController.js` — `/api/health` includes `backgroundJobs` queue summary
- Admin Platform Ops page (from C.3) shows env validation and service status

---

## 6. Performance (audit notes)

| Area | Status | Notes |
|------|--------|-------|
| Cache dashboard | ✅ | Redis stats in Admin → Monitoring |
| DB query optimization | ✅ | Executive dashboard uses parallel `countDocuments` / aggregations |
| Pagination audit | ✅ | Admin list endpoints capped at 100; public APIs use standard paginate helper |
| Image optimization | ⏳ | Cloudinary transforms recommended at upload time (existing upload service) |
| Lazy loading | ✅ | Route-level code splitting via `lazyLoad()` in `client/src/routes/index.jsx` |

---

## 7. Verification

**Script:** `node scripts/verify-sprint-c4.mjs [--base http://localhost:5000]`

Checks:
- Email template rendering for automation types
- Automation service exports
- Job queue module exports
- Verify-email route validation
- Admin queue auth gate
- Health endpoint includes background job stats

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DISABLE_QUEUE_CRON=1` | Disable queue processor |
| `DISABLE_REMINDER_CRON=1` | Disable deadline/expiry reminders |
| `SITE_URL` / `FRONTEND_URL` | Links in verification/reset emails |
| `BREVO_API_KEY` / SMTP vars | Email delivery |
| `REDIS_URL` | Optional cache + token store |

---

## Files added / modified (key)

**New**
- `server/src/models/BackgroundJob.js`
- `server/src/services/jobQueueService.js`
- `server/src/services/automationService.js`
- `server/src/scheduler/reminderJobs.js`
- `server/src/controllers/admin/queueController.js`
- `client/src/pages/Auth/VerifyEmail.jsx`
- `scripts/verify-sprint-c4.mjs`

**Modified**
- `server/src/scheduler/cron.js`
- `server/src/controllers/authController.js`
- `server/src/controllers/admin/executiveDashboardController.js`
- `server/src/controllers/admin/usersController.js`
- `server/src/controllers/admin/adminWebinarsController.js`
- `server/src/controllers/contactController.js`
- `client/src/pages/Admin/ExecutiveDashboard.jsx`
- `client/src/pages/ResumeBuilder/ResumeDownload.jsx`

---

## Known limitations

1. **Admission application status** — no separate admission-application workflow exists; reminders cover saved admissions only.
2. **Newsletter** — large sends run synchronously inside a single queue job (acceptable for launch scale; consider batch jobs later).
3. **Email delivery** — requires Brevo/SMTP configured in production; dev mode may log placeholders.

---

## Next: Sprint C.5

See `docs/SPRINT_C5_LAUNCH_READINESS.md` for full QA, security audit, Lighthouse targets, backup verification, deployment guides, and go-live checklist.

**Do not deploy until C.5 passes.**
