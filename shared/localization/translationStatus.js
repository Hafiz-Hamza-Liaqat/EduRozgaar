/**
 * Translation status helpers (C.7.0.8).
 */
import { TRANSLATION_STATUSES } from './localeConfig.js';
import { normalizeLocale } from './localeResolver.js';

export const TRANSLATION_STATUS_LABELS = {
  draft: 'Draft',
  needs_translation: 'Needs Translation',
  needs_update: 'Needs Update',
  published: 'Published',
  archived: 'Archived',
};

export const TRANSLATION_STATUS_COLORS = {
  draft: 'gray',
  needs_translation: 'amber',
  needs_update: 'orange',
  published: 'green',
  archived: 'slate',
};

/**
 * @param {string} status
 */
export function isValidTranslationStatus(status) {
  return TRANSLATION_STATUSES.includes(status);
}

/**
 * Infer translation status when creating a new locale variant.
 * @param {string} targetLocale
 * @param {boolean} [copyPublished]
 */
export function defaultTranslationStatusForLocale(targetLocale, copyPublished = false) {
  const loc = normalizeLocale(targetLocale);
  if (loc === 'en') return copyPublished ? 'published' : 'draft';
  return 'needs_translation';
}

/**
 * Compute completeness % for a translation group.
 * @param {Array<{ locale: string; translationStatus?: string }>} variants
 * @param {string[]} requiredLocales
 */
export function computeTranslationCompleteness(variants = [], requiredLocales = ['en', 'ur']) {
  const byLocale = new Map(variants.map((v) => [normalizeLocale(v.locale), v]));
  let published = 0;
  for (const loc of requiredLocales) {
    const v = byLocale.get(normalizeLocale(loc));
    if (v && (v.translationStatus === 'published' || v.status === 'published' || v.status === 'active')) {
      published += 1;
    }
  }
  return {
    total: requiredLocales.length,
    published,
    percent: requiredLocales.length ? Math.round((published / requiredLocales.length) * 100) : 100,
    missing: requiredLocales.filter((loc) => {
      const v = byLocale.get(normalizeLocale(loc));
      return !v;
    }),
  };
}

/**
 * Badge label for admin UI.
 */
export function translationStatusLabel(status) {
  return TRANSLATION_STATUS_LABELS[status] || status || 'Unknown';
}
