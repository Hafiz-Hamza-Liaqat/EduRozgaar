#!/usr/bin/env node
/**
 * Career Migration Layer verification (C.8.0.7).
 */
import { existsSync, readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import {
  mapLegacyApplicationStatus,
  mapLegacyInternshipStatus,
  resolveRolloutMode,
  LEGACY_APPLICATION_STATUS_MAP,
} from '../shared/career/migrationMap.js';
import {
  isApplicationDualWrite,
  isApplicationReadFromCanonical,
  isTalentProfileDualWrite,
  isTalentProfileReadFromCanonical,
  isMigrationJobsEnabled,
  getFeatureFlagMatrix,
  getTalentProfileRolloutMode,
  getApplicationRolloutMode,
} from '../server/src/config/careerFeatureFlags.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let passed = 0;

function pass(name) { passed += 1; }
function fail(name, detail) { failures.push(`${name}${detail ? `: ${detail}` : ''}`); }
function exists(rel) { return docExists(root, rel); }
function read(rel) { return readFileSync(join(root, rel), 'utf8'); }

function runClientBuild() {
  const viteBin = join(root, 'client/node_modules/vite/bin/vite.js');
  const r = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: join(root, 'client'),
    encoding: 'utf8',
    shell: false,
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}

// Shared migration map
{
  if (mapLegacyApplicationStatus('submitted') === 'applied') pass('status map submitted→applied');
  else fail('status map submitted→applied');
  if (mapLegacyApplicationStatus('hired') === 'accepted') pass('status map hired→accepted');
  else fail('status map hired→accepted');
  if (mapLegacyInternshipStatus('withdrawn') === 'withdrawn') pass('internship status map');
  else fail('internship status map');
  if (Object.keys(LEGACY_APPLICATION_STATUS_MAP).length >= 5) pass('legacy status coverage');
  else fail('legacy status coverage');
}

// Rollout modes
{
  if (resolveRolloutMode({ enabled: false, dualWrite: true, readCanonical: true }) === 'legacy') {
    pass('rollout disabled → legacy');
  } else fail('rollout disabled → legacy');
  if (resolveRolloutMode({ enabled: true, dualWrite: true, readCanonical: false }) === 'dual_write') {
    pass('rollout dual_write');
  } else fail('rollout dual_write');
  if (resolveRolloutMode({ enabled: true, dualWrite: true, readCanonical: true }) === 'dual_read') {
    pass('rollout dual_read');
  } else fail('rollout dual_read');
  if (resolveRolloutMode({ enabled: true, dualWrite: false, readCanonical: true }) === 'canonical') {
    pass('rollout canonical');
  } else fail('rollout canonical');
}

// Feature flags
{
  const matrix = getFeatureFlagMatrix();
  if (matrix.talentProfile && matrix.opportunityApplication && matrix.migrationJobs) {
    pass('feature flag matrix');
  } else fail('feature flag matrix');
  if (typeof isApplicationDualWrite() === 'boolean') pass('APPLICATION_DUAL_WRITE flag');
  else fail('APPLICATION_DUAL_WRITE flag');
  if (typeof isApplicationReadFromCanonical() === 'boolean') pass('APPLICATION_READ_CANONICAL flag');
  else fail('APPLICATION_READ_CANONICAL flag');
  if (typeof isTalentProfileDualWrite() === 'boolean') pass('TALENT_PROFILE_DUAL_WRITE flag');
  else fail('TALENT_PROFILE_DUAL_WRITE flag');
  if (typeof isTalentProfileReadFromCanonical() === 'boolean') pass('TALENT_PROFILE_READ_CANONICAL flag');
  else fail('TALENT_PROFILE_READ_CANONICAL flag');
  if (typeof isMigrationJobsEnabled() === 'boolean') pass('CAREER_MIGRATION_JOBS_ENABLED flag');
  else fail('CAREER_MIGRATION_JOBS_ENABLED flag');
  if (['legacy', 'dual_write', 'dual_read', 'canonical'].includes(getTalentProfileRolloutMode())) {
    pass('talent rollout mode');
  } else fail('talent rollout mode');
  if (['legacy', 'dual_write', 'dual_read', 'canonical'].includes(getApplicationRolloutMode())) {
    pass('application rollout mode');
  } else fail('application rollout mode');

  const env = read('.env.template');
  for (const key of [
    'APPLICATION_DUAL_WRITE',
    'APPLICATION_READ_CANONICAL',
    'DOCUMENTS_MIGRATION_ENABLED',
    'CAREER_MIGRATION_JOBS_ENABLED',
    'VITE_APPLICATION_READ_CANONICAL',
  ]) {
    if (env.includes(key)) pass(`env ${key}`);
    else fail(`env ${key}`);
  }
}

// Migration services exist
{
  for (const f of [
    'shared/career/migrationMap.js',
    'server/src/services/career/migration/ApplicationMigrationService.js',
    'server/src/services/career/migration/DocumentMigrationService.js',
    'server/src/services/career/migration/CredentialMigrationService.js',
    'server/src/services/career/migration/MigrationReconcileService.js',
    'server/src/services/career/migration/CareerMigrationService.js',
    'server/src/controllers/career/migrationController.js',
    'server/src/routes/migration.js',
  ]) {
    if (exists(f)) pass(`layer ${f.split('/').pop()}`);
    else fail(`layer ${f.split('/').pop()}`);
  }
}

// CLI scripts
{
  for (const f of [
    'server/src/scripts/hydrateTalentProfiles.js',
    'server/src/scripts/migrateOpportunityApplications.js',
    'server/src/scripts/migrateProfileDocuments.js',
    'server/src/scripts/reconcileCareerMigration.js',
  ]) {
    if (exists(f)) pass(`script ${f.split('/').pop()}`);
    else fail(`script ${f.split('/').pop()}`);
  }
}

// Hydration idempotency — credentials via platform service
{
  const hydration = read('server/src/services/career/ProfileHydrationService.js');
  if (hydration.includes('CredentialMigrationService') && !hydration.includes('CredentialRepository.create')) {
    pass('hydration idempotency / credential platform path');
  } else fail('hydration idempotency / credential platform path');
}

// Dual-write correctness — wired on legacy apply + resume
{
  const apps = read('server/src/controllers/applicationsController.js');
  if (apps.includes('dualWriteFromLegacyJobApplication')) pass('job apply dual-write');
  else fail('job apply dual-write');
  const intern = read('server/src/controllers/internshipsController.js');
  if (intern.includes('dualWriteFromLegacyInternshipApplication')) pass('internship apply dual-write');
  else fail('internship apply dual-write');
  const resumes = read('server/src/controllers/resumesController.js');
  if (resumes.includes('syncFromLegacyResume')) pass('resume reverse dual-write');
  else fail('resume reverse dual-write');
  const appMig = read('server/src/services/career/migration/ApplicationMigrationService.js');
  if (appMig.includes('legacyApplicationId') && appMig.includes('already_migrated')) {
    pass('application migration idempotency');
  } else fail('application migration idempotency');
}

// Document / credential mapping
{
  const docMig = read('server/src/services/career/migration/DocumentMigrationService.js');
  if (docMig.includes('legacyProfileDocumentId') && docMig.includes('already_migrated')) {
    pass('document mapping idempotency');
  } else fail('document mapping idempotency');
  const credMig = read('server/src/services/career/migration/CredentialMigrationService.js');
  if (credMig.includes('CredentialPlatformService.issue')) pass('credential mapping via platform');
  else fail('credential mapping via platform');
}

// Rollback safety — no deletes in migration services
{
  const files = [
    'server/src/services/career/migration/ApplicationMigrationService.js',
    'server/src/services/career/migration/DocumentMigrationService.js',
    'server/src/services/career/migration/MigrationReconcileService.js',
  ];
  let safe = true;
  for (const f of files) {
    const src = read(f);
    if (/\.deleteOne\(|\.deleteMany\(|findOneAndDelete|dropCollection/.test(src)) safe = false;
  }
  if (safe) pass('rollback safety — no destructive deletes');
  else fail('rollback safety — no destructive deletes');
  const reconcile = read('server/src/services/career/migration/MigrationReconcileService.js');
  if (reconcile.includes('noDeletes') && reconcile.includes('rollback')) pass('rollback strategy documented in service');
  else fail('rollback strategy documented in service');
}

// Timeline / analytics / search consistency — migration emits events
{
  const appMig = read('server/src/services/career/migration/ApplicationMigrationService.js');
  if (appMig.includes('emitCareerEvent') && appMig.includes('ApplicationCreated') && appMig.includes('trackApplicationAnalyticsFromEvent')) {
    pass('timeline/analytics consistency on app migration');
  } else fail('timeline/analytics consistency on app migration');
  const docSvc = read('server/src/services/career/DocumentService.js');
  if (docSvc.includes('legacyProfileDocumentId') && docSvc.includes('DocumentCreated')) {
    pass('document migration preserves events');
  } else fail('document migration preserves events');
}

// Localization preservation
{
  const appMig = read('server/src/services/career/migration/ApplicationMigrationService.js');
  if (appMig.includes('normalizeLocale')) pass('localization preservation');
  else fail('localization preservation');
}

// Permissions — staff-only migration routes
{
  const routes = read('server/src/routes/migration.js');
  if (routes.includes('requireStaff') && routes.includes('/admin/career/migration')) {
    pass('migration admin permissions');
  } else fail('migration admin permissions');
  const index = read('server/src/index.js');
  if (index.includes('migrationRouter')) pass('migration router mounted');
  else fail('migration router mounted');
}

// Documentation
{
  if (exists('docs/SPRINT_C8_0_7_IMPLEMENTATION_REPORT.md')) pass('implementation report');
  else fail('implementation report');
}

// Client build
{
  const build = runClientBuild();
  if (build.ok) pass('client build');
  else fail('client build', build.out.slice(-800));
}

console.log(`\nverify:migration — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('All migration checks passed.');
process.exit(0);
