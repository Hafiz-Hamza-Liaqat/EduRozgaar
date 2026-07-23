import { User } from '../../models/User.js';
import { Resume } from '../../models/Resume.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { ResumeVersionRepository } from '../../repositories/career/ResumeVersionRepository.js';
import { TalentProfileService } from './TalentProfileService.js';
import { ResumeVersionService } from './ResumeVersionService.js';
import { CredentialMigrationService } from './migration/CredentialMigrationService.js';

/**
 * TalentProfile hydration from User + Resume (C.8.0.2A / C.8.0.7).
 * Credentials issued via CredentialPlatformService for timeline/search/analytics.
 */
export const ProfileHydrationService = {
  async hydrateUser(userId, { actor = { type: 'system', id: null } } = {}) {
    const existing = await TalentProfileRepository.findByUserId(userId);
    if (existing) {
      // Still reconcile credentials idempotently
      const creds = await CredentialMigrationService.hydrateCredentialsForUser(userId);
      return { created: false, profile: existing, credentials: creds };
    }

    const user = await User.findById(userId).lean();
    if (!user || user.role !== 'User') {
      return { created: false, skipped: true, reason: 'not_eligible_user' };
    }

    const profile = await TalentProfileService.getOrCreateForUser(userId, actor);

    const resume = await Resume.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    if (resume) {
      const version = await ResumeVersionRepository.findPrimaryByProfileId(profile._id);
      if (!version) {
        await ResumeVersionService.createFromProfile(profile, resume, actor);
      }
    }

    const credentials = await CredentialMigrationService.hydrateCredentialsForUser(userId);

    return { created: true, profile, credentials };
  },

  async hydrateAll({ batchSize = 100, dryRun = false } = {}) {
    const cursor = User.find({ role: 'User' }).select('_id').cursor();
    let processed = 0;
    let created = 0;
    let skipped = 0;

    for await (const user of cursor) {
      processed += 1;
      if (dryRun) {
        const exists = await TalentProfileRepository.findByUserId(user._id);
        if (exists) skipped += 1;
        else created += 1;
        continue;
      }

      const result = await this.hydrateUser(user._id);
      if (result.created) created += 1;
      else skipped += 1;

      if (processed % batchSize === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return { processed, created, skipped };
  },
};
