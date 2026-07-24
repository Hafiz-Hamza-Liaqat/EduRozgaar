#!/usr/bin/env bash
# Build and start Strideto production stack.
# Requires .env at repo root (copy from .env.template).
# Usage: bash deploy/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "❌ Missing .env — copy .env.template to .env and set JWT_SECRET, SITE_URL, VITE_APP_URL"
  exit 1
fi

# shellcheck disable=SC1091
source .env

if [[ -z "${JWT_SECRET:-}" ]] || [[ "${#JWT_SECRET}" -lt 32 ]]; then
  echo "❌ JWT_SECRET must be at least 32 characters. Generate: openssl rand -hex 32"
  exit 1
fi

if [[ -z "${SITE_URL:-}" ]] || [[ -z "${VITE_APP_URL:-}" ]]; then
  echo "❌ Set SITE_URL and VITE_APP_URL in .env"
  exit 1
fi

echo "==> Building and starting containers..."
docker compose up -d --build

echo ""
echo "✅ Stack running. Frontend on port ${FRONTEND_PORT:-80}"
echo ""
echo "Next:"
echo "  - Configure Caddy: edit deploy/Caddyfile, copy to /etc/caddy/Caddyfile, reload caddy"
echo "  - Seed DB: bash scripts/production-setup.sh"
echo "  - Smoke test: SITE_URL=https://strideto.com npm run staging:smoke"
echo "  - Staging stack: bash deploy/staging-up.sh (see docs/STAGING_DEPLOYMENT.md)"
echo "  - Rollback: bash deploy/rollback.sh"
