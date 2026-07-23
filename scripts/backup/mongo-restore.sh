#!/usr/bin/env bash
# MongoDB restore (C.7.0.9)
set -euo pipefail
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_directory>"
  exit 1
fi
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/edurozgaar}"
mongorestore --uri="$MONGO_URI" --drop "$1"
echo "Restore complete from $1"
