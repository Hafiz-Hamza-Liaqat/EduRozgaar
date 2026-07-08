#!/usr/bin/env bash
# Seed production database and create admin user inside Docker backend container.
# Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running.
# Usage: bash scripts/production-setup.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "❌ Missing .env"
  exit 1
fi

# shellcheck disable=SC1091
source .env

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yourdomain.com}"
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "❌ Set ADMIN_PASSWORD in .env before seeding production"
  exit 1
fi

echo "==> Seeding database..."
docker compose exec -T backend node src/seed/index.js

echo "==> Creating admin user: $ADMIN_EMAIL"
docker compose exec -T -e NODE_ENV=production -e ADMIN_EMAIL="$ADMIN_EMAIL" -e ADMIN_PASSWORD="$ADMIN_PASSWORD" backend node src/scripts/ensureAdminUser.js

echo ""
echo "✅ Production setup complete."
echo "   Admin login: $ADMIN_EMAIL"
echo "   Run smoke test: SITE_URL=\$SITE_URL node scripts/smoke-test.mjs"
