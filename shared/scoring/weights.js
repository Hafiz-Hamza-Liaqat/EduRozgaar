/**
 * Scoring weight config loader (C.8.2).
 * Weights live in versioned JSON — not hardcoded in providers.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WEIGHT_FILES = {
  '1.0.0': 'weights/v1.json',
};

export const DEFAULT_WEIGHT_VERSION = '1.0.0';

const cache = new Map();

export function listWeightVersions() {
  return Object.keys(WEIGHT_FILES);
}

export function loadWeightConfig(version = DEFAULT_WEIGHT_VERSION) {
  if (cache.has(version)) return cache.get(version);
  const rel = WEIGHT_FILES[version];
  if (!rel) {
    throw new Error(`Unknown scoring weight version: ${version}`);
  }
  const config = JSON.parse(readFileSync(join(__dirname, rel), 'utf8'));
  cache.set(version, config);
  return config;
}

export function getProviderWeights(scoreType, version = DEFAULT_WEIGHT_VERSION) {
  const config = loadWeightConfig(version);
  const entry = config.scoreTypes?.[scoreType];
  if (!entry?.providers) {
    throw new Error(`No weight config for scoreType=${scoreType} version=${version}`);
  }
  return { version: config.version, ttlMinutes: entry.ttlMinutes || 15, providers: { ...entry.providers } };
}

export function getProviderWeight(scoreType, providerId, version = DEFAULT_WEIGHT_VERSION) {
  const { providers } = getProviderWeights(scoreType, version);
  return providers[providerId] ?? 0;
}
