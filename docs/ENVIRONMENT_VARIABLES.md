# Environment Variables

## Required (production)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Signing key (32+ chars) |
| `MONGO_URI` | MongoDB connection string |
| `SITE_URL` | Public site URL (CORS, emails, links) |
| `VITE_APP_URL` | Client build-time site URL |

## Infrastructure

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | — | Redis connection (required for multi-instance) |
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | `production` in deploy |
| `LOG_LEVEL` | `info` | Log verbosity |
| `SHUTDOWN_TIMEOUT_MS` | `30000` | Graceful shutdown timeout |

## Worker / Cron

| Variable | Default | Description |
|----------|---------|-------------|
| `DISABLE_QUEUE_CRON` | `0` | Set `1` when worker container runs queue |
| `DISABLE_REMINDER_CRON` | `0` | Disable daily reminders |
| `DISABLE_SCRAPER_CRON` | `0` | Disable job scraper |
| `WORKER_ONLY` | `0` | Set `1` in worker container |
| `WORKER_POLL_INTERVAL_MS` | `15000` | Worker poll interval |

## Cache TTLs (ms)

| Variable | Default |
|----------|---------|
| `SEARCH_CACHE_TTL_MS` | from shared config |
| `ANALYTICS_CACHE_TTL_MS` | `120000` |
| `DYNAMIC_CACHE_TTL_MS` | `60000` |

## MongoDB Pool

| Variable | Default |
|----------|---------|
| `MONGO_MAX_POOL_SIZE` | `20` |
| `MONGO_MIN_POOL_SIZE` | `2` |

## Media Storage

| Variable | Description |
|----------|-------------|
| `MEDIA_STORAGE_PROVIDER` | `local` \| `s3` \| `supabase` |
| `AWS_S3_BUCKET` | S3 bucket |
| `AWS_ACCESS_KEY_ID` | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_CDN_URL` | Optional CDN base URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_STORAGE_BUCKET` | Bucket name |

## Email / Payments / Legacy

See `.env.template` for `MAIL_*`, `STRIPE_*`, `CLOUDINARY_*`, `SENTRY_DSN`.

## Client (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base (`/api` when proxied) |
| `VITE_APP_URL` | Canonical public URL |
