#!/usr/bin/env node
/**
 * Deployment infrastructure verification (C.7.0.9)
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
function exists(p) { return existsSync(join(root, p)); }
function read(p) { return readFileSync(join(root, p), 'utf8'); }

for (const f of [
  'docker/Dockerfile.server',
  'docker/Dockerfile.client',
  'docker/nginx.conf',
  'docker/.env.production.example',
  'docker/.env.staging.example',
  'docker-compose.yml',
  'docker-compose.staging.yml',
  'deploy/Caddyfile',
  'deploy/staging-up.sh',
  'deploy/rollback.sh',
]) {
  if (exists(f)) pass(f);
  else fail(f);
}

const compose = read('docker-compose.yml');
if (compose.includes('media_uploads') && compose.includes('REQUIRE_REDIS')) pass('compose media volume + REQUIRE_REDIS');
else fail('compose media volume + REQUIRE_REDIS');

const shutdown = read('server/src/config/shutdown.js');
if (shutdown.includes('SIGTERM') && shutdown.includes('server.close')) pass('graceful shutdown');
else fail('graceful shutdown');

const health = read('server/src/routes/health.js');
if (health.includes('/health/live') && health.includes('/health/ready')) pass('health endpoints');
else fail('health endpoints');

console.log(`\nDeployment verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log('Deployment checks passed.');
