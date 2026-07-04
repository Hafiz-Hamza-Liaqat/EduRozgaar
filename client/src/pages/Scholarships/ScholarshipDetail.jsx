import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { scholarshipSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { scholarshipsApi, savedApi, recentViewedApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Alert } from '../../components/ui/Alerts';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';

export default function ScholarshipDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    scholarshipsApi.get(slug).then(({ data }) => {
      setItem(data);
      if (isAuthenticated && data?._id) recentViewedApi.record('scholarship', data._id).catch(() => {});
    }).catch((err) => setError(err.response?.data?.error || 'Failed to load')).finally(() => setLoading(false));
  }, [slug, isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => setSavedIds(new Set((d.savedScholarships || []).map((s) => s._id)))).catch(() => {});
  }, [isAuthenticated]);

  const handleSaveToggle = async (id, save) => {
    if (save) await scholarshipsApi.save(id);
    else await scholarshipsApi.unsave(id);
    setSavedIds((prev) => { const next = new Set(prev); save ? next.add(id) : next.delete(id); return next; });
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><ListingCardSkeleton /></div>;
  if (error || !item) return <div className="max-w-3xl mx-auto px-4 py-8"><Alert variant="error">{error || 'Not found'}</Alert><Link to={ROUTES.SCHOLARSHIPS} className="text-primary dark:text-mint mt-4 inline-block">← Back to Scholarships</Link></div>;

  const related = item.related || [];
  const canonicalPath = `${ROUTES.SCHOLARSHIPS}/${item.slug || item._id}`;

  return (
    <>
      <SeoHead
        title={`${item.title} – Scholarships`}
        description={item.description || item.title}
        canonical={canonicalPath}
        jsonLd={combineSchemas(
          scholarshipSchema(item),
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Scholarships', url: ROUTES.SCHOLARSHIPS },
            { name: item.title, url: canonicalPath },
          ]),
        )}
      />
      <article className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <Link to={ROUTES.SCHOLARSHIPS} className="text-sm text-primary dark:text-mint hover:underline mb-4 inline-block">← Back to Scholarships</Link>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{item.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{item.provider}</p>
              <p className="text-sm text-gray-500">{(item.level || '') + (item.country ? ` · ${item.country}` : '')}</p>
              {item.amount && <p className="text-primary dark:text-mint font-medium mt-1">{item.amount}</p>}
              {item.deadline && <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Deadline: {formatDate(item.deadline)}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton type="scholarship" id={item._id} saved={savedIds.has(item._id)} onToggle={handleSaveToggle} />
              <a href={item.link || '#'} className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme" target="_blank" rel="noopener noreferrer">Apply</a>
            </div>
          </div>
          {item.description && <section className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"><h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.description}</p></section>}
          {item.eligibility && item.eligibility.length > 0 && <section className="mt-6"><h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Eligibility</h2><ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">{item.eligibility.map((e, i) => <li key={i}>{e}</li>)}</ul></section>}
          {item.applicationInstructions && <section className="mt-6"><h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to Apply</h2><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.applicationInstructions}</p></section>}
        </div>
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related scholarships</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r._id} to={`${ROUTES.SCHOLARSHIPS}/${r.slug || r._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.provider}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.country} · {formatDate(r.deadline)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
