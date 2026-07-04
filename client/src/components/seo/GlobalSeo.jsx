import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { organizationSchema, websiteSchema } from '../../seo/schemas';
import { PRIVATE_ROUTE_PREFIXES } from '../../seo/config';
import { safeJsonLd } from '../../seo/sanitize';

/** Sitewide Organization + WebSite JSON-LD on public routes only */
export default function GlobalSeo() {
  const { pathname } = useLocation();
  const isPrivate = PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix)
  );

  if (isPrivate) return null;

  const graph = [organizationSchema(), websiteSchema()].filter(Boolean);

  return (
    <Helmet prioritizeSeoTags>
      <script type="application/ld+json">
        {safeJsonLd({ '@context': 'https://schema.org', '@graph': graph })}
      </script>
    </Helmet>
  );
}
