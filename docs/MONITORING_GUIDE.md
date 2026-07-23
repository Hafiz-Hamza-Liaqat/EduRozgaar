# Monitoring Guide

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/live` | Process alive (load balancer) |
| `GET /api/health/ready` | Mongo + Redis + queue health |
| `GET /api/health` | Extended service status |
| `GET /api/metrics` | JSON metrics snapshot |
| `GET /api/metrics?format=prometheus` | Prometheus text format |
| `GET /api/admin/platform-health` | Full platform (auth required) |

## Metrics Collected

- HTTP request count, error count, latency p50/p95
- Process memory (RSS, heap)
- Mongo connection state
- Redis ping latency
- Cache L1 size + Redis stats
- Queue pending/dead counts

## Logging

Structured JSON logs via `server/src/utils/logger.js`. Set `LOG_LEVEL=debug|info|warn|error`.

Request log: method, path, status, duration ms.

## Alerts (recommended)

| Condition | Action |
|-----------|--------|
| `/health/ready` 503 | Page on-call |
| Queue `dead24h` > 10 | Investigate failed jobs |
| Memory RSS > 80% limit | Scale or restart |
| Redis down in production | Fix Redis (cache degradation) |

## Sentry

Set `SENTRY_DSN` and install `@sentry/node` for full error tracking.

Run: `npm run verify:monitoring`
