/**
 * Migrate legacy Application / InternshipApplication → OpportunityApplication.
 * Usage: node server/src/scripts/migrateOpportunityApplications.js [--dry-run]
 */
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { ApplicationMigrationService } from '../services/career/migration/ApplicationMigrationService.js';
import { logger } from '../utils/logger.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await connectDB();
  logger.info('application_migration_start', { dryRun });
  const result = await ApplicationMigrationService.migrateAll({ dryRun });
  logger.info('application_migration_complete', result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
