#!/usr/bin/env node
/**
 * Sprint C.6.4.7 — Placement coverage verification
 * Run: npm run verify:placements
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  extractAdHostPlacementsFromSource,
  mergeAdHostScanMaps,
  validatePlacementCoverage,
  formatCoverageReport,
} from '../shared/placementCoverage.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const clientPages = join(root, 'client', 'src', 'pages');

function walkJsx(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkJsx(full, acc);
    else if (/\.(jsx|tsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

function scanClientAdHosts() {
  const files = walkJsx(clientPages);
  const maps = files.map((file) => {
    const rel = relative(root, file).replace(/\\/g, '/');
    const source = readFileSync(file, 'utf8');
    return extractAdHostPlacementsFromSource(rel, source);
  });
  return { merged: mergeAdHostScanMaps(maps), files: files.map((f) => relative(root, f).replace(/\\/g, '/')) };
}

const { merged, files } = scanClientAdHosts();
const cmsBannerFiles = files.filter((f) => /Home\/Home\.jsx$/i.test(f));

const result = validatePlacementCoverage(merged, { cmsBannerFiles });
console.log(formatCoverageReport(result));

if (merged.size) {
  console.log('\nAdHost placements found in code:');
  for (const [id, paths] of [...merged.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${id} → ${paths.join(', ')}`);
  }
}

process.exit(result.ok ? 0 : 1);
