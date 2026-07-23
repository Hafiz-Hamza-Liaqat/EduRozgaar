/**
 * Migrate legacy ProfileDocument → Document platform.
 * Usage: node server/src/scripts/migrateProfileDocuments.js [--dry-run]
 */
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { DocumentMigrationService } from '../services/career/migration/DocumentMigrationService.js';
import { logger } from '../utils/logger.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await connectDB();
  logger.info('document_migration_start', { dryRun });
  const result = await DocumentMigrationService.migrateAll({ dryRun });
  logger.info('document_migration_complete', result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
