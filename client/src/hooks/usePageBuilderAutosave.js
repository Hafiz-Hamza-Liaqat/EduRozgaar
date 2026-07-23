import { useCallback, useEffect, useRef, useState } from 'react';
import { adminContentApi } from '../services/adminContentApi';
import { reindexBlocks } from '@shared/blockSchema.js';
import { writeRecoveryDraft, clearRecoveryDraft } from '@shared/pageBuilderRecovery.js';

const DEFAULT_DELAY_MS = 15000;

/**
 * Debounced draft autosave with offline/retry indicators (C.6.4.15).
 */
export function usePageBuilderAutosave({
  pageKey,
  locale,
  title,
  draftBlocks,
  isDirty,
  synced,
  loading,
  saving,
  publishing,
  baselineSnapshot,
  applySavedLayout,
  delayMs = DEFAULT_DELAY_MS,
  enabled = true,
}) {
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved | offline | error
  const saveGenRef = useRef(0);
  const timerRef = useRef(null);
  const lastManualSaveRef = useRef(0);

  const bumpManualSave = useCallback(() => {
    lastManualSaveRef.current = Date.now();
    saveGenRef.current += 1;
  }, []);

  const persistRecovery = useCallback(() => {
    if (!isDirty || !pageKey) return;
    writeRecoveryDraft(pageKey, locale, {
      title,
      draftBlocks,
      savedAt: Date.now(),
      baselineSnapshot,
    });
  }, [isDirty, pageKey, locale, title, draftBlocks, baselineSnapshot]);

  useEffect(() => {
    if (!enabled || !isDirty || !synced || loading || saving || publishing) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return undefined;
    }

    setStatus('pending');
    timerRef.current = setTimeout(async () => {
      const scheduledGen = saveGenRef.current;
      if (Date.now() - lastManualSaveRef.current < 500) return;

      setStatus('saving');
      try {
        const { data } = await adminContentApi.savePageLayout({
          pageKey: String(pageKey).trim(),
          locale,
          title: String(title || '').trim() || pageKey,
          draftBlocks: reindexBlocks(draftBlocks),
        });

        if (scheduledGen !== saveGenRef.current) return;

        if (applySavedLayout(data)) {
          clearRecoveryDraft(pageKey, locale);
          setStatus('saved');
        }
      } catch (err) {
        if (scheduledGen !== saveGenRef.current) return;
        if (!navigator.onLine) {
          setStatus('offline');
          persistRecovery();
        } else {
          setStatus('error');
        }
      }
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    enabled, isDirty, synced, loading, saving, publishing,
    pageKey, locale, title, draftBlocks, delayMs,
    applySavedLayout, persistRecovery,
  ]);

  useEffect(() => {
    if (isDirty) persistRecovery();
  }, [isDirty, persistRecovery]);

  const retry = useCallback(async () => {
    if (!isDirty || saving || publishing) return;
    bumpManualSave();
    setStatus('saving');
    try {
      const { data } = await adminContentApi.savePageLayout({
        pageKey: String(pageKey).trim(),
        locale,
        title: String(title || '').trim() || pageKey,
        draftBlocks: reindexBlocks(draftBlocks),
      });
      if (applySavedLayout(data)) {
        clearRecoveryDraft(pageKey, locale);
        setStatus('saved');
      }
    } catch {
      setStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [isDirty, saving, publishing, bumpManualSave, pageKey, locale, title, draftBlocks, applySavedLayout]);

  useEffect(() => {
    if (!isDirty && status === 'saved') {
      const t = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isDirty, status]);

  return { autosaveStatus: status, bumpManualSave, retryAutosave: retry };
}
