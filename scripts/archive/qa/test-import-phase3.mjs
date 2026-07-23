/**
 * Phase 3 admin import verification.
 * Run: node scripts/test-import-phase3.mjs
 * Requires admin@edurozgaar.pk / Admin1234 (run ensureAdminUser.js first).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@edurozgaar.pk';
const ADMIN_PASSWORD = 'Admin1234';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.accessToken || data.token;
}

async function importFile(token, resource, filePath) {
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)]);
  const name = path.basename(filePath);
  form.append('file', blob, name);
  const res = await fetch(`${API}/admin/import/${resource}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const checks = [];
function record(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${name}: ${detail}`);
}

async function main() {
  console.log('Phase 3 Import verification\n');
  let token;
  try {
    token = await login();
    record('Admin login', true, ADMIN_EMAIL);
  } catch (e) {
    record('Admin login', false, e.message);
    process.exit(1);
  }

  const csvPath = path.join(__dirname, 'test-import/sample-jobs.csv');
  const r1 = await importFile(token, 'jobs', csvPath);
  const ok1 = r1.status === 200 && r1.body.imported >= 1;
  record('CSV import (jobs)', ok1, JSON.stringify(r1.body));

  const r1dup = await importFile(token, 'jobs', csvPath);
  const ok1dup = r1dup.status === 200 && r1dup.body.skipped >= 1;
  record('CSV duplicate skip', ok1dup, `skipped=${r1dup.body.skipped}`);

  const jsonPath = path.join(__dirname, 'test-import/sample-scholarships.json');
  const r2 = await importFile(token, 'scholarships', jsonPath);
  const ok2 = r2.status === 200 && r2.body.imported >= 1;
  record('JSON import (scholarships)', ok2, JSON.stringify(r2.body));

  const xlsxPath = path.join(__dirname, 'test-import/sample-admissions.xlsx');
  const r3 = await importFile(token, 'admissions', xlsxPath);
  const ok3 = r3.status === 200 && r3.body.imported >= 1;
  record('Excel import (admissions)', ok3, JSON.stringify(r3.body));

  const r3dup = await importFile(token, 'admissions', xlsxPath);
  const ok3dup = r3dup.status === 200 && r3dup.body.skipped >= 1;
  record('Excel duplicate skip', ok3dup, `skipped=${r3dup.body.skipped}`);

  const passed = checks.filter((c) => c.pass).length;
  console.log(`\nResult: ${passed}/${checks.length} passed`);
  process.exit(passed < checks.length ? 1 : 0);
}

main();
