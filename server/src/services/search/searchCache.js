/**
 * Search result cache — delegates to platform cache (C.7.0.9).
 */
import { SEARCH_DEFAULT_TTL_MS } from '../../../../shared/search/rankingWeights.js';
import {
  CACHE_NAMESPACES,
  platformCacheGet,
  platformCacheSet,
  platformCacheInvalidateNamespace,
} from '../../config/cache.js';

const NS = CACHE_NAMESPACES.search;
const DEFAULT_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS) || SEARCH_DEFAULT_TTL_MS;

export async function searchCacheGet(key) {
  return platformCacheGet(NS, key);
}

export async function searchCacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  await platformCacheSet(NS, key, value, ttlMs);
}

export async function searchCacheInvalidatePrefix(prefix) {
  await platformCacheInvalidateNamespace(NS, prefix);
}

export async function searchCacheClear() {
  await platformCacheInvalidateNamespace(NS, '');
}

export function searchCacheStats() {
  return { namespace: NS, defaultTtlMs: DEFAULT_TTL_MS };
}

export function buildSearchCacheKey(params) {
  const normalized = Object.keys(params).sort().reduce((acc, k) => {
    acc[k] = params[k];
    return acc;
  }, {});
  return JSON.stringify(normalized);
}
