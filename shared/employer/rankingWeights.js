/**
 * Employer candidate ranking weights (C.8.5) — deterministic, versioned, explainable.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEIGHT_FILES = { '1.0.0': 'ranking/v1.json' };
export const DEFAULT_RANKING_VERSION = '1.0.0';
const cache = new Map();

export function loadRankingConfig(version = DEFAULT_RANKING_VERSION) {
  if (cache.has(version)) return cache.get(version);
  const rel = WEIGHT_FILES[version];
  if (!rel) throw new Error(`Unknown ranking weight version: ${version}`);
  const config = JSON.parse(readFileSync(join(__dirname, rel), 'utf8'));
  cache.set(version, config);
  return config;
}

export function getRankingWeights(version = DEFAULT_RANKING_VERSION) {
  const config = loadRankingConfig(version);
  return { version: config.version, weights: { ...config.ranking } };
}
