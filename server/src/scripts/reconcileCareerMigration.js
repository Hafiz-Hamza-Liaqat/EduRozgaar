/**
 * Print migration reconcile report (CP1–CP3 + document/credential parity).
 * Usage: node server/src/scripts/reconcileCareerMigration.js
 */
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { MigrationReconcileService } from '../services/career/migration/MigrationReconcileService.js';
import { logger } from '../utils/logger.js';

async function main() {
  await connectDB();
  const report = await MigrationReconcileService.fullReport();
  logger.info('career_migration_reconcile', report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.overallPass ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
