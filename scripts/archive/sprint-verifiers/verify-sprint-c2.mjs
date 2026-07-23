#!/usr/bin/env node
/**
 * Sprint C.2 security verification.
 * Usage: node scripts/verify-sprint-c2.mjs [--base http://localhost:5000]
 */
import { sanitizeHtml, stripAllHtml } from '../server/src/utils/htmlSanitize.js';
import { rejectDangerousFilename } from '../server/src/utils/fileValidation.js';

const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

const results = [];

function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('Sprint C.2 Security Verification\n');

check('XSS: strips script tags', () => {
  const out = sanitizeHtml('<p>Hi</p><script>alert(1)</script>');
  if (out.includes('script') || out.includes('alert')) throw new Error('script not removed');
});

check('XSS: strips event handlers', () => {
  const out = sanitizeHtml('<img src=x onerror=alert(1)>');
  if (out.includes('onerror')) throw new Error('onerror not removed');
});

check('XSS: strips javascript: URLs', () => {
  const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
  if (out.includes('javascript:')) throw new Error('javascript: URL not removed');
});

check('XSS: strips iframes', () => {
  const out = sanitizeHtml('<iframe src="https://evil.com"></iframe>');
  if (out.includes('iframe')) throw new Error('iframe not removed');
});

check('XSS: allows safe formatting', () => {
  const out = sanitizeHtml('<h2>Title</h2><p><strong>Bold</strong></p>');
  if (!out.includes('<h2>') || !out.includes('<strong>')) throw new Error('safe tags removed');
});

check('stripAllHtml removes all tags', () => {
  const out = stripAllHtml('<b>hello</b>');
  if (out.includes('<')) throw new Error('tags remain');
});

check('rejectDangerousFilename blocks double extension', () => {
  let threw = false;
  try {
    rejectDangerousFilename('resume.pdf.exe');
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('expected rejection');
});

await checkAsync('Security headers on API health', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`health status ${res.status}`);
  const csp = res.headers.get('content-security-policy');
  const nosniff = res.headers.get('x-content-type-options');
  const referrer = res.headers.get('referrer-policy');
  if (!csp) throw new Error('missing Content-Security-Policy');
  if (nosniff !== 'nosniff') throw new Error('missing X-Content-Type-Options: nosniff');
  if (!referrer) throw new Error('missing Referrer-Policy');
});

await checkAsync('Admin upload requires auth', async () => {
  const res = await fetch(`${API_BASE}/api/admin/upload/image`, { method: 'POST' });
  if (res.status !== 401 && res.status !== 403) throw new Error(`expected 401/403, got ${res.status}`);
});

await checkAsync('Production error handler hides stack (simulated)', async () => {
  const res = await fetch(`${API_BASE}/api/does-not-exist-route-c2-test`);
  const json = await res.json().catch(() => ({}));
  if (json.stack) throw new Error('stack trace leaked in response');
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
