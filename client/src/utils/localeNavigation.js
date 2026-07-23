import { buildLocalizedPath, stripLocaleFromPath } from '@shared/localization/localeUtils.js';
import { normalizeLocale } from '@shared/localization/localeResolver.js';
import { ENABLED_CONTENT_LOCALES, DEFAULT_LOCALE } from '@shared/localization/localeConfig.js';

/**
 * Switch current path to another locale, preserving route structure.
 * @param {string} pathname
 * @param {string} targetLocale
 */
export function switchPathLocale(pathname, targetLocale) {
  const { path } = stripLocaleFromPath(pathname);
  return buildLocalizedPath(path, normalizeLocale(targetLocale));
}

/**
 * Build localized path for language switcher.
 */
export function localizedPathFor(currentPath, targetLocale) {
  const loc = normalizeLocale(targetLocale);
  if (loc === DEFAULT_LOCALE) {
    return stripLocaleFromPath(currentPath).path;
  }
  if (!ENABLED_CONTENT_LOCALES.includes(loc)) {
    return stripLocaleFromPath(currentPath).path;
  }
  return switchPathLocale(currentPath, loc);
}
