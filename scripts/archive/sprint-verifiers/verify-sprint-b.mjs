/**
 * Sprint B API verification — content CMS endpoints.
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
  const data = res.status !== 204 ? await res.json().catch(() => ({})) : null;
  return { status: res.status, ok: res.ok, data };
}

const LIST_ENDPOINTS = [
  '/admin/blogs?limit=5',
  '/admin/internships?limit=5',
  '/admin/universities?limit=5',
  '/admin/intl-scholarships?limit=5',
  '/admin/foreign-studies?limit=5',
  '/admin/career-articles?limit=5',
  '/admin/companies?limit=5',
  '/admin/employers?limit=5',
  '/admin/notifications?limit=5',
  '/admin/exams',
  '/admin/mcqs',
  '/admin/quizzes',
  '/admin/past-papers',
];

const EXPORT_RESOURCES = ['blogs', 'companies', 'internships', 'intl-scholarships', 'universities', 'foreign-studies', 'career-articles'];

async function main() {
  console.log('Sprint B API verification\n');
  const token = await login();
  console.log('Login: OK\n');

  let failed = 0;

  for (const path of LIST_ENDPOINTS) {
    const r = await req(token, 'GET', path);
    const pass = r.ok && r.status === 200;
    if (!pass) failed++;
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] GET ${path}: HTTP ${r.status}`);
  }

  const adSlots = await req(token, 'GET', '/monetization/admin/ad-slots');
  const adPass = adSlots.ok && adSlots.status === 200;
  if (!adPass) failed++;
  console.log(`  [${adPass ? 'PASS' : 'FAIL'}] GET /monetization/admin/ad-slots: HTTP ${adSlots.status}`);

  for (const resource of EXPORT_RESOURCES) {
    const r = await req(token, 'GET', `/admin/export/${resource}?format=csv`);
    const pass = r.ok && r.status === 200;
    if (!pass) failed++;
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] GET /admin/export/${resource}: HTTP ${r.status}`);
  }

  const createTests = [
    ['POST /admin/blogs', '/admin/blogs', { title: 'Sprint B QA Blog', status: 'draft' }],
    ['POST /admin/internships', '/admin/internships', { title: 'Sprint B QA Internship', organization: 'QA Corp', status: 'draft' }],
    ['POST /admin/companies', '/admin/companies', { name: 'Sprint B QA Company', status: 'draft' }],
    ['POST /admin/career-articles', '/admin/career-articles', { title: 'Sprint B QA Career', status: 'draft' }],
    ['POST /admin/notifications', '/admin/notifications', { title: 'QA Alert', message: 'Sprint B test', audience: 'all', channel: 'in_app' }],
  ];

  const created = [];
  for (const [name, path, body] of createTests) {
    const r = await req(token, 'POST', path, body);
    const pass = r.ok && (r.status === 201 || r.status === 200);
    if (!pass) failed++;
    else if (r.data?._id) created.push({ path, id: r.data._id });
    console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${name}: HTTP ${r.status}`);
  }

  for (const { path, id } of created) {
    const del = await req(token, 'DELETE', `${path}/${id}`);
    console.log(`  [${del.ok ? 'PASS' : 'FAIL'}] cleanup ${path}/${id}: HTTP ${del.status}`);
    if (!del.ok) failed++;
  }

  const bulk = await req(token, 'POST', '/admin/blogs/bulk', { action: 'publish', ids: [] });
  const bulkPass = bulk.status === 400;
  if (!bulkPass) failed++;
  console.log(`  [${bulkPass ? 'PASS' : 'FAIL'}] POST /admin/blogs/bulk empty ids: HTTP ${bulk.status}`);

  console.log(`\nFailed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
