/**
 * Resolve effective locale from request/context (C.7.0.8).
 */
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  isSupportedLocale,
  isContentLocaleEnabled,
} from './localeConfig.js';

/**
 * Normalize any locale input to a supported code or default.
 * @param {string} [input]
 * @returns {string}
 */
export function normalizeLocale(input) {
  const code = String(input || DEFAULT_LOCALE).trim().toLowerCase().split('-')[0];
  if (!code) return DEFAULT_LOCALE;
  return isSupportedLocale(code) ? code : DEFAULT_LOCALE;
}

/**
 * Resolve locale for public content — falls back when disabled.
 * @param {string} [input]
 * @returns {string}
 */
export function resolveContentLocale(input) {
  const code = normalizeLocale(input);
  return isContentLocaleEnabled(code) ? code : DEFAULT_LOCALE;
}

/**
 * Resolve locale from Express request (query → header → default).
 * @param {import('express').Request} req
 */
export function resolveLocaleFromRequest(req) {
  const fromQuery = req.query?.locale || req.query?.lang;
  if (fromQuery) return resolveContentLocale(fromQuery);
  const accept = String(req.headers['accept-language'] || '').split(',')[0];
  if (accept) return resolveContentLocale(accept);
  return DEFAULT_LOCALE;
}

/**
 * Pick best available locale from a list of translated variants.
 * @param {string} preferred
 * @param {string[]} availableLocales
 * @param {string} [fallback]
 */
export function resolveLocaleWithFallback(preferred, availableLocales = [], fallback = FALLBACK_LOCALE) {
  const want = normalizeLocale(preferred);
  const set = new Set((availableLocales || []).map(normalizeLocale));
  if (set.has(want)) return want;
  const fb = normalizeLocale(fallback);
  if (set.has(fb)) return fb;
  if (set.has(DEFAULT_LOCALE)) return DEFAULT_LOCALE;
  return [...set][0] || fb;
}

/**
 * Strip locale prefix from a URL path segment.
 * @param {string} segment
 */
export function localeFromPathSegment(segment) {
  const s = String(segment || '').toLowerCase();
  return isSupportedLocale(s) && s !== DEFAULT_LOCALE ? s : null;
}
