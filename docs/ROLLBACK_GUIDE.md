# Rollback Guide — EduRozgaar

Use when a deployment causes errors, data corruption, or unacceptable downtime.

---

## Decision matrix

| Severity | Action |
|----------|--------|
| Client UI broken only | Roll back Vercel deployment |
| API errors / 5xx spike | Roll back Render deployment |
| Bad migration / data issue | Restore MongoDB backup + roll back API |
| Payment webhook misconfigured | Disable Stripe webhook + roll back API |

---

## 1. Vercel (client) rollback

1. Vercel Dashboard → Project → **Deployments**
2. Find last known-good deployment → **⋯ → Promote to Production**
3. Verify homepage, login, and `/api` proxy env unchanged

Typical recovery time: **< 2 minutes**

---

## 2. Render (API) rollback

1. Render Dashboard → Service → **Events**
2. Select previous deploy → **Rollback to this version**
3. Confirm env vars unchanged
4. Watch logs: `[Cron] Queue processed` and `/api/health` = 200

Typical recovery time: **3–5 minutes**

---

## 3. Database rollback

**Only if schema/data migration failed.**

1. MongoDB Atlas → **Backup** → select snapshot before deploy
2. Restore to **new** cluster or temporary cluster
3. Update `MONGO_URI` on Render to restored cluster
4. Redeploy API
5. After validation, cut traffic to restored DB

⚠️ Writes after snapshot will be lost. Notify users if accounts/transactions affected.

---

## 4. Stripe rollback

1. Stripe Dashboard → Developers → Webhooks → disable broken endpoint
2. Roll back API to version with correct webhook handler
3. Re-enable webhook; replay failed events if needed

---

## 5. Verification after rollback

```bash
curl https://api.yourdomain.com/api/health
node scripts/verify-sprint-c4.mjs --base https://api.yourdomain.com
```

Manual checks:
- Login (student + employer + admin)
- Job listing loads
- Admin monitoring green

---

## 6. Communication template

> We experienced a brief issue after [date/time] deployment. Service has been restored to the previous stable version. If you notice missing data from [window], contact support@yourdomain.com.

---

## Prevention

- Always deploy API to **staging** first
- Run `node scripts/verify-sprint-c5.mjs` against staging
- Tag git releases: `v1.0.0`, `v1.0.1`
- Keep Atlas backups enabled with 7+ day retention
