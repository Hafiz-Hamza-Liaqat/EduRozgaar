/**
 * Page Builder admin draft isolation helpers (C.6.4.9.2).
 * Editor-only — no API or schema changes.
 */

export function layoutRequestKey(pageKey, locale) {
  return `${String(pageKey || '').trim()}:${locale || 'en'}`;
}

/**
 * True when UI draft state belongs to the currently selected page/locale.
 */
export function isDraftSynced({
  selectedPageKey,
  selectedLocale,
  loadedPageKey,
  loadedLocale,
  loading,
}) {
  if (loading) return false;
  const key = String(selectedPageKey || '').trim();
  if (!key) return false;
  return loadedPageKey === key && loadedLocale === selectedLocale;
}

/**
 * True when an in-flight load response may update the editor.
 */
export function shouldApplyLoadResponse({
  activeLoadKey,
  expectedLoadKey,
  responsePageKey,
  expectedPageKey,
  aborted,
}) {
  if (aborted) return false;
  if (activeLoadKey !== expectedLoadKey) return false;
  return String(responsePageKey || '').trim() === String(expectedPageKey || '').trim();
}
