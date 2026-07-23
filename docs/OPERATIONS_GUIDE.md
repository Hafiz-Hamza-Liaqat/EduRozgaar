# Operations Guide

## Daily Operations

| Task | Command / Endpoint |
|------|-------------------|
| View logs | `docker compose logs -f backend worker` |
| Queue status | `GET /api/admin/queue/status` |
| Platform health | `GET /api/admin/platform-health` |
| Metrics | `GET /api/metrics` |
| Process queue manually | `POST /api/admin/queue/process` |
| Retry dead jobs | `POST /api/admin/queue/retry` |

## Environment

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

## Worker

The `worker` service runs `node src/worker.js` with `WORKER_ONLY=1`. Poll interval: `WORKER_POLL_INTERVAL_MS` (default 15s).

Disable API-side queue cron when worker is running (`DISABLE_QUEUE_CRON=1` in compose).

## Cache

All domain caches use `server/src/config/cache.js` → Redis (`REDIS_URL`) with in-memory L1 fallback.

Invalidate on content change via `contentIntegration.js` (search, dynamic, analytics caches).

## Graceful Shutdown

API handles `SIGTERM`/`SIGINT`: stops cron, closes HTTP, quits Redis, disconnects Mongo (30s timeout).

## Scaling

- **API**: scale `backend` replicas; keep `DISABLE_QUEUE_CRON=1` on all API instances
- **Worker**: scale `worker` replicas (Redis lock prevents duplicate queue processing)
- **Redis/Mongo**: use managed services for production

See [SCALING_GUIDE.md](./SCALING_GUIDE.md).

## Cron Toggles

| Variable | Effect |
|----------|--------|
| `DISABLE_SCRAPER_CRON=1` | Disable government job scraper |
| `DISABLE_QUEUE_CRON=1` | Disable in-process queue (use worker) |
| `DISABLE_REMINDER_CRON=1` | Disable deadline reminders |
