#!/usr/bin/env node
/**
 * Staging / production smoke tests (L.2).
 * Usage:
 *   SITE_URL=http://localhost:8080 npm run staging:smoke
 *   SITE_URL=https://staging.example.com node scripts/smoke-test.mjs
 */
const base = (process.env.SITE_URL || process.env.VITE_APP_URL || 'http://localhost:8080').replace(/\/$/, '');
const apiBase = process.env.API_URL
  ? process.env.API_URL.replace(/\/$/, '')
  : `${base}/api`;

const checks = [
  { name: 'Homepage', url: `${base}/`, expectStatus: 200, expectBody: /EduRozgaar|edurozgaar|root|<!DOCTYPE/i },
  { name: 'Health live', url: `${apiBase}/health/live`, expectStatus: 200, expectBody: /"live"\s*:\s*true/ },
  { name: 'Health ready', url: `${apiBase}/health/ready`, expectStatus: 200, expectBody: /"status"\s*:\s*"ready"/, jsonAssert: assertReady },
  { name: 'Health extended', url: `${apiBase}/health`, expectStatus: 200 },
  { name: 'Metrics', url: `${apiBase}/metrics`, expectStatus: 200 },
  { name: 'Sitemap', url: `${base}/sitemap.xml`, expectStatus: 200, expectBody: /<urlset|<sitemapindex/i },
  { name: 'Robots', url: `${base}/robots.txt`, expectStatus: 200, expectBody: /User-agent|Sitemap/i },
  { name: 'Jobs page', url: `${base}/jobs`, expectStatus: 200 },
  { name: 'Search API', url: `${apiBase}/search?q=job&limit=5`, expectStatus: [200, 400] },
];

function assertReady(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return 'health/ready is not JSON';
  }
  if (data.status !== 'ready') return `not ready: ${data.status}`;
  if (data.mongo?.status && data.mongo.status !== 'up') return `mongo ${data.mongo.status}`;
  if (data.requireRedis && data.redis?.status !== 'up') return `redis required but ${data.redis?.status}`;
  return null;
}

let failed = 0;

async function runCheck({ name, url, expectStatus, expectBody, jsonAssert }) {
  const expected = Array.isArray(expectStatus) ? expectStatus : [expectStatus];
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    if (!expected.includes(res.status)) {
      console.error(`FAIL ${name}: expected HTTP ${expected.join('|')}, got ${res.status} (${url})`);
      failed += 1;
      return;
    }
    if (expectBody && !expectBody.test(text)) {
      console.error(`FAIL ${name}: response body check failed (${url})`);
      failed += 1;
      return;
    }
    if (jsonAssert) {
      const err = jsonAssert(text);
      if (err) {
        console.error(`FAIL ${name}: ${err}`);
        failed += 1;
        return;
      }
    }
    if (name === 'Sitemap' && text.includes('localhost') && !base.includes('localhost')) {
      console.error(`FAIL ${name}: sitemap contains localhost — set SITE_URL on backend`);
      failed += 1;
      return;
    }
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}: ${err.message} (${url})`);
    failed += 1;
  }
}

console.log(`Smoke testing: site=${base} api=${apiBase}\n`);

for (const check of checks) {
  await runCheck(check);
}

console.log('');
if (failed > 0) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log('All smoke tests passed.');
