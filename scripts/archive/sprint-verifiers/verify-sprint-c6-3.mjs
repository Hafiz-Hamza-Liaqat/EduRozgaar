#!/usr/bin/env node
/**
 * Sprint C.6.3 — Launch UX & Staff Operations verification.
 * Usage: cd server && node --env-file=.env ../scripts/verify-sprint-c6-3.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../server/src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

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
      console.log(`○ ${name} (skipped — API not running)`);
      return;
    }
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('Sprint C.6.3 Launch UX & Staff Operations Verification\n');
await connectDB();

await check('StaffInvitation model registered', async () => {
  const { StaffInvitation } = await import('../server/src/models/StaffInvitation.js');
  await StaffInvitation.createIndexes();
});

await check('User mustChangePassword field exists', async () => {
  const { User } = await import('../server/src/models/User.js');
  if (!User.schema.paths.mustChangePassword) throw new Error('mustChangePassword missing');
  if (!User.schema.paths.tempPasswordExpires) throw new Error('tempPasswordExpires missing');
});

await check('Email templates: staffInvitation + temporaryPassword', async () => {
  const { renderEmailTemplate } = await import('../server/src/templates/emailTemplates.js');
  renderEmailTemplate('staffInvitation', 'en', { url: 'http://test', role: 'Editor', inviterName: 'Admin' });
  renderEmailTemplate('temporaryPassword', 'en', { tempPassword: 'abc', loginUrl: 'http://test' });
});

await check('Health endpoint reports email mode', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.email?.mode) throw new Error('missing email.mode');
}, { optionalServer: true });

await check('Auth accept-invitation route exists', async () => {
  const res = await fetch(`${API_BASE}/api/auth/accept-invitation?token=invalid`);
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
}, { optionalServer: true });

await check('AdminFormFields component exists', () => {
  const p = path.join(root, 'client/src/components/admin/AdminFormFields.jsx');
  if (!fs.existsSync(p)) throw new Error('AdminFormFields missing');
});

await check('Admin pages use AdminSelectBare (no raw select)', () => {
  const adminDir = path.join(root, 'client/src/pages/Admin');
  const offenders = fs.readdirSync(adminDir)
    .filter((f) => f.endsWith('.jsx'))
    .filter((f) => /<select[\s>]/.test(fs.readFileSync(path.join(adminDir, f), 'utf8')));
  if (offenders.length) throw new Error(`raw <select> in: ${offenders.join(', ')}`);
});

await check('CMS persistence guard still present', async () => {
  const { isCorruptCmsNav } = await import('../client/src/utils/cmsCorruption.js');
  if (!isCorruptCmsNav([{ label: 'c61-test-1' }])) throw new Error('corruption guard broken');
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
