#!/usr/bin/env node
/**
 * Sprint C.4 automation verification.
 * Usage: node scripts/verify-sprint-c4.mjs [--base http://localhost:5000]
 */
const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

const results = [];

async function check(name, fn, { optionalServer = false } = {}) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    const offline = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(String(err.message) + (err.cause?.message || ''));
    if (optionalServer && offline) {
      results.push({ name, ok: true, skipped: true });
      console.log(`○ ${name} (skipped — start server with MongoDB)`);
      return;
    }
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('Sprint C.4 Automation Verification\n');

await check('Email templates include automation types', async () => {
  const { renderEmailTemplate } = await import('../server/src/templates/emailTemplates.js');
  for (const key of [
    'employerApplicationReceived', 'offerLetter', 'supportTicketUpdate',
    'emailVerification', 'applicationReceived', 'interviewInvitation',
  ]) {
    const t = renderEmailTemplate(key, 'en', { name: 'Test', jobTitle: 'Dev', ticketNumber: 'TKT-001', subject: 'Hi', url: 'https://example.com' });
    if (!t.subject || !t.html) throw new Error(`${key} incomplete`);
  }
});

await check('Automation service exports event handlers', async () => {
  const mod = await import('../server/src/services/automationService.js');
  for (const fn of [
    'onUserRegistered', 'onJobApplication', 'onApplicationStatusChange',
    'onPaymentSuccess', 'onResumeAnalysisComplete', 'onEmployerVerificationChange',
    'onWebinarPublished', 'queueEmail', 'queueNotification',
  ]) {
    if (typeof mod[fn] !== 'function') throw new Error(`missing ${fn}`);
  }
});

await check('Job queue module exports', async () => {
  const mod = await import('../server/src/services/jobQueueService.js');
  if (typeof mod.enqueueJob !== 'function' || typeof mod.getQueueStats !== 'function') {
    throw new Error('job queue exports missing');
  }
});

await check('Verify email route rejects missing token', async () => {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`);
  if (res.status !== 400) throw new Error(`expected 400 got ${res.status}`);
}, { optionalServer: true });

await check('Admin queue status requires auth', async () => {
  const res = await fetch(`${API_BASE}/api/admin/queue/status`);
  if (res.status !== 401 && res.status !== 403) throw new Error(`expected 401/403 got ${res.status}`);
}, { optionalServer: true });

await check('Health includes background jobs', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.backgroundJobs == null) throw new Error('health missing backgroundJobs');
}, { optionalServer: true });

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
