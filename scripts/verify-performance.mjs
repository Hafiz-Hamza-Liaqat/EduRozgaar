#!/usr/bin/env node
/**
 * Performance readiness verification (C.7.0.9)
 */
import { readFileSync, existsSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;
function pass(n) { passed += 1; }
function fail(n, d) { failures.push(`${n}${d ? `: ${d}` : ''}`); }
function read(p) { return readFileSync(join(root, p), 'utf8'); }

if (read('server/src/index.js').includes('compression')) pass('response compression');
else fail('response compression');

if (read('server/src/services/mediaImageProcessor.js').includes('webp')) pass('image webp optimization');
else fail('image webp optimization');

if (read('docker/nginx.conf').includes('gzip')) pass('nginx gzip');
else fail('nginx gzip');

if (existsSync(join(root, 'scripts/load-test.mjs'))) pass('load test script');
else fail('load test script');

const clientPkg = read('client/package.json');
if (clientPkg.includes('vite')) pass('vite build pipeline');
else fail('vite build pipeline');

console.log(`\nPerformance verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Performance checks passed.');
