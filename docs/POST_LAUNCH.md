# Production launch checklist (post-deploy operations)

Complete these steps after your site is live at `https://strideto.com`.

## DNS and hosting (one-time)

1. **Buy domain** at your registrar (e.g. `.pk`, `.com`).
2. **Provision VPS** (2 GB RAM minimum): DigitalOcean, Hetzner, Linode, etc.
3. **DNS records** at registrar:
   - `@` → A record → VPS public IP
   - `www` → CNAME → `strideto.com` (or A to same IP)
4. **Run VPS setup**: `sudo bash deploy/setup-vps.sh`
5. **Firewall**: UFW allows only 22, 80, 443 (script configures this).

## SSL

1. Edit [deploy/Caddyfile](../deploy/Caddyfile) — replace `strideto.com` with your domain.
2. `sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy`
3. Verify: `https://strideto.com` loads with valid certificate.

## Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://strideto.com`
3. Verify ownership (DNS TXT record or HTML file).
4. Submit sitemap: `https://strideto.com/sitemap.xml`
5. Request indexing for homepage and key pages (`/jobs`, `/scholarships`).

## Bing Webmaster Tools

1. [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site and verify.
3. Submit sitemap URL.

## Uptime monitoring

1. [UptimeRobot](https://uptimerobot.com) (free): monitor `https://strideto.com/api/health` every 5 minutes.
2. Alert via email when down.

## Backups

1. **MongoDB Atlas** (recommended): enable automated backups on cluster.
2. **Self-hosted**: cron daily backup:
   ```bash
   0 3 * * * /path/to/Strideto/scripts/backup/mongo-backup.sh
   ```
3. Copy backups off-server (S3, Google Drive, etc.).

## Optional

- **Google Analytics 4**: add measurement ID to frontend if desired.
- **Sentry**: error tracking for API and SPA.
- **Social**: confirm `@Strideto` handle or update [client/src/seo/config.js](../client/src/seo/config.js).
- **OG image**: ensure `client/public/og-default.png` exists (1200×630) for social previews.

## Verify after launch

```bash
SITE_URL=https://strideto.com node scripts/smoke-test.mjs
```

Manual checks:

- Register and login
- Forgot password (requires MAIL_* env vars)
- Admin panel at `/admin` with secure credentials only
- View source on `/jobs` — meta tags and JSON-LD present
