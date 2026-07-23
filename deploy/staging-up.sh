#!/usr/bin/env bash
# Bring up EduRozgaar staging stack (L.2)
# Usage: bash deploy/staging-up.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy docker/.env.staging.example to .env.staging and set JWT_SECRET"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "$ENV_FILE"
set +a

if [[ -z "${JWT_SECRET:-}" || ${#JWT_SECRET} -lt 32 ]]; then
  echo "JWT_SECRET must be >= 32 characters"
  exit 1
fi
if [[ -z "${SITE_URL:-}" || -z "${VITE_APP_URL:-}" ]]; then
  echo "Set SITE_URL and VITE_APP_URL in $ENV_FILE"
  exit 1
fi

echo "==> Starting staging stack (project: edurozgaar-staging)..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  --env-file "$ENV_FILE" \
  up -d --build

echo ""
echo "Staging is starting."
echo "  Frontend: ${SITE_URL:-http://localhost:8080}"
echo "  API direct: http://localhost:${STAGING_API_PORT:-5001}/api/health/ready"
echo ""
echo "Next:"
echo "  npm run staging:smoke"
echo "  bash deploy/staging-down.sh   # stop"
