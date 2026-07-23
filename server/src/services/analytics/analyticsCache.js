/**
 * Analytics aggregation cache — delegates to platform cache (C.7.0.9).
 */
import {
  CACHE_NAMESPACES,
  platformCacheGet,
  platformCacheSet,
  platformCacheInvalidateNamespace,
} from '../../config/cache.js';

const NS = CACHE_NAMESPACES.analytics;
const DEFAULT_TTL_MS = Number(process.env.ANALYTICS_CACHE_TTL_MS) || 120_000;

export async function analyticsCacheGet(key) {
  return platformCacheGet(NS, key);
}

export async function analyticsCacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  await platformCacheSet(NS, key, value, ttlMs);
}

export async function analyticsCacheClear() {
  await platformCacheInvalidateNamespace(NS, '');
}

export function analyticsCacheStats() {
  return { namespace: NS, defaultTtlMs: DEFAULT_TTL_MS };
}

export function buildAnalyticsCacheKey(prefix, params = {}) {
  const normalized = Object.keys(params).sort().reduce((acc, k) => {
    acc[k] = params[k];
    return acc;
  }, {});
  return `${prefix}:${JSON.stringify(normalized)}`;
}
