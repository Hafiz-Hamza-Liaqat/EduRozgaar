# Incident Recovery Guide — EduRozgaar

## Severity levels

| Level | Example | Response time |
|-------|---------|---------------|
| S1 | Site down, payments broken, data leak | Immediate |
| S2 | Email queue stuck, admin unavailable | < 1 hour |
| S3 | Single feature broken, degraded performance | < 4 hours |
| S4 | Cosmetic / non-critical | Next sprint |

---

## S1 — Full outage

1. Confirm scope: Vercel, Render, or Mongo?
   ```bash
   curl -I https://yourdomain.com
   curl https://api.yourdomain.com/api/health/ready
   ```
2. Check Render status page and MongoDB Atlas alerts
3. If bad deploy → **rollback** (`docs/ROLLBACK_GUIDE.md`)
4. If Mongo down → Atlas support + failover to secondary
5. Post status update; document timeline

---

## S2 — Email not sending

1. Admin → Monitoring → check SMTP/Brevo status
2. `GET /api/admin/queue/status` — growing `pending`?
3. Verify `BREVO_API_KEY` on Render
4. Check Brevo dashboard for blocks/bounces
5. Manual drain: `POST /api/admin/queue/process`
6. Retry dead jobs: `POST /api/admin/queue/retry`

---

## S2 — Notification duplicates

1. Check if dedupKey collision — inspect `BackgroundJob` collection for duplicate `dedupKey`
2. Verify only one API instance running queue cron (or accept idempotent dedup)
3. If duplicate code paths exist, disable direct send — use queue only

---

## S2 — JWT / auth mass failure

1. Confirm `JWT_SECRET` unchanged between deploys
2. If secret rotated → all users must re-login (expected)
3. Check Redis for refresh token store if `REDIS_URL` changed
4. Verify `FRONTEND_URL` matches Vercel domain (CORS)

---

## S3 — Stripe webhooks failing

1. Stripe Dashboard → Webhooks → recent deliveries
2. Compare `STRIPE_WEBHOOK_SECRET` with endpoint signing secret
3. Fix secret → redeploy → **Resend** failed events
4. Reconcile payments in Admin → Payments

---

## S3 — Performance degradation

1. Admin → Monitoring → Redis down? (cache miss storm)
2. Atlas → slow queries → add indexes
3. Check queue backlog blocking event loop
4. Temporarily set `DISABLE_SCRAPER_CRON=1` if scraper overloads DB

---

## Data breach suspicion

1. Rotate all secrets: JWT, refresh, Stripe, Brevo, Cloudinary, Mongo password
2. Revoke active sessions (clear Redis refresh keys)
3. Audit `AuditLog` collection for suspicious admin actions
4. Notify affected users per legal requirements
5. Engage security review (`docs/SPRINT_C2_SECURITY_IMPLEMENTATION_REPORT.md`)

---

## Post-incident

1. Write incident report: timeline, root cause, fix, prevention
2. Add monitoring alert if missing
3. Update runbooks if steps were wrong
4. Tag hotfix release in git

---

## Contacts (fill before launch)

| Role | Contact |
|------|---------|
| On-call developer | |
| Atlas admin | |
| Domain/DNS | |
| Stripe account owner | |
