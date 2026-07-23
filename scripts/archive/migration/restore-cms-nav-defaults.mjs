#!/usr/bin/env node
/**
 * Restore published CMS header/homepage/footer corrupted by verify-sprint-c6-1 markers.
 * Usage: cd server && node --env-file=.env ../scripts/restore-cms-nav-defaults.mjs
 */
import { connectDB } from '../server/src/config/db.js';
import { restorePublishedCmsDefaults } from '../server/src/seed/cmsSiteContent.js';

await connectDB();
const restored = await restorePublishedCmsDefaults('en');
console.log('CMS restore complete:', restored);
const any = Object.values(restored).some(Boolean);
if (!any) console.log('No corruption detected — nothing changed.');
process.exit(0);
