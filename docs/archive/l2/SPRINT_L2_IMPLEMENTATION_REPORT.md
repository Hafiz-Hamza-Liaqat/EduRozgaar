# Sprint L.2 — Production Infrastructure & Staging Deployment

**Status:** Complete  
**Date:** 2026-07-14  
**Type:** Operations / deployment only  
**Scope:** Docker, Redis, workers, durable media, env separation, secrets templates, SMTP/CDN/SSL/DNS readiness, monitoring, backups, staging deploy tooling, smoke tests  
**Constraints honored:** No product features, no API/schema/workflow redesign, no paid AI integrations

---

## Summary

Implemented production-ready infrastructure overlays and staging deployment runbooks from L.1 conditions. Staging can be brought up with a single script; Redis is required for ready probes in staging/prod compose; media uploads use a named Docker volume; AI budget policy is now an official engineering rule with Cursor always-apply guidance.

---

## What shipped

| Area | Deliverable |
|------|-------------|
| Production Docker | `docker-compose.yml` — `REQUIRE_REDIS=1`, `media_uploads` volume, SMTP/CDN/Sentry env pass-through |
| Staging | `docker-compose.staging.yml`, `docker/.env.staging.example`, `deploy/staging-up.sh`, `deploy/staging-down.sh` |
| Secrets / env | Enhanced `docker/.env.production.example`, `.env.template` AI notes, `.gitignore` for `.env.staging` |
| Workers | Unchanged topology; compose confirms API cron off / worker on |
| Durable media | Named volume `/app/uploads`; S3/Supabase documented for Public |
| SSL / DNS | `deploy/Caddyfile` + `deploy/setup-vps.sh` (80/443) |
| Rollback | `deploy/rollback.sh` |
| Monitoring | `/api/health/ready` respects `REQUIRE_REDIS`; metrics unchanged |
| Backups | `scripts/backup/verify-restore.sh`, `crontab.example`; guide updated |
| Smoke | Expanded `scripts/smoke-test.mjs` (`npm run staging:smoke`) |
| Verification | `npm run verify:staging` (L.2 gate) |
| AI policy | `docs/AI_BUDGET_POLICY.md`, `.cursor/rules/ai-budget-policy.mdc` |
| Docs | `docs/STAGING_DEPLOYMENT.md`, this report |

---

## Health / Redis behavior (ops change)

When `REQUIRE_REDIS=1` (staging + production compose default), `/api/health/ready` returns **503** if Redis is not up. Mongo remains mandatory. Single-node local-without-Docker still works with Redis optional when unset/`0`.

---

## Staging bring-up

```bash
cp docker/.env.staging.example .env.staging
# set JWT_SECRET (>=32), SITE_URL, VITE_APP_URL

bash deploy/staging-up.sh
npm run staging:smoke
```

Defaults: frontend `:8080`, API `:5001`, mongo `:27018`, redis `:6380`.

---

## AI launch configuration (frozen)

| Item | Value |
|------|-------|
| Paid AI APIs | **OFF** |
| Deterministic career features | **ON** |
| Monthly AI cost | **≈ $0** |

---

## Verification results

```text
npm run verify:staging
→ L.2 staging infrastructure verification: 48 passed, 0 failed
→ Nested verify:production / deployment / redis / queues / security / monitoring / backups: PASS
```

Compose validation (daemon optional):

```text
docker compose -f docker-compose.yml -f docker-compose.staging.yml --env-file .env.staging config
→ COMPOSE_EXIT:0 (config valid)
```

Live container bring-up on this agent host: **Docker daemon not running** — documented as operator step. Once Desktop/daemon is up:

```bash
bash deploy/staging-up.sh
SITE_URL=http://localhost:8080 npm run staging:smoke
```

---

## Known issues / conditions

| Issue | Severity | Notes |
|-------|----------|-------|
| Staging live deploy depends on host Docker | Ops | Structural verify passes without Docker; live smoke requires `staging-up` |
| SMTP blank in example env | Expected | Operator fills before Beta email tests |
| Object storage still defaults to `local` | P1 for Public | Volume is durable in compose; switch to S3/Supabase for multi-host Public |
| Windows native smoke | Use Git Bash/WSL for `.sh` deploy scripts; Node smoke works cross-platform |

---

## Recommendation for L.3

**Proceed to L.3 — Beta Deployment** after:

1. Operator runs `deploy/staging-up.sh` on a Docker host and `staging:smoke` is green  
2. SMTP validated once if invite emails are required for Beta  
3. Feature flag matrix in `.env.staging` reviewed (dual-write OFF)  

No further product development is required for Beta invite readiness beyond ops validation on a real host.

---

## Implementation checklist

### Completed (prior)

- [x] C.6–C.8 Career Intelligence  
- [x] C.8.5A Launch Readiness (165/165)  
- [x] L.1 Production Readiness Audit  
- [x] MVP frozen; AI cost policy established  

### L.2

- [x] Configure production infrastructure (compose + volumes + Redis require)  
- [x] Staging environment tooling (`docker-compose.staging.yml` + scripts)  
- [x] Redis, queues/workers, storage volume, SMTP/CDN env, SSL/DNS (Caddy/VPS)  
- [x] Monitoring readiness (health/metrics + REQUIRE_REDIS)  
- [x] Backups (verify-restore + crontab example)  
- [x] Verification suites (`verify:staging` **48/48 PASS** + nested production verifies)  
- [x] Official AI budget policy (docs + Cursor rule)  
- [ ] Live staging containers green on operator host *(Docker daemon required)*  
- [ ] Live `staging:smoke` PASS on operator host *(after staging-up)*  

### After L.2

- [ ] L.3 Beta (25–50 users)  
- [ ] Fix P0/P1 from Beta only  
- [ ] Public production launch  
