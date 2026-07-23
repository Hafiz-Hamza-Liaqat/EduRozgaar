import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { blogsApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { SAMPLE_BLOGS } from '../../constants/seedData';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { AdHost } from '../../components/ads';

function readingTime(content) {
  if (!content || typeof content !== 'string') return 5;
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

export default function Blog() {
  const { t } = useTranslation(['blog', 'seo', 'common']);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  const categories = [
    { labelKey: 'categoryAll', value: '' },
    { labelKey: 'categoryCareerAdvice', value: 'Career' },
    { labelKey: 'categoryScholarships', value: 'Scholarships' },
    { labelKey: 'categoryJobPrep', value: 'Job Preparation' },
    { labelKey: 'categoryIntlStudy', value: 'International Study' },
    { labelKey: 'categoryPlatformUpdates', value: 'Platform Updates' },
  ];

  useEffect(() => {
    blogsApi.list({ limit: 30, status: 'published' })
      .then(({ data }) => setPosts(data?.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const list = posts.length > 0 ? posts : SAMPLE_BLOGS.map((p) => ({ _id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.excerpt, publishedAt: p.date, createdAt: p.date }));
  const filtered = !category ? list : list.filter((p) => (p.category || p.tags?.[0] || 'Career') === category);

  return (
    <>
      <SeoHead
        title={t('blog:seoFullTitle')}
        description={t('blog:seoFullDescription')}
        canonical={ROUTES.BLOG}
        keywords={`${t('blog:seoKeywords')}, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('blog:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('blog:breadcrumbBlog'), url: ROUTES.BLOG },
          ]),
          collectionPageSchema({
            name: t('blog:seoFullTitle'),
            description: t('blog:seoFullDescription'),
            url: ROUTES.BLOG,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AdHost placementId="blog-header" className="mb-6" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
        <ScrollReveal>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('blog:pageTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('blog:subtitle')}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(({ labelKey, value }) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => setCategory(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === value ? 'bg-edur-steel text-white dark:bg-edur-sky dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                {t(`blog:${labelKey}`)}
              </button>
            ))}
          </div>
        </ScrollReveal>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((post) => (
                <Link
                  key={post._id || post.slug}
                  to={`${ROUTES.BLOG}/${post.slug}`}
                  className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 dark:hover:border-edur-sky/50 transition-all duration-200 card-hover"
                >
                  <span className="text-xs font-medium text-edur-steel dark:text-edur-sky">{post.category || post.tags?.[0] || 'Career'}</span>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{post.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{post.excerpt}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('blog:minRead', { count: readingTime(post.content || post.excerpt) })} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                  </p>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        )}
          </div>
          <aside className="w-full lg:w-64 flex-shrink-0">
            <AdHost placementId="blog-sidebar" variant="sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
