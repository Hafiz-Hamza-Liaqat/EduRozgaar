import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { intlScholarshipsApi, savedApi } from '../../services/listingsService';
import { useListings } from '../../hooks/useListings';
import { ROUTES } from '../../constants';
import { SearchBar } from '../../components/ui/SearchBar';
import { Pagination } from '../../components/ui/Pagination';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';

const PER_PAGE = 10;
const COUNTRIES = ['UK', 'USA', 'Australia', 'Germany', 'Canada', 'Singapore'];

export default function IntlScholarships() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());

  const initialParams = { limit: PER_PAGE, page: 1 };
  const { data, total, totalPages, loading, error, params, setPage, setFilters } = useListings(intlScholarshipsApi.list, initialParams);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => {
      const ids = new Set((d.savedIntlScholarships || []).map((s) => s._id));
      setSavedIds(ids);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleSaveToggle = async (id, save) => {
    if (save) await intlScholarshipsApi.save(id);
    else await intlScholarshipsApi.unsave(id);
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
        title="International Scholarships – EduRozgaar"
        description="Scholarships and university admissions abroad. Filter by country, deadline, and visa requirements."
        canonical={ROUTES.INTL_SCHOLARSHIPS}
        keywords={`international scholarships, study abroad, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'International Scholarships', url: ROUTES.INTL_SCHOLARSHIPS },
          ]),
          collectionPageSchema({
            name: 'International Scholarships – EduRozgaar',
            description: 'Scholarships and university admissions abroad. Filter by country, deadline, and visa requirements.',
            url: ROUTES.INTL_SCHOLARSHIPS,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">International Scholarships</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Scholarships and university admissions abroad. Save and track your applications.</p>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar placeholder="Search by title, country, university..." onSearch={(q) => setFilters({ search: q || undefined })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.country || ''}
              onChange={(e) => setFilters({ country: e.target.value || undefined })}
            >
              <option value="">All countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.deadline || ''}
              onChange={(e) => setFilters({ deadline: e.target.value || undefined })}
            >
              <option value="">Any deadline</option>
              <option value="upcoming">Upcoming only</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        ) : (
          <ul className="space-y-4">
            {data.map((item) => (
              <li key={item._id}>
                <article className="p-4 md:p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`${ROUTES.INTL_SCHOLARSHIPS}/${item._id}`} className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary dark:hover:text-mint">
                        {item.title}
                      </Link>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{item.country}{item.university ? ` · ${item.university}` : ''}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.deadline && <span>Deadline {formatDate(item.deadline)}</span>}
                        {item.visaRequirements && <span> · Visa info available</span>}
                      </div>
                    </div>
                    {isAuthenticated && <SaveButton saved={savedIds.has(item._id)} onToggle={() => handleSaveToggle(item._id, !savedIds.has(item._id))} />}
                  </div>
                  <Link to={`${ROUTES.INTL_SCHOLARSHIPS}/${item._id}`} className="inline-block mt-3 text-sm text-primary dark:text-mint hover:underline">
                    View details →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}

        {!loading && data.length === 0 && <p className="text-gray-500 dark:text-gray-400 py-8 text-center">No scholarships found.</p>}

        {totalPages > 1 && (
          <Pagination currentPage={params.page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        )}
      </div>
    </>
  );
}
