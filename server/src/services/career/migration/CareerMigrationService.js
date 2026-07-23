import { ApplicationMigrationService } from './ApplicationMigrationService.js';
import { DocumentMigrationService } from './DocumentMigrationService.js';
import { CredentialMigrationService } from './CredentialMigrationService.js';
import { MigrationReconcileService } from './MigrationReconcileService.js';
import { ProfileHydrationService } from '../ProfileHydrationService.js';

/**
 * Facade for staff/CLI migration orchestration (C.8.0.7).
 */
export const CareerMigrationService = {
  hydrateTalentProfiles: (opts) => ProfileHydrationService.hydrateAll(opts),
  migrateApplications: (opts) => ApplicationMigrationService.migrateAll(opts),
  migrateDocuments: (opts) => DocumentMigrationService.migrateAll(opts),
  hydrateCredentials: (opts) => CredentialMigrationService.hydrateAllCredentials(opts),
  reconcile: () => MigrationReconcileService.fullReport(),

  async runFullPipeline({ dryRun = false } = {}) {
    const profiles = await ProfileHydrationService.hydrateAll({ dryRun });
    const applications = await ApplicationMigrationService.migrateAll({ dryRun });
    const documents = await DocumentMigrationService.migrateAll({ dryRun });
    const credentials = await CredentialMigrationService.hydrateAllCredentials({ dryRun });
    const report = dryRun ? null : await MigrationReconcileService.fullReport();
    return { dryRun, profiles, applications, documents, credentials, report };
  },
};
