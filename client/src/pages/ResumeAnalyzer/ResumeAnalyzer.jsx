import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { Link } from 'react-router-dom';
import { resumeApi } from '../../services/listingsService';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';
import { ListingCardSkeleton } from '../../components/listings/ListingCardSkeleton';

export default function ResumeAnalyzer() {
  const { t } = useTranslation(['resume', 'common']);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error(t('resume:selectFileError'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await resumeApi.analyze(formData);
      setResult(data);
      toast.success(t('resume:analyzedSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('resume:analysisFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title={t('resume:analyzerSeoTitle')} description={t('resume:analyzerSeoDescription')} noindex />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('resume:analyzerPageTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('resume:analyzerPageSubtitle')}</p>

        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('resume:selectFileLabel')}</label>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-mint/30 file:text-primary dark:file:bg-mint/20 dark:file:text-mint"
          />
          <button
            type="submit"
            disabled={loading || !file}
            className="mt-4 rounded-lg bg-primary hover:bg-primary-hover text-white btn-theme px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? t('resume:analyzing') : t('resume:analyzeResume')}
          </button>
        </form>

        {loading && (
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8">
            {result.suggestions?.length > 0 && (
              <section className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">{t('resume:suggestionsTitle')}</h2>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('resume:extractedTitle')}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('resume:skillsLabel')}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                    {(result.extracted?.skills || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('resume:educationLabel')}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                    {(result.extracted?.education || []).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('resume:experienceLabel')}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                    {(result.extracted?.experience || []).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('resume:matchingJobsTitle')}</h2>
              <ul className="space-y-3">
                {(result.jobs || []).map((job, idx) => {
                  const matched = (result.matchedSkills || [])[idx];
                  return (
                    <li key={job._id}>
                      <Link
                        to={`${ROUTES.JOBS}/${job.slug || job._id}`}
                        className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">{job.title}</span>
                        <span className="text-gray-600 dark:text-gray-400"> · {job.organization || job.company}</span>
                        {matched?.matched?.length > 0 && (
                          <p className="text-xs text-primary dark:text-mint mt-1">
                            {t('resume:matchedSkills', { skills: matched.matched.join(', ') })}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              <Link to={ROUTES.DASHBOARD} className="text-primary dark:text-mint hover:underline">{t('resume:backToDashboard')}</Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
