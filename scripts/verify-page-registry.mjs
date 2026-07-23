#!/usr/bin/env node
/**
 * Sprint C.6.4.3 — Page & Placement Registry verification
 * Run: node scripts/verify-page-registry.mjs
 * Or:  npm run verify:registry
 */
import { validateRegistries, formatValidationReport } from '../shared/registryUtils.js';
import {
  validateBlockRegistry,
  extractRendererKeysFromMapSource,
  formatBlockRegistryReport,
} from '../shared/blockRegistryValidation.js';
import {
  validatePageBuilderRuntime,
  formatPageBuilderRuntimeReport,
} from '../shared/pageBuilderRuntimeValidation.js';
import {
  extractAdHostPlacementsFromSource,
  mergeAdHostScanMaps,
  validatePlacementCoverage,
  formatCoverageReport,
} from '../shared/placementCoverage.js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const clientPages = join(root, 'client', 'src', 'pages');

function walkJsx(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkJsx(full, acc);
    else if (/\.(jsx|tsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

function scanAdHosts() {
  const files = walkJsx(clientPages);
  return mergeAdHostScanMaps(files.map((file) => {
    const rel = relative(root, file).replace(/\\/g, '/');
    return extractAdHostPlacementsFromSource(rel, readFileSync(file, 'utf8'));
  }));
}

let slugTypes = null;
try {
  const mod = await import('../server/src/services/slugService.js');
  slugTypes = mod.SLUG_RESOURCE_TYPES;
} catch {
  console.warn('Note: SlugService not loaded — skipping slug type cross-check');
}

const result = validateRegistries(slugTypes);
console.log(formatValidationReport(result));

const coverage = validatePlacementCoverage(scanAdHosts(), {
  cmsBannerFiles: ['client/src/pages/Home/Home.jsx'],
});
console.log('');
console.log(formatCoverageReport(coverage));

const blockMapFile = join(root, 'client', 'src', 'components', 'pageBuilder', 'blockComponentMap.js');
const blockMapSource = readFileSync(blockMapFile, 'utf8');
const blockResult = validateBlockRegistry(extractRendererKeysFromMapSource(blockMapSource));
console.log('');
console.log(formatBlockRegistryReport(blockResult));

const runtimeResult = validatePageBuilderRuntime();
console.log('');
console.log(formatPageBuilderRuntimeReport(runtimeResult));

process.exit(result.ok && coverage.ok && blockResult.ok && runtimeResult.ok ? 0 : 1);
