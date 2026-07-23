/**
 * Canonical locale configuration (C.7.0.8).
 * Single source of truth — do not duplicate locale lists elsewhere.
 */

export const DEFAULT_LOCALE = 'en';
export const FALLBACK_LOCALE = 'en';

/** All platform locales (including future-ready). */
export const SUPPORTED_LOCALES = ['en', 'ur', 'ar'];

/** Locales enabled for public content creation. */
export const ENABLED_CONTENT_LOCALES = ['en', 'ur'];

/** Locales enabled in public UI (matches client i18n when synced). */
export const ENABLED_UI_LOCALES = ['en', 'ur'];

export const LOCALE_META = {
  en: {
    code: 'en',
    label: 'EN',
    name: 'English',
    dir: 'ltr',
    bcp47: 'en-PK',
    ogLocale: 'en_PK',
    enabled: true,
    contentEnabled: true,
  },
  ur: {
    code: 'ur',
    label: 'UR',
    name: 'Urdu',
    dir: 'rtl',
    bcp47: 'ur-PK',
    ogLocale: 'ur_PK',
    enabled: true,
    contentEnabled: true,
  },
  ar: {
    code: 'ar',
    label: 'AR',
    name: 'Arabic',
    dir: 'rtl',
    bcp47: 'ar-SA',
    ogLocale: 'ar_SA',
    enabled: false,
    contentEnabled: false,
  },
};

/** Entity types that support per-locale content records. */
export const TRANSLATABLE_ENTITY_TYPES = [
  'blog',
  'job',
  'scholarship',
  'admission',
  'university',
  'career-guidance',
  'cms-page',
  'page-builder-page',
  'form',
];

export const TRANSLATION_STATUSES = [
  'draft',
  'needs_translation',
  'needs_update',
  'published',
  'archived',
];

export function isSupportedLocale(code) {
  return SUPPORTED_LOCALES.includes(String(code || '').toLowerCase().split('-')[0]);
}

export function isContentLocaleEnabled(code) {
  const locale = String(code || '').toLowerCase().split('-')[0];
  return ENABLED_CONTENT_LOCALES.includes(locale);
}

export function getLocaleMeta(code) {
  const locale = String(code || DEFAULT_LOCALE).toLowerCase().split('-')[0];
  return LOCALE_META[locale] || LOCALE_META[DEFAULT_LOCALE];
}

export function getTextDirection(code) {
  return getLocaleMeta(code).dir || 'ltr';
}
