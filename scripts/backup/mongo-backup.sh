#!/usr/bin/env bash
# MongoDB backup (C.7.0.9) — run on host with mongodump installed or via docker compose exec
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-./backups/mongo}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/edurozgaar}"
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/edurozgaar_$TIMESTAMP"
echo "Backing up to $OUT"
mongodump --uri="$MONGO_URI" --out="$OUT"
echo "Backup complete: $OUT"
