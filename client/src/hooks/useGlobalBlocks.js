import { useEffect, useMemo, useRef, useState } from 'react';
import { adminContentApi } from '../services/adminContentApi';
import { siteContentApi } from '../services/siteContentApi';
import {
  collectGlobalBlockIds,
  globalBlockMapFromList,
  resolveBlocksForRender,
} from '@shared/pageBuilderGlobalBlocks.js';

const cache = new Map();

/**
 * Fetch global blocks with in-memory cache (C.6.4.12).
 * @param {string[]} ids
 * @param {{ admin?: boolean }} [options]
 */
export function useGlobalBlocksBatch(ids, options = {}) {
  const { admin = false } = options;
  const [globalMap, setGlobalMap] = useState(() => new Map());
  const [loading, setLoading] = useState(false);
  const key = ids.slice().sort().join(',');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!ids.length) {
      setGlobalMap(new Map());
      setLoading(false);
      return undefined;
    }

    const fromCache = new Map();
    const missing = [];
    for (const id of ids) {
      if (cache.has(id)) fromCache.set(id, cache.get(id));
      else missing.push(id);
    }

    if (!missing.length) {
      setGlobalMap(fromCache);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const fetcher = admin
      ? () => adminContentApi.getGlobalBlocksBatch(missing)
      : () => siteContentApi.getGlobalBlocks(missing);

    fetcher()
      .then(({ data }) => {
        if (!mountedRef.current) return;
        const batch = globalBlockMapFromList(data?.items || []);
        for (const [id, doc] of batch.entries()) cache.set(id, doc);
        const merged = new Map(fromCache);
        for (const id of ids) {
          if (cache.has(id)) merged.set(id, cache.get(id));
        }
        setGlobalMap(merged);
      })
      .catch(() => {
        if (mountedRef.current) setGlobalMap(fromCache);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return undefined;
  }, [key, admin]);

  return { globalMap, loading };
}

/**
 * Resolve page blocks that reference global block storage.
 */
export function useResolvedPageBlocks(blocks, options = {}) {
  const ids = useMemo(() => collectGlobalBlockIds(blocks), [blocks]);
  const { globalMap, loading } = useGlobalBlocksBatch(ids, options);
  const resolved = useMemo(
    () => resolveBlocksForRender(blocks, globalMap),
    [blocks, globalMap],
  );
  return { resolved, globalMap, loading, globalIds: ids };
}

export function clearGlobalBlocksCache() {
  cache.clear();
}
