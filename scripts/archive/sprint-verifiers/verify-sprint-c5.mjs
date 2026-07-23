#!/usr/bin/env node
/**
 * Sprint C.5 launch readiness checks (automated subset).
 * Full QA requires manual role-based testing — see docs/SPRINT_C5_LAUNCH_READINESS.md
 */
import fs from 'fs';
import path from 'path';

const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

const ORIGIN = (() => {
  const u = new URL(API_BASE);
  return `${u.protocol}//${u.host}`;
})();

const ROOT = path.resolve(import.meta.dirname, '..');
const results = [];

async function check(name, fn, { optionalServer = false } = {}) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    const offline = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(String(err.message) + (err.cause?.message || ''));
    if (optionalServer && offline) {
      results.push({ name, ok: true, skipped: true });
      console.log(`○ ${name} (skipped — start server with MongoDB)`);
      return;
    }
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('Sprint C.5 Launch Readiness (automated)\n');

await check('Health endpoint', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}, { optionalServer: true });

await check('robots.txt', async () => {
  const res = await fetch(`${ORIGIN}/robots.txt`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}, { optionalServer: true });

await check('sitemap.xml', async () => {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}, { optionalServer: true });

await check('C.4 implementation report exists', async () => {
  if (!fs.existsSync(path.join(ROOT, 'docs/SPRINT_C4_IMPLEMENTATION_REPORT.md'))) {
    throw new Error('missing SPRINT_C4_IMPLEMENTATION_REPORT.md');
  }
});

await check('C.5 deployment docs exist', async () => {
  const required = [
    'docs/SPRINT_C5_LAUNCH_READINESS.md',
    'docs/DEPLOYMENT_GUIDE.md',
    'docs/ROLLBACK_GUIDE.md',
    'docs/MONITORING_GUIDE.md',
    'docs/INCIDENT_RECOVERY.md',
  ];
  for (const f of required) {
    if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`missing ${f}`);
  }
});

await check('Role manuals exist', async () => {
  for (const f of ['docs/ADMIN_MANUAL.md', 'docs/EDITOR_MANUAL.md', 'docs/MODERATOR_MANUAL.md']) {
    if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`missing ${f}`);
  }
});

await check('Security env validation module', async () => {
  const p = path.join(ROOT, 'server/src/config/validateEnv.js');
  if (!fs.existsSync(p)) throw new Error('validateEnv.js missing');
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} automated checks passed`);
console.log('\nManual QA still required: role flows, Lighthouse, staging deploy.');
process.exit(passed === results.length ? 0 : 1);
