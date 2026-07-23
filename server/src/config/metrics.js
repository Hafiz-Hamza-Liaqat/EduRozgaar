/**
 * Lightweight in-process metrics (C.7.0.9). Prometheus-compatible text optional.
 */
import os from 'os';
import { getCacheStats } from './cache.js';
import { getMongoHealth } from './db.js';
import { getRedisClient } from './redis.js';
import { getQueueStats } from '../services/jobQueueService.js';

const startedAt = Date.now();
let requestCount = 0;
let errorCount = 0;
/** @type {number[]} */
const latencies = [];

export function recordRequest(durationMs, isError = false) {
  requestCount += 1;
  if (isError) errorCount += 1;
  latencies.push(durationMs);
  if (latencies.length > 500) latencies.shift();
}

export function getLatencyStats() {
  if (!latencies.length) return { p50: 0, p95: 0, avg: 0, sampleSize: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return { p50: Math.round(p50), p95: Math.round(p95), avg: Math.round(avg), sampleSize: sorted.length };
}

export async function collectMetrics() {
  const [cache, queue] = await Promise.all([
    getCacheStats(),
    getQueueStats().catch(() => null),
  ]);

  let redisPing = null;
  try {
    const redis = await getRedisClient();
    if (redis) {
      const t0 = Date.now();
      await redis.ping();
      redisPing = Date.now() - t0;
    }
  } catch {
    redisPing = -1;
  }

  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    process: {
      pid: process.pid,
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg(),
    },
    http: {
      requestCount,
      errorCount,
      latency: getLatencyStats(),
    },
    mongo: getMongoHealth(),
    redis: { pingMs: redisPing },
    cache,
    queue,
    workerMode: process.env.WORKER_ONLY === '1',
  };
}

export async function metricsPrometheusText() {
  const m = await collectMetrics();
  const lines = [
    '# HELP edurozgaar_uptime_seconds Process uptime',
    '# TYPE edurozgaar_uptime_seconds gauge',
    `edurozgaar_uptime_seconds ${m.uptimeSeconds}`,
    '# HELP edurozgaar_http_requests_total Total HTTP requests',
    '# TYPE edurozgaar_http_requests_total counter',
    `edurozgaar_http_requests_total ${m.http.requestCount}`,
    '# HELP edurozgaar_memory_rss_bytes RSS memory',
    '# TYPE edurozgaar_memory_rss_bytes gauge',
    `edurozgaar_memory_rss_bytes ${m.process.memoryMb * 1024 * 1024}`,
  ];
  if (m.queue) {
    lines.push(
      '# HELP edurozgaar_queue_pending Pending background jobs',
      '# TYPE edurozgaar_queue_pending gauge',
      `edurozgaar_queue_pending ${m.queue.pending || 0}`,
    );
  }
  return lines.join('\n') + '\n';
}
