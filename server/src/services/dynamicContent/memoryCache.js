/**
 * Dynamic content cache — delegates to platform cache (C.7.0.9).
 */
import {
  CACHE_NAMESPACES,
  platformCacheGet,
  platformCacheSet,
  platformCacheInvalidateNamespace,
} from '../../config/cache.js';

const NS = CACHE_NAMESPACES.dynamic;
const DEFAULT_TTL_MS = Number(process.env.DYNAMIC_CACHE_TTL_MS) || 60_000;

export async function cacheGet(key) {
  return platformCacheGet(NS, key);
}

export async function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  await platformCacheSet(NS, key, value, ttlMs);
}

export async function cacheInvalidatePrefix(prefix) {
  await platformCacheInvalidateNamespace(NS, prefix);
}

export async function invalidateDynamicSourceCache(source) {
  await cacheInvalidatePrefix(`dynamic:${source}:`);
}

export async function cacheClear() {
  await platformCacheInvalidateNamespace(NS, '');
}

export function cacheStats() {
  return { namespace: NS, defaultTtlMs: DEFAULT_TTL_MS };
}
