import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { scholarshipsApi, savedApi, recommendationsApi, v1Api } from '../../services/listingsService';
import { useListings } from '../../hooks/useListings';
import { ROUTES } from '../../constants';
import { SCHOLARSHIP_LEVELS, SCHOLARSHIP_COUNTRIES, SORT_OPTIONS } from '../../constants/listings';
import { SearchBar } from '../../components/ui/SearchBar';
import { Pagination } from '../../components/ui/Pagination';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Alert } from '../../components/ui/Alerts';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';

const PER_PAGE = 10;

export default function Scholarships() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [recommendedScholarships, setRecommendedScholarships] = useState([]);
  const { data, total, totalPages, loading, error, params, setPage, setFilters } = useListings(scholarshipsApi.list, { limit: PER_PAGE, sort: 'newest' });

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => setSavedIds(new Set((d.savedScholarships || []).map((s) => s._id)))).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    recommendationsApi.get().then(({ data: d }) => setRecommendedScholarships(d.scholarships || [])).catch(() => setRecommendedScholarships([]));
  }, [isAuthenticated]);

  const handleSearch = (q) => {
    if (q && q.trim()) v1Api.analyticsEvent({ eventType: 'search', metadata: { query: q.trim() } }).catch(() => {});
    setFilters({ search: q || undefined });
  };
  const handleSaveToggle = async (id, save) => {
    if (save) await scholarshipsApi.save(id);
    else await scholarshipsApi.unsave(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (save) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <>
      <SeoHead
        title="Scholarships – EduRozgaar Pakistan"
        description="Scholarship opportunities for Pakistani students. HEC, PEEF, and international scholarships."
        canonical={ROUTES.SCHOLARSHIPS}
        keywords={`scholarships Pakistan, HEC, PEEF, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Scholarships', url: ROUTES.SCHOLARSHIPS },
          ]),
          collectionPageSchema({
            name: 'Scholarships – EduRozgaar Pakistan',
            description: 'Scholarship opportunities for Pakistani students. HEC, PEEF, and international scholarships.',
            url: ROUTES.SCHOLARSHIPS,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Scholarships</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Funding opportunities for your education.</p>

        {isAuthenticated && recommendedScholarships.length > 0 && (
          <section className="mb-8 p-4 rounded-xl border border-primary/30 dark:border-mint/30 bg-mint/20 dark:bg-mint/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recommended for You</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedScholarships.slice(0, 3).map((item) => (
                <Link key={item._id} to={`${ROUTES.SCHOLARSHIPS}/${item.slug || item._id}`} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md">
                  <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.provider}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 w-full min-w-0">
            <SearchBar placeholder="Search by title or provider..." onSearch={handleSearch} className="w-full max-w-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Sort:</label>
            <select value={params.sort || 'newest'} onChange={(e) => setFilters({ sort: e.target.value })} className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm">
              {SORT_OPTIONS.scholarships.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select value={params.level || ''} onChange={(e) => setFilters({ level: e.target.value || undefined })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm">
                <option value="">All</option>
                {SCHOLARSHIP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <select value={params.country || ''} onChange={(e) => setFilters({ country: e.target.value || undefined })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm">
                <option value="">All</option>
                {SCHOLARSHIP_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline after</label>
              <input type="date" value={params.deadline || ''} onChange={(e) => setFilters({ deadline: e.target.value || undefined })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm" />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : data.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">No scholarships match your filters.</div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} scholarship{total !== 1 ? 's' : ''} found</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.map((s) => (
                    <article key={s._id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow flex flex-col">
                      <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="flex-1 block">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{s.provider}</p>
                        <p className="text-sm text-gray-500">{[s.level, s.country].filter(Boolean).join(' · ')}</p>
                        {s.amount && <p className="text-sm text-primary dark:text-mint mt-1">{s.amount}</p>}
                        {s.deadline && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Deadline: {formatDate(s.deadline)}</p>}
                      </Link>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <SaveButton type="scholarship" id={s._id} saved={savedIds.has(s._id)} onToggle={handleSaveToggle} />
                      </div>
                    </article>
                  ))}
                </div>
                {totalPages > 1 && <Pagination currentPage={params.page} totalPages={totalPages} onPageChange={setPage} />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
