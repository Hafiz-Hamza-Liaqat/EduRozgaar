#!/usr/bin/env node
/**
 * Backup scripts verification (C.7.0.9)
 */
import { existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function exists(p) { return existsSync(join(root, p)); }

for (const f of [
  'scripts/backup/mongo-backup.sh',
  'scripts/backup/mongo-restore.sh',
  'scripts/backup/media-backup.sh',
  'scripts/backup/verify-restore.sh',
  'scripts/backup/crontab.example',
  'docs/BACKUP_GUIDE.md',
  'docs/DISASTER_RECOVERY.md',
]) {
  if (exists(f)) pass(f);
  else fail(f);
}

console.log(`\nBackup verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Backup checks passed.');
