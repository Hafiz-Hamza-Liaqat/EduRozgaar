import { ProfileDocument } from '../../../models/career/ProfileDocument.js';
import { DocumentRepository } from '../../../repositories/career/DocumentRepository.js';
import { TalentProfileRepository } from '../../../repositories/career/TalentProfileRepository.js';
import { DocumentService } from '../DocumentService.js';
import { TalentProfileService } from '../TalentProfileService.js';
import {
  isDocumentsMigrationEnabled,
  isMigrationJobsEnabled,
} from '../../../config/careerFeatureFlags.js';

const SYSTEM_ACTOR = { type: 'system', id: 'migration' };

/**
 * Migrate one legacy ProfileDocument → canonical Document (idempotent).
 */
async function migrateOne(legacy, { dryRun = false } = {}) {
  const existing = await DocumentRepository.findByLegacyProfileDocumentId(legacy._id);
  if (existing) {
    return { created: false, skipped: true, reason: 'already_migrated', document: existing };
  }

  if (dryRun) {
    return { created: true, skipped: false, dryRun: true, legacyId: String(legacy._id) };
  }

  let profile = await TalentProfileRepository.findByUserId(legacy.userId);
  if (!profile && legacy.talentProfileId) {
    profile = await TalentProfileRepository.findById(legacy.talentProfileId);
  }
  if (!profile) {
    profile = await TalentProfileService.getOrCreateForUser(legacy.userId, SYSTEM_ACTOR);
  }

  const doc = await DocumentService.create(
    legacy.userId,
    {
      label: legacy.label,
      documentType: legacy.documentType || 'other',
      mediaAssetId: legacy.mediaAssetId || undefined,
      parentType: 'talent_profile',
      parentId: profile._id,
      visibility: legacy.visibility === 'public' ? 'public' : 'private',
      locale: legacy.locale || 'en',
      metadata: {
        ...(legacy.metadata || {}),
        migratedFrom: 'ProfileDocument',
        legacyStatus: legacy.status,
      },
      legacyProfileDocumentId: legacy._id,
    },
    SYSTEM_ACTOR
  );

  return { created: true, skipped: false, document: doc };
}

async function migrateAll({ batchSize = 100, dryRun = false } = {}) {
  if (!isDocumentsMigrationEnabled()) {
    return { processed: 0, created: 0, skipped: 0, disabled: true, reason: 'documents_migration_disabled' };
  }
  if (!isMigrationJobsEnabled() && !dryRun) {
    return { processed: 0, created: 0, skipped: 0, disabled: true, reason: 'migration_jobs_disabled' };
  }

  const cursor = ProfileDocument.find({ status: { $ne: 'deleted' } }).cursor();
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for await (const legacy of cursor) {
    processed += 1;
    try {
      const result = await migrateOne(legacy, { dryRun });
      if (result.created) created += 1;
      else skipped += 1;
    } catch {
      errors += 1;
      skipped += 1;
    }
    if (processed % batchSize === 0) await new Promise((r) => setTimeout(r, 0));
  }

  return { processed, created, skipped, errors };
}

export const DocumentMigrationService = {
  migrateOne,
  migrateAll,
};
