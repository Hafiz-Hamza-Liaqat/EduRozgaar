import { Application } from '../../../models/Application.js';
import { InternshipApplication } from '../../../models/InternshipApplication.js';
import { Job } from '../../../models/Job.js';
import { Internship } from '../../../models/Internship.js';
import { TalentProfileRepository } from '../../../repositories/career/TalentProfileRepository.js';
import { OpportunityApplicationRepository } from '../../../repositories/career/OpportunityApplicationRepository.js';
import { TalentProfileService } from '../TalentProfileService.js';
import { ApplicationStageMachineService } from '../ApplicationValidationService.js';
import { emitCareerEvent } from '../CareerEventBus.js';
import { trackApplicationAnalyticsFromEvent } from '../careerApplicationBridge.js';
import { isApplicationDualWrite, isMigrationJobsEnabled } from '../../../config/careerFeatureFlags.js';
import {
  mapLegacyApplicationStatus,
  mapLegacyInternshipStatus,
} from '../../../../../shared/career/migrationMap.js';
import { normalizeLocale } from '../../../../../shared/localization/localeResolver.js';

const SYSTEM_ACTOR = { type: 'system', id: 'migration' };

async function ensureProfile(userId) {
  let profile = await TalentProfileRepository.findByUserId(userId);
  if (!profile) {
    profile = await TalentProfileService.getOrCreateForUser(userId, SYSTEM_ACTOR);
  }
  return profile;
}

function emitCreated(application, extra = {}) {
  const event = emitCareerEvent(
    'ApplicationCreated',
    {
      applicationId: String(application._id),
      talentProfileId: String(application.talentProfileId),
      opportunityType: application.opportunityRef?.opportunityType,
      opportunityId: application.opportunityRef?.opportunityId
        ? String(application.opportunityRef.opportunityId)
        : null,
      pipelineStage: application.pipelineStage,
      legacyApplicationId: application.legacyApplicationId
        ? String(application.legacyApplicationId)
        : null,
      migration: true,
      ...extra,
    },
    {
      actor: SYSTEM_ACTOR,
      aggregateType: 'OpportunityApplication',
      aggregateId: application._id,
      locale: application.locale,
      market: application.market,
    }
  );
  trackApplicationAnalyticsFromEvent(event, { userId: application.userId });
  return event;
}

/**
 * Migrate a legacy job Application → OpportunityApplication (idempotent).
 */
async function migrateJobApplication(legacy, { dryRun = false } = {}) {
  const existing = await OpportunityApplicationRepository.findByLegacyApplicationId(legacy._id);
  if (existing) return { created: false, skipped: true, reason: 'already_migrated', application: existing };

  if (dryRun) {
    return { created: true, skipped: false, dryRun: true, legacyId: String(legacy._id) };
  }

  const profile = await ensureProfile(legacy.userId);
  const already = await OpportunityApplicationRepository.findByTalentAndOpportunity(
    profile._id,
    'job',
    legacy.jobId
  );
  if (already) {
    if (!already.legacyApplicationId) {
      await OpportunityApplicationRepository.updateById(already._id, {
        legacyApplicationId: legacy._id,
      });
    }
    return { created: false, skipped: true, reason: 'opportunity_exists', application: already };
  }

  const job = await Job.findById(legacy.jobId).lean();
  const stage = mapLegacyApplicationStatus(legacy.status);
  const templateId = ApplicationStageMachineService.resolveTemplateId('job');
  const now = legacy.appliedDate || legacy.createdAt || new Date();

  const application = await OpportunityApplicationRepository.create({
    userId: legacy.userId,
    talentProfileId: profile._id,
    opportunityRef: {
      opportunityType: 'job',
      opportunityId: legacy.jobId,
      locale: 'en',
      market: job?.province || '',
    },
    organizationId: null,
    pipelineStage: stage,
    stageTemplateId: templateId,
    source: 'migration',
    status: 'active',
    title: job?.title || '',
    companyName: job?.organization || job?.company || '',
    locale: normalizeLocale('en'),
    market: job?.province || '',
    legacyApplicationId: legacy._id,
    metadata: {
      migratedFrom: 'Application',
      legacyStatus: legacy.status,
      resumeURL: legacy.resumeURL || null,
      resumeSource: legacy.resumeSource || null,
    },
    appliedAt: now,
    stageHistory: [{
      fromStage: stage,
      toStage: stage,
      at: now,
      byActorType: 'system',
      byActorId: null,
      reason: 'Migrated from legacy Application',
    }],
  });

  const plain = application.toObject ? application.toObject() : application;
  emitCreated(plain);
  return { created: true, skipped: false, application: plain };
}

/**
 * Migrate a legacy InternshipApplication → OpportunityApplication (idempotent).
 */
