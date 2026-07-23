# Security Checklist

## Authentication & Authorization

- [ ] `JWT_SECRET` is 32+ random bytes, never committed
- [ ] Refresh tokens stored in Redis with TTL (`tokenStore.js`)
- [ ] RBAC enforced on admin routes (`AdminRouteGuard` + server middleware)
- [ ] Employer vs admin vs public routes separated

## Transport & Headers

- [ ] TLS terminated at proxy (HTTPS only in production)
- [ ] Helmet CSP configured (`server/src/config/security.js`)
- [ ] `X-Content-Type-Options`, `X-Frame-Options` on nginx + API

## Input & Injection

- [ ] `express-mongo-sanitize` on all JSON bodies
- [ ] `sanitize-html` on user HTML content
- [ ] File upload validation (`fileValidation.js`, MIME checks, dangerous filename rejection)

## Rate Limiting

- [ ] Global API limiter (`apiLimiter`)
- [ ] Stricter limits on auth, upload, contact, search (`rateLimit.js`)

## CORS

- [ ] Production whitelist via `SITE_URL` / `FRONTEND_URL` (`cors.js`)

## CSRF

- SPA uses Bearer JWT for API; refresh via httpOnly cookie pattern. CSRF not required for stateless API calls with Authorization header. Document cookie settings if adding cookie-based sessions.

## Secrets

- [ ] `.env` in `.gitignore`
- [ ] `validateProductionEnv()` runs on startup
- [ ] Stripe webhook uses raw body + signature verification

## Storage

- [ ] S3/Supabase buckets not public-write
- [ ] Signed URLs for private assets when needed (`S3StorageProvider.getSignedUrl`)

## Monitoring

- [ ] `SENTRY_DSN` for error tracking (optional)
- [ ] Review admin audit logs regularly

Run: `npm run verify:security`
