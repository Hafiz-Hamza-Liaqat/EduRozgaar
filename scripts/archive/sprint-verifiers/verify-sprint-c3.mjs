#!/usr/bin/env node
/**
 * Sprint C.3 production readiness verification.
 * Usage: node scripts/verify-sprint-c3.mjs [--base http://localhost:5000]
 */
const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

const results = [];

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

console.log('Sprint C.3 Production Readiness Verification\n');

await checkAsync('Email templates EN/UR', async () => {
  const { renderEmailTemplate } = await import('../server/src/templates/emailTemplates.js');
  const en = renderEmailTemplate('welcome', 'en', { name: 'Test' });
  const ur = renderEmailTemplate('welcome', 'ur', { name: 'Test' });
  if (!en.subject || !en.html) throw new Error('EN template missing');
  if (!ur.subject || !ur.html) throw new Error('UR template missing');
});

await checkAsync('Health endpoint', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.status) throw new Error('missing status');
});

await checkAsync('Contact validation rejects empty', async () => {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'bad', subject: 'x', message: 'short' }),
  });
  if (res.status !== 400) throw new Error(`expected 400 got ${res.status}`);
});

await checkAsync('Institutions public list', async () => {
  const res = await fetch(`${API_BASE}/api/institutions?limit=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body.data)) throw new Error('missing data array');
});

await checkAsync('Foreign studies public list', async () => {
  const res = await fetch(`${API_BASE}/api/foreign-studies?limit=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

await checkAsync('Inbox routes require auth', async () => {
  const res = await fetch(`${API_BASE}/api/inbox/notifications`);
  if (res.status !== 401) throw new Error(`expected 401 got ${res.status}`);
});

await checkAsync('Support ticket honeypot accepts spam silently', async () => {
  const res = await fetch(`${API_BASE}/api/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bot', email: 'bot@evil.com', subject: 'spam', message: 'spam message here', website: 'http://spam.com',
    }),
  });
  if (res.status !== 201) throw new Error(`expected 201 got ${res.status}`);
});

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
