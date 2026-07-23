import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, articleSchema } from '../../seo/schemas';
import { buildCanonicalUrl } from '../../seo/config';
import { careerArticlesApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Alert } from '../../components/ui/Alerts';
import { sanitizeHtmlForRender } from '../../utils/sanitizeHtml';
import { useContentView } from '../../hooks/usePageView';

export default function CareerArticleDetail() {
  const { slug } = useParams();
  const { t } = useTranslation(['career', 'common']);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useContentView('career-guidance', article?._id, 'career_guidance_view');

  useEffect(() => {
    careerArticlesApi.get(slug)
      .then(({ data }) => setArticle(data))
      .catch((err) => setError(err.response?.data?.error || t('common:failedToLoad')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><ListingCardSkeleton /></div>;
  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Alert variant="error">{error || t('career:articleNotFound')}</Alert>
        <Link to={ROUTES.CAREER_GUIDANCE} className="text-primary dark:text-mint mt-4 inline-block">{t('career:backToCareer')}</Link>
      </div>
    );
  }

  const canonical = `/career-guidance/${article.slug}`;

  return (
    <>
      <SeoHead
        title={`${article.title} – ${t('career:title')}`}
        description={article.excerpt || article.title}
        canonical={canonical}
        ogType="article"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('career:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('career:title'), url: ROUTES.CAREER_GUIDANCE },
            { name: article.title, url: canonical },
          ]),
          articleSchema(article, { canonicalUrl: buildCanonicalUrl(canonical) })
        )}
      />
      <article className="max-w-3xl mx-auto px-4 py-8">
        <Link to={ROUTES.CAREER_GUIDANCE} className="text-sm text-edur-steel dark:text-edur-sky hover:underline mb-6 inline-block">
          ← {t('career:backToCareer')}
        </Link>
        {article.category && (
          <span className="text-xs font-medium text-edur-steel dark:text-edur-sky">{article.category}</span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">{article.title}</h1>
        {article.excerpt && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{article.excerpt}</p>
        )}
        <div
          className="prose prose-invert max-w-none text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(article.content || '') }}
        />
      </article>
    </>
  );
}
