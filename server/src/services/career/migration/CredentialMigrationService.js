import { TalentProfile } from '../../../models/career/TalentProfile.js';
import { CredentialPlatformService } from '../CredentialPlatformService.js';
import { TalentProfileService } from '../TalentProfileService.js';
import { TalentProfileRepository } from '../../../repositories/career/TalentProfileRepository.js';
import { CredentialRepository } from '../../../repositories/career/CredentialRepository.js';
import { isDocumentsPlatformEnabled, isMigrationJobsEnabled } from '../../../config/careerFeatureFlags.js';

const SYSTEM_ACTOR = { type: 'system', id: 'migration' };

/**
 * Issue credentials from TalentProfile.certificationReferences via platform service (idempotent).
 */
async function hydrateCredentialsForUser(userId, { dryRun = false } = {}) {
  if (!isDocumentsPlatformEnabled()) {
    return { created: 0, skipped: 0, disabled: true };
  }

  let profile = await TalentProfileRepository.findByUserId(userId);
  if (!profile) {
    if (dryRun) return { created: 0, skipped: 1, dryRun: true };
    profile = await TalentProfileService.getOrCreateForUser(userId, SYSTEM_ACTOR);
  }

  const refs = profile.certificationReferences || [];
  const existing = await CredentialRepository.findByProfileId(profile._id);
  let created = 0;
  let skipped = 0;

  for (const ref of refs) {
    if (!ref.name) {
      skipped += 1;
      continue;
    }
    if (existing.some((c) => c.title === ref.name && (c.issuer || '') === (ref.issuer || ''))) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      created += 1;
      continue;
    }
    await CredentialPlatformService.issue(
      userId,
      {
        title: ref.name,
        issuer: ref.issuer || '',
        source: 'hydration',
        verificationStatus: 'pending_verification',
        issuedAt: ref.issuedAt || undefined,
        expiresAt: ref.expiresAt || undefined,
      },
      SYSTEM_ACTOR
    );
    created += 1;
  }

  return { created, skipped, profileId: String(profile._id) };
}

async function hydrateAllCredentials({ batchSize = 100, dryRun = false } = {}) {
  if (!isMigrationJobsEnabled() && !dryRun) {
    return { processed: 0, created: 0, skipped: 0, disabled: true };
  }

  const stream = TalentProfile.find({}).select('_id userId').cursor();
  let processed = 0;
  let created = 0;
  let skipped = 0;

  for await (const profile of stream) {
    processed += 1;
    const result = await hydrateCredentialsForUser(profile.userId, { dryRun });
    created += result.created || 0;
    skipped += result.skipped || 0;
    if (processed % batchSize === 0) await new Promise((r) => setTimeout(r, 0));
  }

  return { processed, created, skipped };
}

export const CredentialMigrationService = {
  hydrateCredentialsForUser,
  hydrateAllCredentials,
};
