/** Site-wide SEO configuration for EduRozgaar */
export const SITE_URL = (import.meta.env.VITE_APP_URL || 'https://edurozgaar.pk').replace(/\/$/, '');
export const SITE_NAME = 'EduRozgaar';
export const SITE_TAGLINE = 'Jobs & Education Portal Pakistan';
export const DEFAULT_TITLE = `${SITE_NAME} – ${SITE_TAGLINE}`;
export const DEFAULT_DESCRIPTION =
  "EduRozgaar – Pakistan's job and education portal. Find jobs, scholarships, admissions, internships, and study abroad opportunities.";
export const DEFAULT_KEYWORDS =
  'jobs Pakistan, scholarships Pakistan, admissions, government jobs, FPSC, PPSC, NTS, education portal, EduRozgaar';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.svg`;
export const TWITTER_HANDLE = '@EduRozgaar';
export const THEME_COLOR = '#31708E';
export const LOCALE_EN = 'en_PK';
export const LOCALE_UR = 'ur_PK';

export const SEO_CONFIG = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  defaultTitle: DEFAULT_TITLE,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultKeywords: DEFAULT_KEYWORDS,
  defaultOgImage: DEFAULT_OG_IMAGE,
  twitterSite: TWITTER_HANDLE,
  twitterCreator: TWITTER_HANDLE,
  themeColor: THEME_COLOR,
  locale: LOCALE_EN,
};

/** Private route prefixes — excluded from sitemap and marked noindex */
export const PRIVATE_ROUTE_PREFIXES = [
  '/auth/',
  '/profile',
  '/dashboard',
  '/saved-jobs',
  '/employer',
  '/admin',
  '/resume-analyzer',
  '/badges',
];

export function buildCanonicalUrl(path = '/') {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) {
    const url = path.replace(/\/$/, '') || path;
    return url === `${SITE_URL}/` ? SITE_URL : url;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return SITE_URL;
  return `${SITE_URL}${normalized.replace(/\/$/, '')}`;
}

export function resolveOgImage(image) {
  if (!image) return DEFAULT_OG_IMAGE;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `${SITE_URL}${image}`;
  return `${SITE_URL}/${image}`;
}

export function truncateDescription(text, max = 160) {
  if (!text || typeof text !== 'string') return DEFAULT_DESCRIPTION;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

export function buildAlternateUrls(path = '/') {
  const base = buildCanonicalUrl(path);
  const separator = base.includes('?') ? '&' : '?';
  return {
    en: base,
    ur: `${base}${separator}lang=ur`,
    'x-default': base,
  };
}

export function formatPageTitle(title, suffix = SITE_NAME) {
  if (!title || !String(title).trim()) return DEFAULT_TITLE;
  if (title.includes(suffix)) return title;
  return `${title} – ${suffix}`;
}
