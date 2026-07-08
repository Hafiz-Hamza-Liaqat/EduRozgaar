#!/usr/bin/env node
/**
 * Production smoke test — run after deploy.
 * Usage: SITE_URL=https://yourdomain.com node scripts/smoke-test.mjs
 */
const base = (process.env.SITE_URL || process.env.VITE_APP_URL || 'http://localhost').replace(/\/$/, '');

const checks = [
  { name: 'Homepage', url: `${base}/`, expectStatus: 200, expectBody: /EduRozgaar|edurozgaar/i },
  { name: 'Health API', url: `${base}/api/health`, expectStatus: 200, expectBody: /ok|healthy|status/i },
  { name: 'Sitemap', url: `${base}/sitemap.xml`, expectStatus: 200, expectBody: /<urlset|<sitemapindex/i },
  { name: 'Robots', url: `${base}/robots.txt`, expectStatus: 200, expectBody: /User-agent|Sitemap/i },
  { name: 'Jobs page', url: `${base}/jobs`, expectStatus: 200, expectBody: /jobs|Jobs/i },
];

let failed = 0;

async function runCheck({ name, url, expectStatus, expectBody }) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    if (res.status !== expectStatus) {
      console.error(`❌ ${name}: expected HTTP ${expectStatus}, got ${res.status} (${url})`);
      failed += 1;
      return;
    }
    if (expectBody && !expectBody.test(text)) {
      console.error(`❌ ${name}: response body check failed (${url})`);
      failed += 1;
      return;
    }
    if (name === 'Sitemap' && text.includes('localhost')) {
      console.error(`❌ ${name}: sitemap contains localhost — set SITE_URL on backend`);
      failed += 1;
      return;
    }
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}: ${err.message} (${url})`);
    failed += 1;
  }
}

console.log(`Smoke testing: ${base}\n`);

for (const check of checks) {
  await runCheck(check);
}

console.log('');
if (failed > 0) {
  console.error(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log('All smoke tests passed.');
