#!/usr/bin/env node
/**
 * Sprint C.1 verification — CMS foundation smoke tests.
 * Usage: node scripts/verify-sprint-c1.mjs [--base http://localhost:5000/api]
 */
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000/api';

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  return { res, json: res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => null) : null };
}

async function main() {
  console.log(`Verifying Sprint C.1 CMS at ${BASE}\n`);

  await check('Public homepage endpoint', async () => {
    const { res } = await get('/cms/site/homepage?locale=en');
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await check('Public navigation endpoint', async () => {
    const { res } = await get('/cms/site/navigation?locale=en&placement=header');
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  });

  await check('Public banners endpoint', async () => {
    const { res, json } = await get('/cms/site/banners?locale=en');
    if (res.status !== 200) throw new Error(`status ${res.status}`);
    if (!Array.isArray(json?.data)) throw new Error('expected data array');
  });

  await check('Public static page 404 for missing slug', async () => {
    const { res } = await get('/cms/site/pages/nonexistent-slug-xyz?locale=en');
    if (res.status !== 404) throw new Error(`expected 404, got ${res.status}`);
  });

  await check('Admin CMS routes require auth', async () => {
    const { res } = await get('/admin/cms/homepage?locale=en');
    if (res.status !== 401 && res.status !== 403) throw new Error(`expected 401/403, got ${res.status}`);
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
