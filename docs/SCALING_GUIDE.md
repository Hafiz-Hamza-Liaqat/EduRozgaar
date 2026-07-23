# Scaling Guide

## Horizontal Scaling

### API (`backend`)

- Run multiple replicas behind a load balancer
- Set `DISABLE_QUEUE_CRON=1` on all API instances
- Shared `REDIS_URL` and `MONGO_URI` required
- Stateless except in-process L1 cache (short TTL, safe)

### Worker (`worker`)

- Scale workers for higher job throughput
- Redis distributed lock (`queueLock.js`) prevents duplicate processing
- Mongo `BackgroundJob` collection is the queue store

### Frontend (`frontend`)

- Static nginx — scale freely; no session state
- CDN recommended for `assets/` and prerendered pages

## Vertical Scaling

| Bottleneck | Action |
|------------|--------|
| Search latency | Redis cache, Mongo indexes on `SearchDocument` |
| Analytics dashboards | `ANALYTICS_CACHE_TTL_MS`, read replicas |
| Media uploads | S3/Supabase + CDN |
| Large page layouts | Dynamic block cache, pagination |

## Database

- MongoDB Atlas M10+ for production
- Connection pool: `MONGO_MAX_POOL_SIZE` (default 20)
- Indexes: see model files; run `db.collection.getIndexes()` audit quarterly

## Redis

- Single instance sufficient for most loads
- Redis Cluster for >100k req/min or HA requirements

## Load Testing

```bash
npm run load-test -- http://localhost:5000 20 200
```

Target: 95%+ success rate, p95 < 500ms on health endpoints.
