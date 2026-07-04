import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { internshipsApi, savedApi } from '../../services/listingsService';
import { useListings } from '../../hooks/useListings';
import { ROUTES } from '../../constants';
import { SearchBar } from '../../components/ui/SearchBar';
import { Pagination } from '../../components/ui/Pagination';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';

const PER_PAGE = 10;
const DURATIONS = ['2 months', '3 months', '4 months', '6 months'];
const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Islamabad', 'Balochistan'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const FIELDS = ['Software', 'Marketing', 'Finance', 'HR', 'Design', 'Data', 'Engineering', 'Content'];

export default function Internships() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());

  const initialParams = { limit: PER_PAGE, page: 1 };
  const { data, total, totalPages, loading, error, params, setPage, setFilters } = useListings(internshipsApi.list, initialParams);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => {
      const ids = new Set((d.savedInternships || []).map((i) => i._id));
      setSavedIds(ids);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleSaveToggle = async (id, save) => {
    if (save) await internshipsApi.save(id);
    else await internshipsApi.unsave(id);
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
        title="Internships & Trainings – EduRozgaar"
        description="Find internships and training opportunities across Pakistan."
        canonical={ROUTES.INTERNSHIPS}
        keywords={`internships Pakistan, training opportunities, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Internships', url: ROUTES.INTERNSHIPS },
          ]),
          collectionPageSchema({
            name: 'Internships & Trainings – EduRozgaar',
            description: 'Find internships and training opportunities across Pakistan.',
            url: ROUTES.INTERNSHIPS,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Internships & Trainings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Discover internship and training opportunities to kickstart your career.</p>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar placeholder="Search internships..." onSearch={(q) => setFilters({ search: q || undefined })} />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.province || ''}
              onChange={(e) => setFilters({ province: e.target.value || undefined })}
            >
              <option value="">All provinces</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.location || ''}
              onChange={(e) => setFilters({ location: e.target.value || undefined })}
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.skillset || ''}
              onChange={(e) => setFilters({ skillset: e.target.value || undefined })}
            >
              <option value="">Any field</option>
              {FIELDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.isPaid ?? ''}
              onChange={(e) => setFilters({ isPaid: e.target.value === '' ? undefined : e.target.value })}
            >
              <option value="">Paid / Unpaid</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              value={params.duration || ''}
              onChange={(e) => setFilters({ duration: e.target.value || undefined })}
            >
              <option value="">Any duration</option>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
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
                      <Link to={`${ROUTES.INTERNSHIPS}/${item.slug || item._id}`} className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary dark:hover:text-mint">
                        {item.title}
                      </Link>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{item.organization}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.location && <span>{item.location}</span>}
                        {item.province && <span> · {item.province}</span>}
                        {item.duration && <span> · {item.duration}</span>}
                        {item.deadline && <span> · Deadline {formatDate(item.deadline)}</span>}
                      </div>
                      {item.skillset?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.skillset.slice(0, 4).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAuthenticated && (
                      <SaveButton saved={savedIds.has(item._id)} onToggle={() => handleSaveToggle(item._id, !savedIds.has(item._id))} />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`${ROUTES.INTERNSHIPS}/${item.slug || item._id}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover btn-theme"
                    >
                      View & Apply
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {!loading && data.length === 0 && <p className="text-gray-500 dark:text-gray-400 py-8 text-center">No internships found. Try adjusting filters.</p>}

        {totalPages > 1 && (
          <Pagination currentPage={params.page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        )}
      </div>
    </>
  );
}
