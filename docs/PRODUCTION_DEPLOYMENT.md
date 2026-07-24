# Production Deployment Guide

**Sprint C.7.0.9** — Deploy Strideto with Docker Compose.

## Prerequisites

- Docker 24+ and Docker Compose v2
- Domain with TLS (terminate at load balancer or reverse proxy)
- Secrets: `JWT_SECRET` (32+ chars), SMTP, optional Stripe/Cloudinary/S3

## Quick Start

```bash
cp docker/.env.production.example .env
# Edit .env — set JWT_SECRET, SITE_URL, VITE_APP_URL, SMTP

docker compose up -d --build
```

Services:

| Service | Role |
|---------|------|
| `mongodb` | Primary database |
| `redis` | Shared cache, sessions, queue locks |
| `backend` | API (port 5000 internal) |
| `worker` | Background jobs (email, publish, reminders) |
| `frontend` | nginx + static client (port 80) |

## Health Checks

- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready` (Mongo + Redis + queue)
- Extended: `GET /api/health`
- Metrics: `GET /api/metrics` or `?format=prometheus`

## Production Settings

- API sets `DISABLE_QUEUE_CRON=1` — worker container processes jobs
- Set `CMS_SEED_ON_START=0` after first deploy
- Use Atlas: set `MONGO_URI` in `.env`
- External Redis: set `REDIS_URL`

## TLS / Reverse Proxy

Terminate TLS at your load balancer or add a reverse proxy in front of `frontend:80`. Forward `X-Forwarded-Proto` and `X-Forwarded-For` (nginx config already passes these to API).

## Verify Before Go-Live

```bash
npm run verify:production
```

## Rollback

```bash
docker compose down
# Restore Mongo from backup (see BACKUP_GUIDE.md)
docker compose up -d
```
