#!/usr/bin/env bash
# Verify a Mongo backup can restore into a temporary directory (dry verification)
# Does NOT overwrite production data.
# Usage: bash scripts/backup/verify-restore.sh ./backups/mongo/edurozgaar_YYYYMMDD_HHMMSS

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_SRC="${1:-}"
if [[ -z "$BACKUP_SRC" || ! -d "$BACKUP_SRC" ]]; then
  echo "Usage: $0 <mongodump-output-dir>"
  exit 1
fi

VERIFY_DIR="${VERIFY_DIR:-$ROOT/backups/restore-verify}"
rm -rf "$VERIFY_DIR"
mkdir -p "$VERIFY_DIR"

echo "Verifying backup structure at $BACKUP_SRC"
find "$BACKUP_SRC" -name "*.bson" | head -5
COUNT=$(find "$BACKUP_SRC" -name "*.bson" | wc -l | tr -d ' ')
if [[ "$COUNT" -lt 1 ]]; then
  echo "No .bson files found — backup invalid"
  exit 1
fi

cp -R "$BACKUP_SRC" "$VERIFY_DIR/copy"
echo "Backup verification OK ($COUNT bson files). Sample copied to $VERIFY_DIR/copy"
echo "Full restore into Docker Mongo:"
echo "  MONGO_URI=mongodb://localhost:27018/edurozgaar_restore ./scripts/backup/mongo-restore.sh $BACKUP_SRC"
