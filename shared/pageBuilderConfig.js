/**
 * Page Builder pilot configuration & feature flags (C.6.4.9).
 * Additive — does not replace Site CMS or routing.
 */

/** @typedef {Object} PageBuilderPageConfig
 * @property {string} pageKey
 * @property {string} legacySlug - CMS static page slug for SEO fallback
 * @property {boolean} usePageBuilder
 * @property {string} canonicalPath
 * @property {string} [displayName]
 */

/** @type {Record<string, PageBuilderPageConfig>} */
export const PAGE_BUILDER_PAGES = {
  about: {
    pageKey: 'about',
    legacySlug: 'about',
    usePageBuilder: true,
    canonicalPath: '/about',
    displayName: 'About',
  },
  services: {
    pageKey: 'services',
    legacySlug: 'services',
    usePageBuilder: true,
    canonicalPath: '/services',
    displayName: 'Services',
  },
  'privacy-policy': {
    pageKey: 'privacy-policy',
    legacySlug: 'privacy-policy',
    usePageBuilder: true,
    canonicalPath: '/privacy-policy',
    displayName: 'Privacy Policy',
  },
  terms: {
    pageKey: 'terms',
    legacySlug: 'terms',
    usePageBuilder: true,
    canonicalPath: '/terms',
    displayName: 'Terms & Conditions',
  },
};

/** Pilot page keys with Page Builder enabled. */
export const PILOT_PAGE_BUILDER_KEYS = Object.values(PAGE_BUILDER_PAGES)
  .filter((p) => p.usePageBuilder)
  .map((p) => p.pageKey);

/**
 * @param {string} slugOrKey - legacy slug or pageKey
 */
export function getPageBuilderConfig(slugOrKey) {
  if (!slugOrKey) return null;
  const key = String(slugOrKey).trim();
  return PAGE_BUILDER_PAGES[key]
    || Object.values(PAGE_BUILDER_PAGES).find((p) => p.legacySlug === key || p.pageKey === key)
    || null;
}

export function isPageBuilderEnabled(slugOrKey) {
  return getPageBuilderConfig(slugOrKey)?.usePageBuilder === true;
}

export function listPilotPageBuilderPages() {
  return Object.values(PAGE_BUILDER_PAGES).filter((p) => p.usePageBuilder);
}
