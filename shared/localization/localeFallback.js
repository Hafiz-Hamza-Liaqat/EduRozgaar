/**
 * Locale fallback rules (C.7.0.8).
 */
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from './localeConfig.js';
import { normalizeLocale } from './localeResolver.js';

/**
 * Ordered fallback chain for content resolution.
 * @param {string} locale
 * @returns {string[]}
 */
export function getLocaleFallbackChain(locale) {
  const primary = normalizeLocale(locale);
  const chain = [primary];
  if (primary !== FALLBACK_LOCALE) chain.push(FALLBACK_LOCALE);
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return [...new Set(chain)];
}

/**
 * Build MongoDB $or filter matching locale with English backward compatibility.
 * Existing records without locale field are treated as English.
 * @param {string} locale
 */
export function mongoLocaleFilter(locale) {
  const loc = normalizeLocale(locale);
  if (loc === DEFAULT_LOCALE) {
    return {
      $or: [
        { locale: DEFAULT_LOCALE },
        { locale: { $exists: false } },
        { locale: null },
        { locale: '' },
      ],
    };
  }
  return { locale: loc };
}

/**
 * Resolve a field from a translations map with fallback.
 * @param {Record<string, *>} translations
 * @param {string} locale
 * @param {string} [fallbackLocale]
 */
export function resolveTranslatedField(translations = {}, locale, fallbackLocale = FALLBACK_LOCALE) {
  if (!translations || typeof translations !== 'object') return undefined;
  for (const loc of getLocaleFallbackChain(locale)) {
    if (translations[loc] !== undefined && translations[loc] !== null && translations[loc] !== '') {
      return translations[loc];
    }
  }
  if (translations[fallbackLocale] !== undefined) return translations[fallbackLocale];
  return translations[DEFAULT_LOCALE];
}
