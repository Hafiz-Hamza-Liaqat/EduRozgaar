#!/usr/bin/env bash
# Media/uploads backup (C.7.0.9)
set -euo pipefail
UPLOADS="${UPLOADS_PATH:-./server/uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups/media}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
ARCHIVE="$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$UPLOADS")" "$(basename "$UPLOADS")"
echo "Media backup: $ARCHIVE"
