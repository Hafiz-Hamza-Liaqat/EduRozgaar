#!/usr/bin/env node
/**
 * Monitoring + observability verification (C.7.0.9)
 */
import { readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function read(p) { return readFileSync(join(root, p), 'utf8'); }

if (read('server/src/utils/logger.js').includes('LOG_LEVEL')) pass('structured logger');
else fail('structured logger');

if (read('server/src/config/metrics.js').includes('collectMetrics')) pass('metrics collector');
else fail('metrics collector');

if (read('server/src/routes/health.js').includes('/metrics')) pass('metrics endpoint');
else fail('metrics endpoint');

if (read('server/src/routes/health.js').includes('REQUIRE_REDIS')) pass('require redis ready gate');
else fail('require redis ready gate');

if (read('docs/MONITORING_GUIDE.md').includes('/health/ready')) pass('monitoring guide');
else fail('monitoring guide');

if (read('server/src/middleware/requestLogger.js').includes('recordRequest')) pass('request metrics hook');
else fail('request metrics hook');

console.log(`\nMonitoring verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Monitoring checks passed.');
