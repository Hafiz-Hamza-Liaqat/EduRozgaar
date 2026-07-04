import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, collectionPageSchema, itemListSchema, combineSchemas } from '../../seo/schemas';
import { v1Api, seoApi, jobsApi, savedApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { HomeJobCard } from '../../components/listings/HomeListingCard';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { useAuth } from '../../context/AuthContext';

export default function JobsCategoryLanding() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [meta, setMeta] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      v1Api.landingPage('category', slug).then(({ data }) => data?.meta || null).catch(() => null),
      seoApi.jobsByCategory(slug).then(({ data }) => ({ meta: data.meta, jobs: data.data || [] })).catch(() => ({ meta: null, jobs: [] })),
    ]).then(([landingMeta, jobsData]) => {
      setMeta(landingMeta || jobsData.meta || {
        title: `${slug} Jobs`,
        description: `Browse ${slug} jobs in Pakistan.`,
      });
      setJobs(jobsData.jobs);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data }) => setSavedIds(new Set((data.savedJobs || []).map((j) => j._id)))).catch(() => {});
  }, [isAuthenticated]);

  const handleSave = async (id, save) => {
    if (save) await jobsApi.save(id);
    else await jobsApi.unsave(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (save) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const canonical = meta?.canonical || `${ROUTES.JOBS}/category/${slug}`;
  const pageTitle = meta?.title?.split('|')[0]?.trim() || `${slug} Jobs`;
  const description = meta?.description || `Browse ${slug} jobs in Pakistan.`;
  const filteredJobsUrl = `${ROUTES.JOBS}?category=${encodeURIComponent(slug)}`;

  return (
    <>
      <SeoHead
        title={meta?.title || pageTitle}
        description={description}
        canonical={canonical}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Jobs', url: ROUTES.JOBS },
            { name: pageTitle, url: canonical },
          ]),
          collectionPageSchema({ name: pageTitle, description, url: canonical }),
          jobs.length > 0 && itemListSchema({ name: pageTitle, description, items: jobs })
        )}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            <Link to={ROUTES.JOBS} className="text-primary dark:text-mint hover:underline">← All jobs</Link>
            <Link to={filteredJobsUrl} className="text-primary dark:text-mint hover:underline">View all {slug} jobs →</Link>
          </div>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <HomeJobCard key={job._id} job={job} saved={savedIds.has(job._id)} onSaveToggle={handleSave} showBadge />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No jobs found. <Link to={filteredJobsUrl} className="text-primary dark:text-mint">Browse {slug} jobs</Link>
          </p>
        )}
      </div>
    </>
  );
}
