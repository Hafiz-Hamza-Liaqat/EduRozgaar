import { useState, useEffect, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, combineSchemas } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { jobsApi, savedApi, recommendationsApi, v1Api } from '../../services/listingsService';
import { useListings } from '../../hooks/useListings';
import { ROUTES } from '../../constants';
import { JOB_CATEGORIES, PROVINCES, SORT_OPTIONS } from '../../constants/listings';
import { SearchBar } from '../../components/ui/SearchBar';
import { Pagination } from '../../components/ui/Pagination';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Alert } from '../../components/ui/Alerts';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';
import { AdBanner, AdSidebar, AdInFeed } from '../../components/ads';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

const PER_PAGE = 10;

export default function Jobs() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  const location = useLocation();
  const initialParams = {
    limit: PER_PAGE,
    sort: 'newest',
    ...(typeof window !== 'undefined' && (() => {
      const p = new URLSearchParams(location.search);
      const o = {};
      const province = p.get('province'); if (province) o.province = province;
      const category = p.get('category'); if (category) o.category = category;
      const search = p.get('search'); if (search) o.search = search;
      return o;
    })()),
  };
  const { data, total, totalPages, loading, error, params, setPage, setFilters } = useListings(jobsApi.list, initialParams);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => {
      const ids = new Set((d.savedJobs || []).map((j) => j._id));
      setSavedIds(ids);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingRecommended(true);
    recommendationsApi.get().then(({ data: d }) => setRecommendedJobs(d.jobs || [])).catch(() => setRecommendedJobs([])).finally(() => setLoadingRecommended(false));
  }, [isAuthenticated]);

  const handleSearch = (q) => {
    if (q && q.trim()) v1Api.analyticsEvent({ eventType: 'search', metadata: { query: q.trim() } }).catch(() => {});
    setFilters({ search: q || undefined });
  };

  const handleSaveToggle = async (id, save) => {
    if (save) await jobsApi.save(id);
    else await jobsApi.unsave(id);
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
        title="Jobs – EduRozgaar Pakistan"
        description="Browse job listings in Pakistan. Full-time, part-time, and internship opportunities."
        canonical={ROUTES.JOBS}
        keywords={`jobs Pakistan, government jobs, FPSC, PPSC, NTS, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Jobs', url: ROUTES.JOBS },
          ]),
          collectionPageSchema({
            name: 'Jobs – EduRozgaar Pakistan',
            description: 'Browse job listings in Pakistan. Full-time, part-time, and internship opportunities.',
            url: ROUTES.JOBS,
          })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <AdBanner slotId="jobs-header" className="mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Jobs</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Find your next opportunity across Pakistan.</p>

        {isAuthenticated && recommendedJobs.length > 0 && (
          <ScrollReveal as="section" className="mb-8 p-4 rounded-xl border border-primary/30 dark:border-mint/30 bg-mint/20 dark:bg-mint/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recommended for You</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedJobs.slice(0, 3).map((job) => (
                <Link key={job._id} to={`${ROUTES.JOBS}/${job.slug || job._id}`} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md">
                  <span className="font-medium text-gray-900 dark:text-white">{job.title}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.organization || job.company}</p>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        )}

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 w-full min-w-0">
            <SearchBar
              placeholder="Search by title, company, or location..."
              onSearch={handleSearch}
              className="w-full max-w-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Sort:</label>
            <select
              value={params.sort || 'newest'}
              onChange={(e) => setFilters({ sort: e.target.value })}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.jobs.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
              <select
                value={params.province || ''}
                onChange={(e) => setFilters({ province: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={params.category || ''}
                onChange={(e) => setFilters({ category: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization</label>
              <input
                type="text"
                value={params.organization || ''}
                onChange={(e) => setFilters({ organization: e.target.value || undefined })}
                placeholder="Filter by name"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline after</label>
              <input
                type="date"
                value={params.deadline || ''}
                onChange={(e) => setFilters({ deadline: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <AdSidebar slotId="jobs-sidebar" />
          </aside>

          <div className="flex-1 min-w-0">
            {error && (
              <Alert variant="error" className="mb-4">{error}</Alert>
            )}
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                No jobs match your filters. Try adjusting search or filters.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} job{total !== 1 ? 's' : ''} found</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.map((job, index) => (
                    <Fragment key={job._id}>
                      {index > 0 && index % 5 === 0 && <AdInFeed slotId="jobs-infeed" index={index} />}
                      <article
                      className={`p-4 rounded-xl border flex flex-col transition-shadow ${job.source === 'scraper' && job.scrapedAt ? 'border-primary/50 dark:border-mint/50 bg-mint/20 dark:bg-mint/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'} hover:shadow-md`}
                    >
                      <Link to={`${ROUTES.JOBS}/${job.slug || job._id}`} className="flex-1 block">
                        {job.source === 'scraper' && job.scrapedAt && (
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-primary text-white dark:bg-primary mb-2">New</span>
                        )}
                        {job.logoUrl && (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 mb-2 flex items-center justify-center text-xs text-gray-400">Logo</div>
                        )}
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{job.organization || job.company}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {[job.province || job.location, job.category, job.type].filter(Boolean).join(' · ')}
                        </p>
                        {job.deadline && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Deadline: {formatDate(job.deadline)}</p>
                        )}
                      </Link>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <SaveButton
                          type="job"
                          id={job._id}
                          saved={savedIds.has(job._id)}
                          onToggle={handleSaveToggle}
                        />
                      </div>
                    </article>
                    </Fragment>
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={params.page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
