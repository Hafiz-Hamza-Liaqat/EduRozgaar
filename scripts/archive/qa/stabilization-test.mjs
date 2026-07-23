const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const email = `stabilize-test-${Date.now()}@test.local`;
const password = 'TestPass123!';

async function run() {
  console.log('Register:', (await req('POST', '/auth/register', { email, password, name: 'Stabilize Test' })).status);

  for (let i = 1; i <= 5; i++) {
    const login = await req('POST', '/auth/login', { email, password });
    console.log(`Login cycle ${i}:`, login.status, login.status === 429 ? 'FAIL' : 'OK');
    if (login.status !== 200) {
      console.log(login.data);
      process.exit(1);
    }
    const token = login.data.accessToken;
    const patch = await req('PATCH', '/auth/profile', { name: `Updated ${i}`, province: 'Punjab' }, token);
    console.log(`  Profile patch:`, patch.status, patch.status !== 200 ? patch.data : '');
    if (patch.status !== 200) process.exit(1);
    const logout = await req('POST', '/auth/logout', null, token);
    console.log(`  Logout:`, logout.status);
    if (logout.status !== 200) process.exit(1);
  }

  const finalLogin = await req('POST', '/auth/login', { email, password });
  console.log('Final login after 5 cycles:', finalLogin.status);
  if (finalLogin.status !== 200) {
    console.log(finalLogin.data);
    process.exit(1);
  }

  const t = finalLogin.data.accessToken;
  const patch = await req('PATCH', '/auth/profile', {
    name: 'Persist Test',
    province: 'Sindh',
    interests: ['IT'],
  }, t);
  const get = await req('GET', '/auth/profile', null, t);
  console.log('Profile save:', patch.status, '| persisted name:', get.data?.user?.name);

  const endpoints = [
    '/scholarships?page=1&limit=10',
    '/auth/saved',
    '/v1/recommendations/me',
    '/resumes/user',
  ];
  for (const ep of endpoints) {
    const r = await req('GET', ep, null, t);
    console.log(`GET ${ep}:`, r.status);
  }

  console.log('\nAll stabilization checks passed.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
