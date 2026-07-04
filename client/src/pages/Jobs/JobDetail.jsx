import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { jobPostingSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { jobsApi, savedApi, recentViewedApi, coverLetterApi, recommendationsApi, applicationsApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { SaveButton } from '../../components/listings/SaveButton';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';
import { Alert } from '../../components/ui/Alerts';
import { formatDate } from '../../utils/formatDate';

const JOB_TYPE_BADGE = {
  Government: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Private: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Internship: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function JobDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [coverLetter, setCoverLetter] = useState(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [applied, setApplied] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    jobsApi.get(slug).then(({ data }) => {
      setJob(data);
      if (isAuthenticated && data?._id) recentViewedApi.record('job', data._id).catch(() => {});
    }).catch((err) => setError(err.response?.data?.error || 'Failed to load')).finally(() => setLoading(false));
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    savedApi.get().then(({ data: d }) => setSavedIds(new Set((d.savedJobs || []).map((j) => j._id)))).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !job?._id) return;
    applicationsApi.getMy().then(({ data }) => {
      const list = data.data || [];
      const hasApplied = list.some((a) => (a.job?._id || a.job)?.toString() === job._id.toString());
      setApplied(hasApplied);
    }).catch(() => {});
  }, [isAuthenticated, job?._id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    recommendationsApi.get().then(({ data }) => setRecommended(data.jobs || [])).catch(() => setRecommended([]));
  }, [isAuthenticated]);

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

  const handleInternalApply = async (e) => {
    e.preventDefault();
    if (!job || job.applyType !== 'internal') return;
    setApplyLoading(true);
    setApplySuccess(false);
    try {
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) formData.append('resume', fileInputRef.current.files[0]);
      await jobsApi.apply(job._id, formData);
      setApplySuccess(true);
      setApplied(true);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Application failed');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><ListingCardSkeleton /></div>;
  if (error || !job) return <div className="max-w-3xl mx-auto px-4 py-8"><Alert variant="error">{error || 'Job not found'}</Alert><Link to={ROUTES.JOBS} className="text-primary dark:text-mint mt-4 inline-block">← Back to Jobs</Link></div>;

  const related = job.related || [];
  const jobType = job.jobType || 'Private';
  const isExternal = job.applyType === 'external';
  const applicationLink = job.applicationLink || job.sourceUrl;

  const canonicalPath = `${ROUTES.JOBS}/${job.slug || job._id}`;
  const description = job.description || `${job.title} at ${job.organization || job.company}`;

  return (
    <>
      <SeoHead
        title={`${job.title} – Jobs`}
        description={description}
        canonical={canonicalPath}
        ogImage={job.image || undefined}
        jsonLd={combineSchemas(
          jobPostingSchema(job),
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Jobs', url: ROUTES.JOBS },
            { name: job.title, url: canonicalPath },
          ]),
        )}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Link to={ROUTES.JOBS} className="text-sm text-primary dark:text-mint hover:underline mb-4 inline-block">← Back to Jobs</Link>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                <span className={`text-xs font-medium px-2 py-1 rounded ${JOB_TYPE_BADGE[jobType] || JOB_TYPE_BADGE.Private}`}>
                  {jobType}
                </span>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{job.organization || job.company}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {[job.province || job.location, job.city, job.category, job.type].filter(Boolean).join(' · ')}
              </p>
              {job.educationRequirement && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2"><strong>Education:</strong> {job.educationRequirement}</p>}
              {job.experience && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1"><strong>Experience:</strong> {job.experience}</p>}
              {job.deadline && <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Application deadline: {formatDate(job.deadline)}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveButton type="job" id={job._id} saved={savedIds.has(job._id)} onToggle={handleSaveToggle} />
              {isAuthenticated && (
                <Link
                  to={`${ROUTES.RESUME_BUILDER}?optimizeForJob=${job._id}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 dark:hover:bg-mint/10 font-medium btn-theme"
                >
                  Optimize Resume for this Job
                </Link>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    setCoverLetterLoading(true);
                    setCoverLetter(null);
                    try {
                      const { data } = await coverLetterApi.generate(job._id);
                      setCoverLetter(data.coverLetter);
                    } catch (e) {
                      window.alert(e.response?.data?.error || 'Failed to generate');
                    } finally {
                      setCoverLetterLoading(false);
                    }
                  }}
                  disabled={coverLetterLoading}
                  className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 dark:hover:bg-mint/10 font-medium disabled:opacity-50 btn-theme"
                >
                  {coverLetterLoading ? 'Generating…' : 'Generate cover letter'}
                </button>
              )}
              {isExternal && applicationLink && (
                <a href={applicationLink} className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme" target="_blank" rel="noopener noreferrer">
                  Apply on official website →
                </a>
              )}
              {!isExternal && isAuthenticated && (
                <>
                  {applied || applySuccess ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">Applied</span>
                  ) : (
                    <form onSubmit={handleInternalApply} className="flex flex-wrap items-center gap-2">
                      <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="text-sm text-gray-600 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white file:text-sm" />
                      <button type="submit" disabled={applyLoading} className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme disabled:opacity-50">
                        {applyLoading ? 'Submitting…' : 'Apply Now'}
                      </button>
                    </form>
                  )}
                </>
              )}
              {!isAuthenticated && !isExternal && (
                <Link to={ROUTES.LOGIN} className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme">Login to Apply</Link>
              )}
              {applicationLink && (
                <a href={applicationLink} className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-primary text-primary dark:text-mint hover:bg-mint/20 btn-theme" target="_blank" rel="noopener noreferrer">
                  Official Website
                </a>
              )}
            </div>
            {coverLetter && (
              <section className="mt-6 w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generated cover letter</h2>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{coverLetter}</pre>
              </section>
            )}
          </div>
          {job.description && (
            <section className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{job.description}</p>
            </section>
          )}
          {job.requirements && job.requirements.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requirements</h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}
          {job.applicationInstructions && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to Apply</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{job.applicationInstructions}</p>
            </section>
          )}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Share:</span>
            <button type="button" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Twitter</button>
            <button type="button" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">LinkedIn</button>
            <button type="button" className="text-sm text-gray-600 dark:text-gray-400 hover:underline">WhatsApp</button>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Similar jobs</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r._id} to={`${ROUTES.JOBS}/${r.slug || r._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md card-hover">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.organization || r.company}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.province || r.location} · {formatDate(r.deadline)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {recommended.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recommended for you</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommended.filter((r) => r._id !== job._id).slice(0, 4).map((r) => (
                <Link key={r._id} to={`${ROUTES.JOBS}/${r.slug || r._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md card-hover">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.organization || r.company}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.province || r.location} · {formatDate(r.deadline)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
