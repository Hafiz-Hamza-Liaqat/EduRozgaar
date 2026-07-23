import { asyncHandler } from '../../utils/asyncHandler.js';
import { CareerMigrationService } from '../../services/career/migration/CareerMigrationService.js';
import { MigrationReconcileService } from '../../services/career/migration/MigrationReconcileService.js';
import { getFeatureFlagMatrix, isMigrationJobsEnabled } from '../../config/careerFeatureFlags.js';

function requireMigrationJobs(_req, res, next) {
  if (!isMigrationJobsEnabled()) {
    return res.status(503).json({ error: 'Career migration jobs are disabled' });
  }
  next();
}

export const getMigrationFlags = asyncHandler(async (_req, res) => {
  res.json(getFeatureFlagMatrix());
});

export const getMigrationReconcile = asyncHandler(async (_req, res) => {
  const report = await MigrationReconcileService.fullReport();
  res.json(report);
});

export const runMigrationPipeline = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true;
  const result = await CareerMigrationService.runFullPipeline({ dryRun });
  res.json(result);
});

export const runApplicationMigration = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true;
  const result = await CareerMigrationService.migrateApplications({ dryRun });
  res.json(result);
});

export const runDocumentMigration = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true;
  const result = await CareerMigrationService.migrateDocuments({ dryRun });
  res.json(result);
});

export const runCredentialHydration = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true;
  const result = await CareerMigrationService.hydrateCredentials({ dryRun });
  res.json(result);
});

export { requireMigrationJobs };
