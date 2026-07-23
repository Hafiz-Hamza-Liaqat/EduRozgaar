#!/usr/bin/env bash
# Daily MongoDB backup (run via cron on VPS).
# Usage: bash scripts/backup-mongodb.sh
# Cron example: 0 3 * * * /path/to/EduRozgaar/scripts/backup-mongodb.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/mongodb}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/edurozgaar_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "==> Backing up MongoDB to $OUT"
docker compose exec -T mongodb mongodump --db edurozgaar --archive --gzip > "$OUT.gz"

echo "✅ Backup saved: $OUT.gz"

# Keep last 14 days
find "$BACKUP_DIR" -name 'edurozgaar_*.gz' -mtime +14 -delete 2>/dev/null || true
