import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/formatDate';
import { sanitizeHtmlForRender } from '../../utils/sanitizeHtml';

export function CmsPageView({ page, canonical }) {
  const { t } = useTranslation(['seo', 'static']);

  const title = page.seoTitle || page.title;
  const description = page.metaDescription || page.heading || page.title;
  const heading = page.heading || page.title;
  const lastUpdated = page.lastUpdatedManually || page.updatedAt;

  return (
    <>
      <SeoHead
        title={title}
        description={description}
        canonical={page.canonicalUrl || canonical}
        ogImage={page.ogImageUrl}
        twitterCard={page.twitterCard}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: heading, url: canonical },
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
          <span className="text-gray-700 dark:text-gray-300">{heading}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{heading}</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {t('static:lastUpdated')}{lastUpdated ? `: ${formatDate(lastUpdated)}` : ''}
          </p>
        )}
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          {page.content && (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(page.content) }} />
          )}
          {(page.sections || []).map((sec, i) => (
            <section key={i}>
              {sec.title && <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{sec.title}</h2>}
              {sec.body && <div dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(sec.body) }} />}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
