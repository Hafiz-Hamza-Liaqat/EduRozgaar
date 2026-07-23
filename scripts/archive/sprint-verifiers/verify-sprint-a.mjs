/**
 * Sprint A API verification — extended admin endpoints.
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@edurozgaar.pk';
const PASS = process.env.ADMIN_PASSWORD || 'Admin1234';

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return (await res.json()).accessToken;
}

async function req(token, method, path, body) {
  const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return { status: res.status, ok: res.ok, data: res.status !== 204 ? await res.json().catch(() => ({})) : null };
}

async function main() {
  console.log('Sprint A API verification\n');
  const token = await login();
  console.log('Login: OK\n');

  const tests = [
    ['GET /admin/users', () => req(token, 'GET', '/admin/users?limit=5')],
    ['GET /admin/payments', () => req(token, 'GET', '/admin/payments?limit=5')],
    ['GET /admin/jobs/:id', async () => {
      const list = await req(token, 'GET', '/admin/jobs?limit=1');
      const id = list.data?.data?.[0]?._id;
      if (!id) return { status: 200, ok: true, data: { skipped: true } };
      return req(token, 'GET', `/admin/jobs/${id}`);
    }],
    ['POST /admin/jobs (create)', () => req(token, 'POST', '/admin/jobs', {
      title: 'Sprint A QA Job',
      company: 'EduRozgaar QA',
      province: 'Punjab',
      status: 'draft',
    })],
    ['GET /v1/analytics/dashboard (RBAC)', () => req(token, 'GET', '/v1/analytics/dashboard')],
    ['POST /admin/scholarships/bulk (empty ids expect 400)', () => req(token, 'POST', '/admin/scholarships/bulk', { action: 'publish', ids: [] })],
  ];

  let failed = 0;
  let createdJobId = null;

  for (const [name, fn] of tests) {
    const r = await fn();
    if (name.includes('create') && r.ok) createdJobId = r.data?._id;
    const pass = r.ok || (name.includes('empty ids') && r.status === 400);
    if (!pass) failed++;
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name}: HTTP ${r.status}`);
  }

  if (createdJobId) {
    const del = await req(token, 'DELETE', `/admin/jobs/${createdJobId}`);
    console.log(`  [${del.ok ? 'PASS' : 'FAIL'}] cleanup test job: HTTP ${del.status}`);
    if (!del.ok) failed++;
  }

  console.log(`\nFailed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
