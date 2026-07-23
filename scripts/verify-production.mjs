#!/usr/bin/env node
/**
 * Master production verification suite (C.7.0.9)
 */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  'verify:deployment',
  'verify:redis',
  'verify:queues',
  'verify:security',
  'verify:monitoring',
  'verify:backups',
  'verify:performance',
  'verify:integration',
];

const failures = [];
let passed = 0;

for (const script of suites) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root, encoding: 'utf8', shell: true,
  });
  if (r.status === 0) {
    passed += 1;
    console.log(`✓ ${script}`);
  } else {
    failures.push(`${script}: ${(r.stdout || r.stderr || '').split('\n').slice(-3).join(' ').trim()}`);
    console.error(`✗ ${script}`);
  }
}

console.log(`\nProduction verification: ${passed}/${suites.length} suites passed`);
if (failures.length) {
  failures.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}
console.log('Enterprise production checks passed.');
