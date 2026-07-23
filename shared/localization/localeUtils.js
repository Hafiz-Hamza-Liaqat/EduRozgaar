/**
 * Locale URL and path utilities (C.7.0.8).
 */
import { DEFAULT_LOCALE } from './localeConfig.js';
import { normalizeLocale, localeFromPathSegment } from './localeResolver.js';

/**
 * Build a public path with optional locale prefix.
 * English stays unprefixed: /about
 * Urdu: /ur/about
 * @param {string} path - absolute path without locale (e.g. /about, /jobs/foo)
 * @param {string} [locale]
 */
export function buildLocalizedPath(path, locale) {
  const loc = normalizeLocale(locale);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!loc || loc === DEFAULT_LOCALE) return normalized;
  if (normalized === '/') return `/${loc}`;
  return `/${loc}${normalized}`;
}

/**
 * Strip leading locale segment from pathname.
 * @param {string} pathname
 * @returns {{ locale: string; path: string }}
 */
export function stripLocaleFromPath(pathname) {
  const raw = String(pathname || '/');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length) return { locale: DEFAULT_LOCALE, path: '/' };
  const maybeLocale = localeFromPathSegment(parts[0]);
  if (maybeLocale) {
    const rest = parts.slice(1).join('/');
    return { locale: maybeLocale, path: rest ? `/${rest}` : '/' };
  }
  return { locale: DEFAULT_LOCALE, path: raw.startsWith('/') ? raw : `/${raw}` };
}

/**
 * Build localized slug URL for listing detail pages.
 * @param {string} basePath - e.g. /jobs
 * @param {string} slug
 * @param {string} [locale]
 */
export function buildLocalizedSlugUrl(basePath, slug, locale) {
  if (!slug) return buildLocalizedPath(basePath, locale);
  const base = basePath.replace(/\/$/, '');
  return buildLocalizedPath(`${base}/${slug}`, locale);
}

/**
 * Prefix for SlugService preview URLs (cms-page style).
 */
export function localePathPrefix(locale) {
  const loc = normalizeLocale(locale);
  return loc === DEFAULT_LOCALE ? '' : `/${loc}`;
}

/**
 * SEO hreflang alternate path list for a canonical English path.
 * @param {string} path
 * @param {string[]} locales
 */
export function buildHreflangPaths(path, locales = ['en', 'ur']) {
  const out = {};
  for (const loc of locales) {
    out[loc] = buildLocalizedPath(path, loc);
  }
  return out;
}
