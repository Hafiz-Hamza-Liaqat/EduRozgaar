#!/usr/bin/env bash
# Rollback to a previous compose image set (L.2)
# Usage:
#   PREVIOUS_TAG=abc123 bash deploy/rollback.sh
#   bash deploy/rollback.sh          # re-pulls/redeploys current .env images
#
# Prefer tagging images before release:
#   docker compose build
#   docker tag …:latest …:$GIT_SHA

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env"
  exit 1
fi

echo "==> Rolling back / redeploying stack from .env"
if [[ -n "${PREVIOUS_TAG:-}" ]]; then
  echo "Note: ensure images tagged with PREVIOUS_TAG=$PREVIOUS_TAG exist locally or in registry."
fi

docker compose up -d --no-build || docker compose up -d

echo "==> Health check"
sleep 5
curl -sf "http://127.0.0.1:${FRONTEND_PORT:-80}/api/health/ready" || \
  curl -sf "http://127.0.0.1:5000/api/health/ready" || \
  echo "Warn: ready probe failed — check docker compose ps / logs"

echo "Rollback procedure finished. If unhealthy, restore Mongo via scripts/backup/mongo-restore.sh"
