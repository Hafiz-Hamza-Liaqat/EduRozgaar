#!/usr/bin/env bash
# Stop staging stack (keeps volumes by default)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-.env.staging}"

docker compose \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  --env-file "$ENV_FILE" \
  down

echo "Staging stopped (volumes retained). To wipe volumes: docker compose ... down -v"
