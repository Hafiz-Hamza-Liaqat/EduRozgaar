#!/usr/bin/env node
/**
 * Redis + unified cache verification (C.7.0.9)
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function read(p) { return readFileSync(join(root, p), 'utf8'); }

const cache = read('server/src/config/cache.js');
if (cache.includes('platformCacheGet') && cache.includes('CACHE_NAMESPACES')) pass('canonical cache module');
else fail('canonical cache module');

for (const f of ['searchCache.js', 'analyticsCache.js', 'memoryCache.js']) {
  const c = read(`server/src/services/${f.includes('memory') ? 'dynamicContent/' : f.includes('search') ? 'search/' : 'analytics/'}${f}`);
  if (c.includes('platformCacheGet') || c.includes('platformCacheSet')) pass(`${f} delegates to platform cache`);
  else fail(`${f} delegates to platform cache`);
}

const redis = read('server/src/config/redis.js');
if (redis.includes('cacheGet') && redis.includes('ioredis')) pass('redis.js layer');
else fail('redis.js layer');

if (read('docker-compose.yml').includes('redis:')) pass('compose includes redis');
else fail('compose includes redis');

console.log(`\nRedis/cache verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Redis cache checks passed.');
