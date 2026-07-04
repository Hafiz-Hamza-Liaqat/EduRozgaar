import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { blogPostingSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { buildCanonicalUrl } from '../../seo/config';
import { blogsApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { SAMPLE_BLOGS } from '../../constants/seedData';

function readingTimeMinutes(content) {
  if (!content || typeof content !== 'string') return 5;
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

function extractHeadings(content) {
  if (!content || typeof content !== 'string') return [];
  const lines = content.split('\n');
  return lines
    .filter((line) => /^#{2,3}\s/.test(line.trim()))
    .map((line) => ({ level: line.match(/^#+/)?.[0]?.length || 2, text: line.replace(/^#+\s*/, '').trim() }));
}

function ShareButtons({ title, url }) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || '');
  const text = encodeURIComponent(`${title} – EduRozgaar`);

  return (
    <div className="flex flex-wrap gap-2 mt-6">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
      >
        Share on X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
      >
        Facebook
      </a>
      <a
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
      >
        WhatsApp
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url || window.location.href);
        }}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
      >
        Copy link
      </button>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    blogsApi.get(slug)
      .then(({ data }) => setPost(data))
      .catch(() => {
        const sample = SAMPLE_BLOGS.find((p) => p.slug === slug);
        setPost(sample ? { title: sample.title, excerpt: sample.excerpt, content: sample.excerpt, slug: sample.slug } : null);
        setError(sample ? null : 'Not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post?.slug) return;
    blogsApi.list({ limit: 10, status: 'published' })
      .then(({ data }) => {
        const list = data?.data || data || [];
        setRelated(list.filter((p) => (p.slug || p._id) !== post.slug).slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [post?.slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post not found</h1>
        <Link to={ROUTES.BLOG} className="text-edur-steel dark:text-edur-sky mt-4 inline-block hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  const canonicalPath = `${ROUTES.BLOG}/${post.slug}`;
  const readingMin = readingTimeMinutes(post.content || post.excerpt);
  const toc = extractHeadings(post.content);

  return (
    <>
      <SeoHead
        title={`${post.title} – Blog`}
        description={post.excerpt || post.title}
        canonical={canonicalPath}
        ogType="article"
        ogImage={post.featuredImage || post.imageUrl || undefined}
        ogImageAlt={post.title}
        jsonLd={combineSchemas(
          blogPostingSchema(post, { readingMinutes: readingMin }),
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Blog', url: ROUTES.BLOG },
            { name: post.title, url: canonicalPath },
          ]),
        )}
      />
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Link to={ROUTES.BLOG} className="text-sm text-edur-steel dark:text-edur-sky hover:underline mb-6 inline-block">← Back to Blog</Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{post.author || 'EduRozgaar'}</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
          <span>{readingMin} min read</span>
        </div>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded bg-edur-sky/20 dark:bg-edur-sky/10 text-edur-steel dark:text-edur-sky">{t}</span>
            ))}
          </div>
        )}

        {post.featuredImage ? (
          <img src={post.featuredImage || post.imageUrl} alt={post.title} className="w-full rounded-xl mt-6 object-cover max-h-64" loading="lazy" />
        ) : (
          <div className="w-full h-48 rounded-xl mt-6 bg-gradient-to-br from-edur-steel/20 to-edur-blue/20 dark:from-edur-steel/30 dark:to-edur-blue/30 flex items-center justify-center text-edur-steel/50 dark:text-edur-sky/50 text-sm">
            Featured image
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="flex-1 min-w-0">
            <div className="prose dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-w-none">
              {post.content || post.excerpt}
            </div>
            <ShareButtons title={post.title} url={buildCanonicalUrl(canonicalPath)} />
          </div>
          {toc.length > 0 && (
            <aside className="lg:w-56 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Table of contents</h3>
              <nav className="space-y-1 text-sm">
                {toc.map((h, i) => (
                  <a key={i} href={`#h-${i}`} className="block text-edur-steel dark:text-edur-sky hover:underline pl-0">
                    {h.text}
                  </a>
                ))}
              </nav>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related posts</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link key={p._id || p.slug} to={`${ROUTES.BLOG}/${p.slug}`} className="block p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-edur-blue/50 card-hover">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
