import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

/**
 * Reusable layout for legal/static pages: SEO, breadcrumb JSON-LD, last-updated line.
 */
export function StaticPageShell({
  titleKey,
  descriptionKey,
  headingKey,
  breadcrumbKey,
  canonical,
  children,
  ns = 'static',
  seoNs = 'seo',
  noindex = false,
}) {
  const { t } = useTranslation([ns, seoNs, 'common']);
  const title = t(`${seoNs}:${titleKey}`);
  const description = t(`${seoNs}:${descriptionKey}`);
  const heading = t(`${ns}:${headingKey}`);
  const breadcrumbLabel = t(`${ns}:${breadcrumbKey}`);

  return (
    <>
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        noindex={noindex}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: breadcrumbLabel, url: canonical },
          ]),
          webPageSchema({ name: heading, description, url: canonical })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to={ROUTES.HOME} className="hover:text-primary dark:hover:text-mint">
            {t('seo:breadcrumbHome')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{breadcrumbLabel}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{heading}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t(`${ns}:lastUpdated`)}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          {children}
        </div>
      </div>
    </>
  );
}

export function StaticSection({ titleKey, bodyKey, ns = 'static' }) {
  const { t } = useTranslation(ns);
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t(titleKey)}</h2>
      <p>{t(bodyKey)}</p>
    </section>
  );
}
