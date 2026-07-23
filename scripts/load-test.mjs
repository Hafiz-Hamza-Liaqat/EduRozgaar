#!/usr/bin/env node
/**
 * Lightweight load test (C.7.0.9) — no external deps.
 * Usage: node scripts/load-test.mjs [baseUrl] [concurrency] [requests]
 */
const baseUrl = process.argv[2] || process.env.LOAD_TEST_URL || 'http://localhost:5000';
const concurrency = Number(process.argv[3]) || 10;
const total = Number(process.argv[4]) || 100;
const paths = ['/api/health/live', '/api/health/ready', '/api/metrics'];

async function fetchOne(path) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`);
    return { ok: res.ok, ms: Date.now() - t0, status: res.status };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: err.message };
  }
}

async function run() {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < total) {
      const n = i++;
      const path = paths[n % paths.length];
      results.push(await fetchOne(path));
    }
  }
  const t0 = Date.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const elapsed = Date.now() - t0;
  const ok = results.filter((r) => r.ok).length;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)] || 0;
  console.log(JSON.stringify({
    baseUrl, concurrency, total, elapsedMs: elapsed,
    successRate: `${((ok / total) * 100).toFixed(1)}%`,
    rps: (total / (elapsed / 1000)).toFixed(1),
    p95Ms: p95,
    errors: results.filter((r) => !r.ok).length,
  }, null, 2));
  if (ok < total * 0.95) process.exit(1);
}

run();
