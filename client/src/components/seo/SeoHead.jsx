import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import {
  SEO_CONFIG,
  buildCanonicalUrl,
  resolveOgImage,
  truncateDescription,
  buildAlternateUrls,
  formatPageTitle,
} from '../../seo/config';
import { safeJsonLd } from '../../seo/sanitize';

/**
 * Unified SEO head component for all pages.
 */
export default function SeoHead({
  title,
  description,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  robots,
  noindex = false,
  jsonLd,
  language,
  alternateUrls,
  children,
}) {
  const { lang } = useLanguage();
  const siteLang = language || lang || 'en';
  const fullTitle = formatPageTitle(title);
  const desc = truncateDescription(description);
  const canonicalUrl = !noindex && canonical != null ? buildCanonicalUrl(canonical) : undefined;
  const ogImg = resolveOgImage(ogImage);
  const twImg = resolveOgImage(twitterImage || ogImage);
  const robotsContent = noindex ? 'noindex, nofollow' : robots || 'index, follow';

  const resolvedOgTitle = ogTitle || fullTitle;
  const resolvedOgDesc = truncateDescription(ogDescription || description);
  const resolvedTwTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwDesc = truncateDescription(twitterDescription || ogDescription || description);
  const resolvedOgImageAlt = ogImageAlt || resolvedOgTitle;

  const alternates =
    !noindex && (alternateUrls || (canonical != null ? buildAlternateUrls(canonical) : null));

  const jsonLdPayload = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd.length === 1
        ? jsonLd[0]
        : { '@context': 'https://schema.org', '@graph': jsonLd }
      : jsonLd
    : null;

  return (
    <Helmet prioritizeSeoTags>
      <html lang={siteLang === 'ur' ? 'ur' : 'en'} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {alternates &&
        Object.entries(alternates).map(([hreflang, href]) => (
          <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
        ))}

      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:alt" content={resolvedOgImageAlt} />
      <meta property="og:locale" content={siteLang === 'ur' ? 'ur_PK' : 'en_PK'} />
      <meta property="og:locale:alternate" content={siteLang === 'ur' ? 'en_PK' : 'ur_PK'} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={SEO_CONFIG.twitterSite} />
      <meta name="twitter:creator" content={SEO_CONFIG.twitterCreator} />
      <meta name="twitter:title" content={resolvedTwTitle} />
      <meta name="twitter:description" content={resolvedTwDesc} />
      <meta name="twitter:image" content={twImg} />
      <meta name="twitter:image:alt" content={resolvedOgImageAlt} />
      {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}

      {jsonLdPayload && (
        <script type="application/ld+json">{safeJsonLd(jsonLdPayload)}</script>
      )}
      {children}
    </Helmet>
  );
}
