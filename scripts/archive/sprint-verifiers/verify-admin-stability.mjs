/**
 * Verify admin endpoints return 200 (no 429) after stability fixes.
 * Run: node scripts/verify-admin-stability.mjs
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@edurozgaar.pk';
const PASS = process.env.ADMIN_PASSWORD || 'Admin1234';

const ENDPOINTS = [
  { name: 'permissions', method: 'GET', path: '/admin/permissions' },
  { name: 'executive-dashboard', method: 'GET', path: '/admin/executive-dashboard' },
  { name: 'moderation-queues', method: 'GET', path: '/admin/moderation/queues' },
  { name: 'audit-logs', method: 'GET', path: '/admin/audit-logs?limit=5' },
  { name: 'jobs', method: 'GET', path: '/admin/jobs?limit=5' },
  { name: 'scholarships', method: 'GET', path: '/admin/scholarships?limit=5' },
  { name: 'growth-dashboard', method: 'GET', path: '/admin/growth-dashboard' },
  { name: 'import', method: 'GET', path: '/admin/import' },
  { name: 'ai-generate', method: 'POST', path: '/admin/jobs/generate', body: { title: 'QA Test Engineer', organization: 'EduRozgaar' } },
];

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.accessToken;
}

async function check(token, ep) {
  const opts = {
    method: ep.method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (ep.body) opts.body = JSON.stringify(ep.body);
  const res = await fetch(`${BASE}${ep.path}`, opts);
  return { name: ep.name, status: res.status, ok: res.ok };
}

async function main() {
  console.log('Admin stability verification\n');
  const token = await login();
  console.log('Login: 200 OK\n');

  const results = [];
  for (const ep of ENDPOINTS) {
    results.push(await check(token, ep));
  }
  // Simulate rapid navigation burst (audit page used to loop)
  for (let i = 0; i < 5; i++) {
    results.push(await check(token, { name: `audit-burst-${i}`, method: 'GET', path: '/admin/audit-logs?limit=5' }));
  }

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) failed++;
    console.log(`  [${mark}] ${r.name}: HTTP ${r.status}`);
  }

  console.log(`\nTotal: ${results.length}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
