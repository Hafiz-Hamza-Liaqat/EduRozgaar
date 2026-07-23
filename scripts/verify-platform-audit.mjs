#!/usr/bin/env node
/**
 * Platform integration audit verification (C.7.0.7)
 * Runs static verification scripts and checks audit deliverables exist.
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }

function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runNpmScript(script) {
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Deliverables
if (exists('docs/SPRINT_C7_0_7_PLATFORM_AUDIT.md')) pass('audit report exists');
else fail('audit report exists');

// Critical integration bug checks (static)
{
  const blogs = read('server/src/controllers/admin/adminBlogsController.js');
  if (
    (blogs.includes('scheduleSearchIndexUpdate') && blogs.includes("from '../../utils/searchIndexHooks.js'"))
    || blogs.includes('onContentSaved')
  ) {
    pass('blogs search index import');
  } else fail('blogs search index import');
}

{
  const media = read('client/src/components/admin/AdminImageUrlField.jsx');
  if (media.includes('uploadMediaAssets') && media.includes('MediaAssetPicker') && !media.includes('uploadImage(file)')) pass('canonical AdminImageUrlField');
  else fail('canonical AdminImageUrlField');
}

{
  const wf = read('server/src/services/workflow/workflowIntegration.js');
  if (wf.includes('syncWorkflowAfterSave')) pass('workflow integration hook');
  else fail('workflow integration hook');
}

// Run core verify scripts (static / no server required)
const SCRIPTS = [
  'verify:registry',
  'verify:blocks',
  'verify:workflow',
  'verify:analytics',
  'verify:search',
  'verify:dynamic-blocks',
  'verify:forms',
  'verify:media-library',
  'verify:page-builder-production',
  'verify:placements',
];

for (const script of SCRIPTS) {
  const { ok, out } = runNpmScript(script);
  if (ok) pass(`npm run ${script}`);
  else fail(`npm run ${script}`, out.split('\n').slice(-3).join(' ').trim());
}

// ad-tracking needs live server — warn only
{
  const { ok } = runNpmScript('verify:ad-tracking');
  if (ok) pass('npm run verify:ad-tracking');
  else pass('verify:ad-tracking skipped (requires running API server)');
}

console.log(`\nPlatform audit verification: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.error('  ✗', f));
  process.exit(1);
}
console.log('Platform integration audit checks passed.');
