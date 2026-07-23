#!/usr/bin/env node
/**
 * Queue + worker verification (C.7.0.9)
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

const jq = read('server/src/services/jobQueueService.js');
if (jq.includes('enqueueJob') && jq.includes('processQueue') && jq.includes('dead')) pass('job queue service');
else fail('job queue service');

if (jq.includes('acquireQueueLock')) pass('distributed queue lock');
else fail('distributed queue lock');

const worker = read('server/src/worker.js');
if (worker.includes('processQueue') && worker.includes('WORKER_ONLY')) pass('worker process');
else fail('worker process');

const job = read('server/src/models/BackgroundJob.js');
if (job.includes('scheduled_publish') && job.includes('search_reindex')) pass('BackgroundJob job types');
else fail('BackgroundJob job types');

if (read('docker-compose.yml').includes('worker:')) pass('compose worker service');
else fail('compose worker service');

console.log(`\nQueue verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Queue checks passed.');
