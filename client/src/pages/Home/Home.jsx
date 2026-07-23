import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS } from '../../seo/config';
import { ROUTES } from '../../constants';
import { PROVINCES } from '../../constants/listings';
import { GlobalSearch } from '../../components/search/GlobalSearch';
import { trendingApi, jobsApi, scholarshipsApi, admissionsApi, savedApi, recommendationsApi, blogsApi, monetizationApi } from '../../services/listingsService';
import { useAuth } from '../../context/AuthContext';
import { HomeJobCard, HomeScholarshipCard, HomeAdmissionCard } from '../../components/listings/HomeListingCard';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { AdHost } from '../../components/ads';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { NewsletterSubscribe } from '../../components/newsletter/NewsletterSubscribe';
import { formatDate } from '../../utils/formatDate';
import { useSiteContent } from '../../context/SiteContentContext';
import { isC61TestMarker } from '../../utils/cmsCorruption';

const TRENDING_JOBS_LIMIT = 8;
const SCHOLARSHIPS_LIMIT = 6;
const ADMISSIONS_LIMIT = 6;
const BLOG_LIMIT = 4;
const SKELETON_COUNT = 3;

function readingTimeMinutes(content) {
  if (!content || typeof content !== 'string') return 5;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const FOREIGN_STUDY_COUNTRIES = [
  { name: 'Turkey', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=Turkey' },
  { name: 'Germany', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=Germany' },
  { name: 'China', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=China' },
  { name: 'Hungary', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=Hungary' },
  { name: 'UK', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=UK' },
  { name: 'Canada', path: ROUTES.INTL_SCHOLARSHIPS, query: '?country=Canada' },
];

export default function Home() {
  const { t } = useTranslation(['home', 'common', 'navbar']);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { homepage, banners } = useSiteContent();
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [latestScholarships, setLatestScholarships] = useState([]);
  const [admissionDeadlines, setAdmissionDeadlines] = useState([]);
  const [recommended, setRecommended] = useState({ jobs: [], scholarships: [], admissions: [] });
  const [blogs, setBlogs] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [savedIds, setSavedIds] = useState({ jobs: new Set(), scholarships: new Set(), admissions: new Set() });
  const [province, setProvince] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');

  const searchCategories = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'jobs', label: t('navbar:jobs'), type: 'job' },
    { value: 'scholarships', label: t('navbar:scholarships'), type: 'scholarship' },
    { value: 'admissions', label: t('navbar:admissions'), type: 'admission' },
    { value: 'internships', label: t('navbar:internships'), path: ROUTES.INTERNSHIPS },
  ], [t]);

  const studentResources = useMemo(() => {
    const cms = homepage?.sections?.studentResources;
    if (cms?.enabled === false) return null;
    if (cms?.items?.length) {
      return cms.items.map((item) => ({
        label: item.label,
        to: item.path || ROUTES.HOME,
        icon: item.icon || '📄',
        description: item.description || '',
      }));
    }
    return [
      { label: t('home:resourceResumeBuilder'), to: ROUTES.RESUME_BUILDER, icon: '📄', description: t('home:resourceResumeBuilderDesc') },
      { label: t('home:resourceCareerGuidance'), to: ROUTES.CAREER_GUIDANCE, icon: '💡', description: t('home:resourceCareerGuidanceDesc') },
      { label: t('home:resourceExamPrep'), to: ROUTES.EXAM_PREP, icon: '📚', description: t('home:resourceExamPrepDesc') },
      { label: t('home:resourceInternships'), to: ROUTES.INTERNSHIPS, icon: '🎯', description: t('home:resourceInternshipsDesc') },
    ];
  }, [homepage, t]);

  const foreignStudyCountries = useMemo(() => {
    const cms = homepage?.sections?.foreignStudyCountries;
    if (cms?.enabled === false) return null;
    if (cms?.items?.length) {
      return cms.items.map((item) => ({
        name: item.name,
        path: item.path || ROUTES.INTL_SCHOLARSHIPS,
        query: item.query || '',
      }));
    }
    return FOREIGN_STUDY_COUNTRIES;
  }, [homepage]);

  useEffect(() => {
    Promise.all([
      monetizationApi.featuredJobs().then((r) => {
        const featured = r.data?.data || r.data || [];
        if (featured.length) setTrendingJobs(featured.slice(0, TRENDING_JOBS_LIMIT));
        else return trendingApi.jobs().then((res) => setTrendingJobs((res.data?.data || res.data || []).slice(0, TRENDING_JOBS_LIMIT)));
      }).catch(() =>
        trendingApi.jobs().then((r) => setTrendingJobs((r.data?.data || r.data || []).slice(0, TRENDING_JOBS_LIMIT))).catch(() => setTrendingJobs([]))
      ),
      scholarshipsApi.list({ limit: SCHOLARSHIPS_LIMIT }).then((r) => setLatestScholarships(r.data?.data || r.data || [])).catch(() => setLatestScholarships([])),
      admissionsApi.list({ limit: ADMISSIONS_LIMIT, sort: 'deadline' }).then((r) => setAdmissionDeadlines(r.data?.data || r.data || [])).catch(() => setAdmissionDeadlines([])),
    ]).finally(() => setLoadingTrending(false));
  }, []);

  useEffect(() => {
    jobsApi.list({ limit: TRENDING_JOBS_LIMIT, sort: 'newest', ...(province && { province }) }).then((r) => setTrendingJobs(r.data?.data || r.data || [])).catch(() => {});
  }, [province]);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data }) => {
      setSavedIds({
        jobs: new Set((data.savedJobs || []).map((j) => j._id)),
        scholarships: new Set((data.savedScholarships || []).map((s) => s._id)),
        admissions: new Set((data.savedAdmissions || []).map((a) => a._id)),
      });
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingRecommended(true);
    recommendationsApi.get().then(({ data }) => {
      setRecommended({
        jobs: data.jobs || [],
        scholarships: data.scholarships || [],
        admissions: data.admissions || [],
      });
    }).catch(() => setRecommended({ jobs: [], scholarships: [], admissions: [] })).finally(() => setLoadingRecommended(false));
  }, [isAuthenticated]);

  useEffect(() => {
    blogsApi.list({ limit: BLOG_LIMIT, status: 'published' }).then((r) => setBlogs((r.data?.data || r.data || []).slice(0, BLOG_LIMIT))).catch(() => setBlogs([])).finally(() => setLoadingBlogs(false));
  }, []);

  const selectedCategory = searchCategories.find((c) => c.value === searchCategory);
  const searchTypeFilter = selectedCategory?.type || '';

  const handleSearchNavigate = (path) => {
    if (searchTypeFilter && path.startsWith(ROUTES.SEARCH)) {
      const url = new URL(path, window.location.origin);
      url.searchParams.set('type', searchTypeFilter);
      navigate(`${url.pathname}${url.search}`);
      return;
    }
    if (selectedCategory?.path) {
      navigate(selectedCategory.path);
      return;
    }
    navigate(path);
  };

  const handleSaveJob = async (id, save) => {
    if (save) await jobsApi.save(id);
    else await jobsApi.unsave(id);
    setSavedIds((prev) => {
      const next = new Set(prev.jobs);
      if (save) next.add(id);
      else next.delete(id);
      return { ...prev, jobs: next };
    });
  };
  const handleSaveScholarship = async (id, save) => {
    if (save) await scholarshipsApi.save(id);
    else await scholarshipsApi.unsave(id);
    setSavedIds((prev) => {
      const next = new Set(prev.scholarships);
      if (save) next.add(id);
      else next.delete(id);
      return { ...prev, scholarships: next };
    });
  };
  const handleSaveAdmission = async (id, save) => {
    if (save) await admissionsApi.save(id);
    else await admissionsApi.unsave(id);
    setSavedIds((prev) => {
      const next = new Set(prev.admissions);
      if (save) next.add(id);
      else next.delete(id);
      return { ...prev, admissions: next };
    });
  };

  const rawHeadline = homepage?.hero?.headline;
  const heroTitle = rawHeadline && !isC61TestMarker(rawHeadline) ? rawHeadline : t('home:heroTitle');
  const heroSub = homepage?.hero?.subheadline || t('home:heroSub');
  const pageSeoTitle = homepage?.seoTitle || t('home:seoTitle');
  const pageSeoDesc = homepage?.metaDescription || DEFAULT_DESCRIPTION;
  const heroBg = homepage?.hero?.backgroundImageUrl;
  const cmsStats = homepage?.stats?.length ? homepage.stats : null;
  const showJobs = homepage?.sections?.featuredJobs?.enabled !== false;
  const showScholarships = homepage?.sections?.featuredScholarships?.enabled !== false;
  const showAdmissions = homepage?.sections?.featuredAdmissions?.enabled !== false;
  const testimonials = homepage?.sections?.testimonials;
  const partners = homepage?.sections?.partners;
  const newsletterBlock = homepage?.sections?.newsletter;
  const heroCtas = homepage?.hero?.ctas?.length ? homepage.hero.ctas : null;

  return (
    <>
      <SeoHead
        title={pageSeoTitle}
        description={pageSeoDesc}
        canonical={homepage?.canonicalUrl || ROUTES.HOME}
        keywords={DEFAULT_KEYWORDS}
        ogImage={homepage?.ogImageUrl}
        twitterCard={homepage?.twitterCard}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([{ name: t('navbar:home'), url: ROUTES.HOME }]),
          webPageSchema({
            name: pageSeoTitle,
            description: pageSeoDesc,
            url: ROUTES.HOME,
          })
        )}
      />

      {banners?.length > 0 && (
        <section className="bg-edur-steel dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="relative rounded-xl overflow-hidden p-6 sm:p-8 text-white"
                style={banner.backgroundImageUrl ? { backgroundImage: `url(${banner.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <div className="relative z-10">
                  {banner.headline && <h2 className="text-xl sm:text-2xl font-bold mb-1">{banner.headline}</h2>}
                  {banner.subheadline && <p className="text-white/90 mb-3">{banner.subheadline}</p>}
                  {banner.ctaLabel && banner.ctaUrl && (
                    banner.ctaExternal ? (
                      <a href={banner.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex px-4 py-2 rounded-lg bg-white text-edur-steel font-medium">{banner.ctaLabel}</a>
                    ) : (
                      <Link to={banner.ctaUrl} className="inline-flex px-4 py-2 rounded-lg bg-white text-edur-steel font-medium">{banner.ctaLabel}</Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        className="relative bg-gradient-to-br from-edur-steel via-edur-blue to-edur-steel dark:from-edur-steel dark:via-edur-blue dark:to-edur-steel py-12 sm:py-14 md:py-24 px-4 sm:px-6 overflow-hidden"
        style={heroBg ? { backgroundImage: `linear-gradient(rgba(49,112,142,0.85), rgba(49,112,142,0.85)), url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-[#31708E]/10 dark:bg-black/20" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-sm">
            {heroTitle}
          </h1>
          <p className="text-lg text-edur-sky/95 text-white/95 mb-8 max-w-2xl mx-auto">
            {heroSub}
          </p>
          <div className="w-full max-w-3xl mx-auto mb-6 min-w-0">
            <GlobalSearch
              placeholder={t('home:keywordSearchPlaceholder')}
              className="w-full"
              showCategoryFilter
              categories={searchCategories}
              category={selectedCategory?.type || ''}
              categoryValue={searchCategory}
              onCategoryChange={(match) => {
                if (!match) return;
                setSearchCategory(match.value || 'all');
                if (match.path) {
                  navigate(match.path);
                }
              }}
              showProvinceFilter
              provinces={PROVINCES}
              province={province}
              onProvinceChange={setProvince}
              onNavigate={handleSearchNavigate}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {heroCtas ? heroCtas.map((cta, i) => (
              cta.external ? (
                <a key={i} href={cta.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{cta.label}</a>
              ) : (
                <Link key={i} to={cta.url || ROUTES.JOBS} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{cta.label}</Link>
              )
            )) : (
              <>
                <Link to={ROUTES.JOBS} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{t('home:govJobs')}</Link>
                <Link to={ROUTES.SCHOLARSHIPS} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{t('home:scholarships')}</Link>
                <Link to={ROUTES.ADMISSIONS} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{t('home:admissions')}</Link>
                <Link to={ROUTES.INTERNSHIPS} className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium border border-white/30 btn-theme">{t('home:internships')}</Link>
              </>
            )}
          </div>
          {!heroCtas && (
          <Link to={ROUTES.JOBS} className="inline-flex items-center px-6 py-3 rounded-xl bg-white text-edur-steel font-semibold hover:bg-edur-bg shadow-lg btn-theme">
            {t('home:startExploring')}
          </Link>
          )}
          {cmsStats && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {cmsStats.map((stat, i) => (
                <div key={i} className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <AdHost placementId="home-top" />
      </ScrollReveal>

      {isAuthenticated && (recommended.jobs.length > 0 || recommended.scholarships.length > 0 || recommended.admissions.length > 0) && (
        <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('home:recommendedForYou')}</h2>
          {loadingRecommended ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-6">
              {recommended.jobs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('navbar:jobs')}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommended.jobs.slice(0, 3).map((job) => (
                      <HomeJobCard key={job._id} job={job} saved={savedIds.jobs.has(job._id)} onSaveToggle={handleSaveJob} showBadge />
                    ))}
                  </div>
                  <Link to={ROUTES.JOBS} className="text-sm text-primary dark:text-mint mt-2 inline-block">
                    {t('home:viewAllWithType', { viewAll: t('home:viewAll'), type: t('navbar:jobs').toLowerCase() })}
                  </Link>
                </div>
              )}
              {recommended.scholarships.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('navbar:scholarships')}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommended.scholarships.slice(0, 3).map((item) => (
                      <HomeScholarshipCard key={item._id} item={item} saved={savedIds.scholarships.has(item._id)} onSaveToggle={handleSaveScholarship} />
                    ))}
                  </div>
                  <Link to={ROUTES.SCHOLARSHIPS} className="text-sm text-primary dark:text-mint mt-2 inline-block">
                    {t('home:viewAllWithType', { viewAll: t('home:viewAll'), type: t('navbar:scholarships').toLowerCase() })}
                  </Link>
                </div>
              )}
              {recommended.admissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('navbar:admissions')}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommended.admissions.slice(0, 3).map((item) => (
                      <HomeAdmissionCard key={item._id} item={item} saved={savedIds.admissions.has(item._id)} onSaveToggle={handleSaveAdmission} />
                    ))}
                  </div>
                  <Link to={ROUTES.ADMISSIONS} className="text-sm text-primary dark:text-mint mt-2 inline-block">
                    {t('home:viewAllWithType', { viewAll: t('home:viewAll'), type: t('navbar:admissions').toLowerCase() })}
                  </Link>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>
      )}

      {showJobs && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{homepage?.sections?.featuredJobs?.title || t('home:trendingJobs')}</h2>
        {loadingTrending ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : trendingJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingJobs.map((job) => (
              <HomeJobCard key={job._id} job={job} saved={savedIds.jobs.has(job._id)} onSaveToggle={handleSaveJob} showBadge />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t('home:noTrendingJobs')}</p>
        )}
        <div className="mt-6 text-center">
          <Link to={ROUTES.JOBS} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-edur-steel/10 dark:bg-edur-sky/10 text-edur-steel dark:text-edur-sky font-medium hover:bg-edur-steel/20 dark:hover:bg-edur-sky/20 btn-theme">
            {t('home:viewAllJobs')}
          </Link>
        </div>
      </ScrollReveal>
      )}

      <ScrollReveal><AdHost placementId="home-mid-1" variant="inline" /></ScrollReveal>

      {showScholarships && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{homepage?.sections?.featuredScholarships?.title || t('home:latestScholarships')}</h2>
        {loadingTrending ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : latestScholarships.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestScholarships.map((item) => (
              <HomeScholarshipCard key={item._id} item={item} saved={savedIds.scholarships.has(item._id)} onSaveToggle={handleSaveScholarship} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t('home:noScholarships')}</p>
        )}
        <div className="mt-6 text-center">
          <Link to={ROUTES.SCHOLARSHIPS} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-edur-steel/10 dark:bg-edur-sky/10 text-edur-steel dark:text-edur-sky font-medium hover:bg-edur-steel/20 dark:hover:bg-edur-sky/20 btn-theme">
            {t('home:viewAllScholarships')}
          </Link>
        </div>
      </ScrollReveal>
      )}

      {showAdmissions && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{homepage?.sections?.featuredAdmissions?.title || t('home:upcomingAdmissions')}</h2>
        {loadingTrending ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : admissionDeadlines.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admissionDeadlines.map((item) => (
              <HomeAdmissionCard key={item._id} item={item} saved={savedIds.admissions.has(item._id)} onSaveToggle={handleSaveAdmission} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t('home:noAdmissions')}</p>
        )}
        <div className="mt-6 text-center">
          <Link to={ROUTES.ADMISSIONS} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-edur-steel/10 dark:bg-edur-sky/10 text-edur-steel dark:text-edur-sky font-medium hover:bg-edur-steel/20 dark:hover:bg-edur-sky/20 btn-theme">
            {t('home:viewAllAdmissions')}
          </Link>
        </div>
      </ScrollReveal>
      )}

      {foreignStudyCountries && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('home:foreignStudyOpportunities')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {foreignStudyCountries.map(({ name, path, query }) => (
            <Link
              key={name}
              to={`${path}${query || ''}`}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-primary/50 card-hover text-center"
            >
              <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link to={ROUTES.INTL_SCHOLARSHIPS} className="text-primary dark:text-mint font-medium hover:underline">{t('home:viewAllIntlScholarships')}</Link>
        </div>
      </ScrollReveal>
      )}

      {testimonials?.enabled && testimonials.items?.length > 0 && (
        <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{testimonials.title || 'Testimonials'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {testimonials.items.map((item, i) => (
              <blockquote key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-300 italic">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{item.author}{item.role ? ` · ${item.role}` : ''}</footer>
              </blockquote>
            ))}
          </div>
        </ScrollReveal>
      )}

      {partners?.enabled && partners.logos?.length > 0 && (
        <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{partners.title || 'Partners'}</h2>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {partners.logos.map((logo, i) => (
              logo.url ? (
                <a key={i} href={logo.url} target="_blank" rel="noopener noreferrer">
                  {logo.imageUrl ? <img src={logo.imageUrl} alt={logo.name || 'Partner'} className="h-12 object-contain" /> : <span>{logo.name}</span>}
                </a>
              ) : (
                <span key={i}>{logo.imageUrl ? <img src={logo.imageUrl} alt={logo.name || 'Partner'} className="h-12 object-contain" /> : logo.name}</span>
              )
            ))}
          </div>
        </ScrollReveal>
      )}

      {studentResources && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('home:studentResources')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {studentResources.map(({ label, to, icon, description }) => (
            <Link
              key={to}
              to={to}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 dark:hover:border-edur-sky/50 card-hover text-center transition-all duration-200"
            >
              <span className="text-2xl block mb-2" aria-hidden>{icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white block">{label}</span>
              {description && <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">{description}</span>}
            </Link>
          ))}
        </div>
      </ScrollReveal>
      )}

      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('home:careerBlogArticles')}</h2>
        {loadingBlogs ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {blogs.slice(0, 4).map((post) => (
              <Link
                key={post._id}
                to={`${ROUTES.BLOG}/${post.slug}`}
                className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 card-hover"
              >
                <span className="text-xs font-medium text-edur-steel dark:text-edur-sky">{post.category || t('home:defaultBlogCategory')}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mt-1">{post.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{post.excerpt}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {t('home:minRead', { minutes: readingTimeMinutes(post.content || post.excerpt) })}
                  {' · '}
                  {post.publishedAt ? formatDate(post.publishedAt) : (post.createdAt ? formatDate(post.createdAt) : '')}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">{t('home:noBlogPosts')}</p>
        )}
        <div className="mt-6 text-center">
          <Link to={ROUTES.BLOG} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-edur-steel/10 dark:bg-edur-sky/10 text-edur-steel dark:text-edur-sky font-medium hover:bg-edur-steel/20 btn-theme">
            {t('home:readMoreArticles')}
          </Link>
        </div>
      </ScrollReveal>

      {(newsletterBlock?.enabled !== false) && (
      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-br from-edur-steel/10 to-edur-blue/10 dark:from-edur-steel/20 dark:to-edur-blue/20 border border-edur-sky/30">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{newsletterBlock?.title || t('home:newsletterTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{newsletterBlock?.subtitle || t('home:newsletterDesc')}</p>
          <NewsletterSubscribe />
        </div>
      </ScrollReveal>
      )}

      <ScrollReveal as="section" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AdHost placementId="home-footer" />
      </ScrollReveal>
    </>
  );
}
