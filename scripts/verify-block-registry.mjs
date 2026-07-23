#!/usr/bin/env node
/**
 * Sprint C.6.4.8 — Block Registry verification
 * Run: node scripts/verify-block-registry.mjs
 * Or:  npm run verify:blocks
 */
import { readFileSync } from 'fs';
import { docExists } from './lib/docExists.mjs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  validateBlockRegistry,
  extractRendererKeysFromMapSource,
  formatBlockRegistryReport,
} from '../shared/blockRegistryValidation.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const mapFile = join(root, 'client', 'src', 'components', 'pageBuilder', 'blockComponentMap.js');
const source = readFileSync(mapFile, 'utf8');
const clientKeys = extractRendererKeysFromMapSource(source);

const result = validateBlockRegistry(clientKeys);
console.log(formatBlockRegistryReport(result));
process.exit(result.ok ? 0 : 1);
