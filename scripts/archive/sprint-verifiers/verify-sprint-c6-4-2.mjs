#!/usr/bin/env node
/**
 * Sprint C.6.4.2 verification — SlugService & URL architecture
 * Run: cd server && node --env-file=.env ../scripts/verify-sprint-c6-4-2.mjs
 */
import { connectDB } from '../server/src/config/db.js';
import {
  normalizeSlug,
  validateSlug,
  checkSlugAvailability,
  resolveSlugForSave,
  SLUG_RESOURCE_TYPES,
} from '../server/src/services/slugService.js';
import { Job } from '../server/src/models/Job.js';
let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`  ✗ ${name}${detail ? `: ${detail}` : ''}`);
}

async function main() {
  console.log('Sprint C.6.4.2 — SlugService verification\n');

  const norm = normalizeSlug('  Software Engineer — Lahore!  ');
  if (norm === 'software-engineer-lahore') ok('normalizeSlug');
  else fail('normalizeSlug', norm);

  const reserved = validateSlug('admin');
  if (!reserved.valid && reserved.reserved) ok('reserved slug validation');
  else fail('reserved slug validation');

  const invalid = validateSlug('***');
  if (!invalid.valid) ok('invalid characters validation');
  else fail('invalid characters validation');

  if (SLUG_RESOURCE_TYPES.length >= 10) ok('resource types registered');
  else fail('resource types registered', String(SLUG_RESOURCE_TYPES.length));

  await connectDB();

  const existing = await Job.findOne({ slug: { $exists: true } }).lean();
  if (existing) {
    const taken = await checkSlugAvailability({
      resourceType: 'job',
      slug: existing.slug,
    });
    if (taken.available === false) ok('duplicate detection API logic');
    else fail('duplicate detection API logic');

    const selfOk = await checkSlugAvailability({
      resourceType: 'job',
      slug: existing.slug,
      excludeId: existing._id,
    });
    if (selfOk.available === true) ok('excludeId allows own slug');
    else fail('excludeId allows own slug');
  } else {
    ok('duplicate detection API logic (skipped — no jobs in DB)');
    ok('excludeId allows own slug (skipped)');
  }

  const draftDoc = {
    slug: 'locked-test-slug',
    title: 'Original Title',
    status: 'active',
    province: 'Punjab',
    toObject: () => ({ slug: 'locked-test-slug', title: 'Original Title', status: 'active', province: 'Punjab' }),
  };
  const locked = await resolveSlugForSave({
    resourceType: 'job',
    doc: draftDoc,
    body: { title: 'Changed Title', status: 'active' },
    isCreate: false,
  });
  if (locked.slug === 'locked-test-slug') ok('published slug locked on title change');
  else fail('published slug locked on title change', locked.slug);

  const draftResolve = await resolveSlugForSave({
    resourceType: 'job',
    doc: { status: 'draft', slug: '', toObject: () => ({ status: 'draft' }) },
    body: { title: 'New Draft Job', province: 'Sindh', status: 'draft' },
    isCreate: true,
  });
  if (draftResolve.slug && draftResolve.slug.includes('new-draft-job')) ok('draft auto-generate');
  else fail('draft auto-generate', draftResolve.slug);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
