# Staging Deployment Guide (L.2)

## Purpose

Deploy an isolated staging stack that mirrors production topology (Mongo, Redis, API, worker, frontend) for smoke tests and Beta preparation.

## Prerequisites

- Docker Engine + Compose plugin
- Secrets: generate `JWT_SECRET` with `openssl rand -hex 32`
- Optional: SMTP credentials for email validation

## Quick start

```bash
cp docker/.env.staging.example .env.staging
# Edit JWT_SECRET, SITE_URL, VITE_APP_URL, MAIL_* as needed

bash deploy/staging-up.sh
# Windows Git Bash / WSL preferred for shell scripts

npm run staging:smoke
# or: set SITE_URL=http://localhost:8080&& npm run staging:smoke
```

Stop:

```bash
bash deploy/staging-down.sh
```

## Ports (defaults)

| Service | Host port |
|---------|-----------|
| Frontend | 8080 |
| API (direct) | 5001 |
| Mongo | 27018 |
| Redis | 6380 |

## What is verified

| Area | How |
|------|-----|
| Backend | `/api/health/live`, `/api/health/ready` (`REQUIRE_REDIS=1`) |
| Frontend | Homepage via nginx |
| Database | Ready probe mongo=up |
| Redis | Ready probe redis=up |
| Queues | Worker container + queue stats in health |
| Media | Named volume `media_uploads` (durable across restarts) |
| Auth | Configured JWT; manual login in browser QA |
| Search | Smoke hits `/api/search` |
| Analytics | Metrics endpoint; background jobs via worker |

## SSL / DNS (staging hostname)

1. Point `staging.yourdomain.com` DNS A/AAAA to the VPS  
2. Uncomment staging block in `deploy/Caddyfile`  
3. `sudo systemctl reload caddy`  

## Durable media

- Default staging: `MEDIA_STORAGE_PROVIDER=local` on Docker volume  
- Near-prod parity: set `s3` or `supabase` + CDN URL in `.env.staging`

## Rollback

```bash
bash deploy/rollback.sh
# Or restore Mongo: ./scripts/backup/mongo-restore.sh <backup-dir>
```

## Verification suites

```bash
npm run verify:staging          # L.2 structural + nested ops verifies
npm run verify:production       # platform production gate
npm run verify:career-launch-readiness  # career product gate (optional before Beta)
```
