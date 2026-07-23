#!/usr/bin/env node
/**
 * Hydrate TalentProfile records from User + Resume (C.8.0.2A).
 * Usage: node server/src/scripts/hydrateTalentProfiles.js [--dry-run]
 */
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { ProfileHydrationService } from '../services/career/ProfileHydrationService.js';
import { logger } from '../utils/logger.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await connectDB();
  logger.info('talent_hydration_start', { dryRun });
  const result = await ProfileHydrationService.hydrateAll({ dryRun });
  logger.info('talent_hydration_complete', result);
  console.log(JSON.stringify({ ok: true, dryRun, ...result }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
