import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminContentApi } from '../services/adminContentApi';
import { reindexBlocks } from '@shared/blockSchema.js';
import { createDraftSnapshot, isDraftDirty } from '@shared/pageBuilderEditorOps.js';
import {
  isDraftSynced,
  layoutRequestKey,
  shouldApplyLoadResponse,
} from './pageBuilderDraftUtils';

/**
 * Isolated Page Builder draft state — one load target at a time (C.6.4.9.2).
 * @param {string} pageKey
 * @param {string} locale
 * @param {{ onLoadError?: (message: string) => void }} [options]
 */
export function usePageBuilderDraft(pageKey, locale, options = {}) {
  const { onLoadError } = options;

  const [title, setTitle] = useState('');
  const [draftBlocks, setDraftBlocks] = useState([]);
  const [status, setStatus] = useState('draft');
  const [publishedAt, setPublishedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedPageKey, setLoadedPageKey] = useState(null);
  const [loadedLocale, setLoadedLocale] = useState(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState(null);

  const activeLoadKeyRef = useRef(null);
  const abortRef = useRef(null);

  const resetEditorState = useCallback(() => {
    setTitle('');
    setDraftBlocks([]);
    setStatus('draft');
    setPublishedAt(null);
    setLoadedPageKey(null);
    setLoadedLocale(null);
    setBaselineSnapshot(null);
  }, []);

  const trimmedPageKey = String(pageKey || '').trim();

  useEffect(() => {
    if (!trimmedPageKey) {
      resetEditorState();
      setLoading(false);
      return undefined;
    }

    const expectedLoadKey = layoutRequestKey(trimmedPageKey, locale);
    activeLoadKeyRef.current = expectedLoadKey;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    resetEditorState();
    setLoading(true);

    adminContentApi
      .getPageLayout(trimmedPageKey, locale, { signal: controller.signal })
      .then(({ data }) => {
        const responsePageKey = String(data?.pageKey || trimmedPageKey).trim();
        const apply = shouldApplyLoadResponse({
          activeLoadKey: activeLoadKeyRef.current,
          expectedLoadKey,
          responsePageKey,
          expectedPageKey: trimmedPageKey,
          aborted: controller.signal.aborted,
        });
        if (!apply) return;

        const loadedTitle = data.title || responsePageKey;
        const loadedBlocks = reindexBlocks(data.draftBlocks || []);
        setTitle(loadedTitle);
        setDraftBlocks(loadedBlocks);
        setStatus(data.status || 'draft');
        setPublishedAt(data.publishedAt || null);
        setLoadedPageKey(responsePageKey);
        setLoadedLocale(locale);
        setBaselineSnapshot(createDraftSnapshot(loadedTitle, loadedBlocks));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (activeLoadKeyRef.current !== expectedLoadKey) return;
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;

        onLoadError?.(err.response?.data?.error || 'Failed to load page layout');
        setTitle(trimmedPageKey);
        setDraftBlocks([]);
        setStatus('draft');
        setPublishedAt(null);
        setLoadedPageKey(trimmedPageKey);
        setLoadedLocale(locale);
        setBaselineSnapshot(createDraftSnapshot(trimmedPageKey, []));
      })
      .finally(() => {
        if (activeLoadKeyRef.current === expectedLoadKey && !controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [trimmedPageKey, locale, resetEditorState, onLoadError]);

  const synced = isDraftSynced({
    selectedPageKey: trimmedPageKey,
    selectedLocale: locale,
    loadedPageKey,
    loadedLocale,
    loading,
  });

  const applySavedLayout = useCallback((data) => {
    const responsePageKey = String(data?.pageKey || trimmedPageKey).trim();
    if (responsePageKey !== trimmedPageKey || loadedLocale !== locale) return false;
    const savedTitle = data.title ?? title;
    const savedBlocks = reindexBlocks(data.draftBlocks || []);
    if (data.title != null) setTitle(savedTitle);
    setDraftBlocks(savedBlocks);
    setStatus(data.status || 'draft');
    setPublishedAt(data.publishedAt ?? publishedAt);
    setLoadedPageKey(responsePageKey);
    setLoadedLocale(locale);
    setBaselineSnapshot(createDraftSnapshot(savedTitle, savedBlocks));
    return true;
  }, [trimmedPageKey, locale, loadedLocale, publishedAt, title]);

  const isDirty = useMemo(
    () => isDraftDirty(title, draftBlocks, baselineSnapshot),
    [title, draftBlocks, baselineSnapshot],
  );

  return {
    title,
    setTitle,
    draftBlocks,
    setDraftBlocks,
    status,
    publishedAt,
    setPublishedAt,
    loading,
    loadedPageKey,
    loadedLocale,
    synced,
    isDirty,
    applySavedLayout,
    baselineSnapshot,
  };
}
