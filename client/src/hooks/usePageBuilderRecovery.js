import { useCallback, useEffect, useState } from 'react';
import { readRecoveryDraft, clearRecoveryDraft, shouldOfferRecovery } from '@shared/pageBuilderRecovery.js';
import { createDraftSnapshot } from '@shared/pageBuilderEditorOps.js';
import { reindexBlocks } from '@shared/blockSchema.js';

/**
 * Crash recovery prompt for unsaved local drafts (C.6.4.15).
 */
export function usePageBuilderRecovery({
  pageKey,
  locale,
  loading,
  baselineSnapshot,
  title,
  draftBlocks,
  onRestore,
}) {
  const [recovery, setRecovery] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (loading || !baselineSnapshot || !pageKey) return;
    const stored = readRecoveryDraft(pageKey, locale);
    const current = createDraftSnapshot(title, draftBlocks);
    if (shouldOfferRecovery(current, baselineSnapshot, stored)) {
      setRecovery(stored);
    } else {
      setRecovery(null);
    }
  }, [loading, baselineSnapshot, pageKey, locale, title, draftBlocks]);

  const restore = useCallback(() => {
    if (!recovery) return;
    onRestore({
      title: recovery.title || pageKey,
      draftBlocks: reindexBlocks(recovery.draftBlocks || []),
    });
    clearRecoveryDraft(pageKey, locale);
    setRecovery(null);
    setDismissed(true);
  }, [recovery, onRestore, pageKey, locale]);

  const discard = useCallback(() => {
    clearRecoveryDraft(pageKey, locale);
    setRecovery(null);
    setDismissed(true);
  }, [pageKey, locale]);

  const showPrompt = Boolean(recovery && !dismissed);

  return { showRecoveryPrompt: showPrompt, recovery, restoreRecovery: restore, discardRecovery: discard };
}