async function migrateInternshipApplication(legacy, { dryRun = false } = {}) {
  if (dryRun) {
    return { created: true, skipped: false, dryRun: true, legacyId: String(legacy._id) };
  }

  const profile = await ensureProfile(legacy.userId);
  const already = await OpportunityApplicationRepository.findByTalentAndOpportunity(
    profile._id,
    'internship',
    legacy.internshipId
  );
  if (already) {
    return { created: false, skipped: true, reason: 'opportunity_exists', application: already };
  }

  const internship = await Internship.findById(legacy.internshipId).lean();
  const stage = mapLegacyInternshipStatus(legacy.status);
  const templateId = ApplicationStageMachineService.resolveTemplateId('internship');
  const now = legacy.appliedAt || legacy.createdAt || new Date();

  const application = await OpportunityApplicationRepository.create({
    userId: legacy.userId,
    talentProfileId: profile._id,
    opportunityRef: {
      opportunityType: 'internship',
      opportunityId: legacy.internshipId,
      locale: 'en',
      market: internship?.province || internship?.location || '',
    },
    pipelineStage: stage,
    stageTemplateId: templateId,
    source: 'migration',
    status: 'active',
    title: internship?.title || '',
    companyName: internship?.organization || '',
    locale: normalizeLocale('en'),
    market: internship?.province || '',
    metadata: {
      migratedFrom: 'InternshipApplication',
      legacyInternshipApplicationId: String(legacy._id),
      legacyStatus: legacy.status,
    },
    appliedAt: now,
    stageHistory: [{
      fromStage: stage,
      toStage: stage,
      at: now,
      byActorType: 'system',
      byActorId: null,
      reason: 'Migrated from legacy InternshipApplication',
    }],
  });

  const plain = application.toObject ? application.toObject() : application;
  emitCreated(plain, { legacyInternshipApplicationId: String(legacy._id) });
  return { created: true, skipped: false, application: plain };
}

/**
 * Live dual-write after legacy job apply (non-throwing for caller).
 */
async function dualWriteFromLegacyJobApplication(legacyApp, job) {
  if (!isApplicationDualWrite()) return null;
  try {
    const result = await migrateJobApplication(legacyApp, { dryRun: false });
    if (result.created && job && result.application && !result.application.title) {
      await OpportunityApplicationRepository.updateById(result.application._id, {
        title: job.title || '',
        companyName: job.organization || job.company || '',
        market: job.province || '',
      });
    }
    return result;
  } catch (err) {
    console.error('[migration] dual-write job application failed', err?.message);
    return { created: false, error: err?.message };
  }
}

async function dualWriteFromLegacyInternshipApplication(legacyApp, internship) {
  if (!isApplicationDualWrite()) return null;
  try {
    return await migrateInternshipApplication(
      { ...legacyApp, internshipId: internship?._id || legacyApp.internshipId },
      { dryRun: false }
    );
  } catch (err) {
    console.error('[migration] dual-write internship application failed', err?.message);
    return { created: false, error: err?.message };
  }
}

async function migrateAllJobApplications({ batchSize = 100, dryRun = false } = {}) {
  if (!isMigrationJobsEnabled() && !dryRun) {
    return { processed: 0, created: 0, skipped: 0, disabled: true };
  }

  const cursor = Application.find({}).cursor();
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for await (const legacy of cursor) {
    processed += 1;
    try {
      const result = await migrateJobApplication(legacy, { dryRun });
      if (result.created && !result.dryRun) created += 1;
      else if (result.dryRun && result.created) created += 1;
      else skipped += 1;
    } catch {
      errors += 1;
      skipped += 1;
    }
    if (processed % batchSize === 0) await new Promise((r) => setTimeout(r, 0));
  }

  return { processed, created, skipped, errors, type: 'job' };
}

async function migrateAllInternshipApplications({ batchSize = 100, dryRun = false } = {}) {
  if (!isMigrationJobsEnabled() && !dryRun) {
    return { processed: 0, created: 0, skipped: 0, disabled: true };
  }

  const cursor = InternshipApplication.find({}).cursor();
  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for await (const legacy of cursor) {
    processed += 1;
    try {
      const result = await migrateInternshipApplication(legacy, { dryRun });
      if (result.created) created += 1;
      else skipped += 1;
    } catch {
      errors += 1;
      skipped += 1;
    }
    if (processed % batchSize === 0) await new Promise((r) => setTimeout(r, 0));
  }

  return { processed, created, skipped, errors, type: 'internship' };
}

export const ApplicationMigrationService = {
  migrateJobApplication,
  migrateInternshipApplication,
  dualWriteFromLegacyJobApplication,
  dualWriteFromLegacyInternshipApplication,
  migrateAllJobApplications,
  migrateAllInternshipApplications,
  async migrateAll(options = {}) {
    const jobs = await migrateAllJobApplications(options);
    const internships = await migrateAllInternshipApplications(options);
    return { jobs, internships };
  },
};
