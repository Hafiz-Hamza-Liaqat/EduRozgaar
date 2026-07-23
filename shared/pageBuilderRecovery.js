/**
 * Local draft recovery storage (C.6.4.15).
 */
import { createDraftSnapshot } from './pageBuilderEditorOps.js';

const PREFIX = 'pb-draft-recovery:';

export function recoveryStorageKey(pageKey, locale) {
  return `${PREFIX}${String(pageKey).trim()}:${locale || 'en'}`;
}

/**
 * @param {string} pageKey
 * @param {string} locale
 * @param {{ title: string; draftBlocks: import('./blockSchema.js').PageBlock[]; savedAt: number; baselineSnapshot?: string }} payload
 */
export function writeRecoveryDraft(pageKey, locale, payload) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(recoveryStorageKey(pageKey, locale), JSON.stringify({
      pageKey: String(pageKey).trim(),
      locale: locale || 'en',
      title: payload.title,
      draftBlocks: payload.draftBlocks,
      savedAt: payload.savedAt,
      snapshot: createDraftSnapshot(payload.title, payload.draftBlocks),
      baselineSnapshot: payload.baselineSnapshot || null,
    }));
  } catch {
    // quota or private mode
  }
}

/**
 * @param {string} pageKey
 * @param {string} locale
 */
export function readRecoveryDraft(pageKey, locale) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(recoveryStorageKey(pageKey, locale));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRecoveryDraft(pageKey, locale) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(recoveryStorageKey(pageKey, locale));
  } catch {
    // ignore
  }
}

/**
 * @param {string} currentSnapshot
 * @param {string|null|undefined} baselineSnapshot
 * @param {{ snapshot?: string; savedAt?: number }|null} recovery
 */
export function shouldOfferRecovery(currentSnapshot, baselineSnapshot, recovery) {
  if (!recovery?.snapshot) return false;
  if (!baselineSnapshot) return false;
  if (recovery.snapshot === baselineSnapshot) return false;
  if (recovery.snapshot === currentSnapshot) return false;
  return true;
}
