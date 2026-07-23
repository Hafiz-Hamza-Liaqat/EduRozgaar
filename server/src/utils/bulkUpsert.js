/**
 * Idempotent bulk upsert helpers for launch seeding.
 */
import { ensureSlugUniqueLegacy } from '../services/slugService.js';

export async function ensureSlugUnique(Model, baseSlug, field = 'slug') {
  return ensureSlugUniqueLegacy(Model, baseSlug, field);
}

export async function bulkUpsert(Model, records, getFilter, options = {}) {
  const { batchSize = 100 } = options;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const ops = [];

    for (const doc of batch) {
      const filter = getFilter(doc);
      const exists = await Model.findOne(filter).select('_id').lean();
      if (exists) {
        skipped++;
        continue;
      }
      ops.push({
        insertOne: { document: doc },
      });
    }

    if (ops.length) {
      const result = await Model.bulkWrite(ops, { ordered: false });
      inserted += result.insertedCount || ops.length;
    }
  }

  return { inserted, skipped };
}

export async function upsertOne(Model, filter, doc) {
  const existing = await Model.findOne(filter).select('_id').lean();
  if (existing) return { action: 'skipped' };
  await Model.create(doc);
  return { action: 'inserted' };
}
