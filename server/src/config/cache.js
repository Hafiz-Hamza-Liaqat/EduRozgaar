/**
 * Canonical platform cache abstraction (C.7.0.9).
 * All domain caches (search, analytics, dynamic, workflow, related) use this layer.
 * Backed by Redis when REDIS_URL is set; in-memory fallback otherwise.
 */
import { cacheGet, cacheSet, cacheDel, cacheDelPattern, getRedisClient } from './redis.js';

/** @type {Map<string, { value: unknown; expiresAt: number }>} */
const l1 = new Map();

export const CACHE_NAMESPACES = {
  search: 'search',
  analytics: 'analytics',
  dynamic: 'dynamic',
  workflow: 'workflow',
  related: 'related',
  rate: 'rate',
  session: 'session',
  career: 'career',
};

function fullKey(namespace, key) {
  const ns = namespace ? `${namespace}:` : '';
  return `${ns}${key}`;
}

/**
 * @param {string} namespace
 * @param {string} key
 * @param {number} [ttlMs]
 */
export async function platformCacheGet(namespace, key) {
  const fk = fullKey(namespace, key);
  const entry = l1.get(fk);
  if (entry && Date.now() <= entry.expiresAt) return entry.value;
  if (entry) l1.delete(fk);

  const remote = await cacheGet(fk);
  if (remote !== null && remote !== undefined) {
    l1.set(fk, { value: remote, expiresAt: Date.now() + 30_000 });
    return remote;
  }
  return null;
}

/**
 * @param {string} namespace
 * @param {string} key
 * @param {unknown} value
 * @param {number} [ttlMs]
 */
export async function platformCacheSet(namespace, key, value, ttlMs = 60_000) {
  const fk = fullKey(namespace, key);
  l1.set(fk, { value, expiresAt: Date.now() + ttlMs });
  const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
  await cacheSet(fk, value, ttlSec);
}

/**
 * @param {string} namespace
 * @param {string} key
 */
export async function platformCacheDel(namespace, key) {
  const fk = fullKey(namespace, key);
  l1.delete(fk);
  await cacheDel(fk);
}

/**
 * @param {string} namespace
 * @param {string} [prefixWithinNamespace]
 */
export async function platformCacheInvalidateNamespace(namespace, prefixWithinNamespace = '') {
  const prefix = fullKey(namespace, prefixWithinNamespace);
  for (const k of l1.keys()) {
    if (k.startsWith(prefix)) l1.delete(k);
  }
  await cacheDelPattern(prefix);
}

export async function getCacheStats() {
  const redis = await getRedisClient();
  let redisInfo = null;
  if (redis) {
    try {
      const info = await redis.info('stats');
      const hits = info.match(/keyspace_hits:(\d+)/)?.[1];
      const misses = info.match(/keyspace_misses:(\d+)/)?.[1];
      redisInfo = {
        connected: true,
        keyspaceHits: hits ? Number(hits) : undefined,
        keyspaceMisses: misses ? Number(misses) : undefined,
      };
    } catch {
      redisInfo = { connected: false };
    }
  }
  return {
    l1Size: l1.size,
    redis: redisInfo || { connected: false, mode: 'in-memory' },
  };
}

export function buildNamespacedCacheKey(namespace, prefix, params = {}) {
  const normalized = Object.keys(params).sort().reduce((acc, k) => {
    acc[k] = params[k];
    return acc;
  }, {});
  return `${namespace}:${prefix}:${JSON.stringify(normalized)}`;
}
