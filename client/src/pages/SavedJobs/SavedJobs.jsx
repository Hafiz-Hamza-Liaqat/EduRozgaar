import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { savedApi } from '../../services/listingsService';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/formatDate';
import { Alert } from '../../components/ui/Alerts';
import { SeoHead } from '../../components/seo';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [savedAdmissions, setSavedAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    savedApi
      .get()
      .then(({ data }) => {
        setSavedJobs(data.savedJobs || []);
        setSavedScholarships(data.savedScholarships || []);
        setSavedAdmissions(data.savedAdmissions || []);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load saved items'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <SeoHead title="Saved listings" description="Your saved jobs, scholarships, and admissions." noindex />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading saved items...</div>
        </div>
      </>
    );
  }

  const total = savedJobs.length + savedScholarships.length + savedAdmissions.length;

  return (
    <>
      <SeoHead title="Saved listings" description="Your saved jobs, scholarships, and admissions." noindex />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Saved listings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Jobs, scholarships, and admissions you saved for later.</p>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {total === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-4">You haven&apos;t saved any listings yet.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={ROUTES.JOBS} className="text-primary dark:text-mint font-medium hover:underline">Browse jobs →</Link>
              <Link to={ROUTES.SCHOLARSHIPS} className="text-primary dark:text-mint font-medium hover:underline">Browse scholarships →</Link>
              <Link to={ROUTES.ADMISSIONS} className="text-primary dark:text-mint font-medium hover:underline">Browse admissions →</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {savedJobs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Saved jobs</h2>
                <ul className="space-y-3">
                  {savedJobs.map((j) => (
                    <li key={j._id}>
                      <Link to={`${ROUTES.JOBS}/${j.slug || j._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                        <span className="font-semibold text-gray-900 dark:text-white">{j.title}</span>
                        <span className="text-gray-600 dark:text-gray-400"> · {j.organization || j.company}</span>
                        {j.deadline && <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">Deadline: {formatDate(j.deadline)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {savedScholarships.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Saved scholarships</h2>
                <ul className="space-y-3">
                  {savedScholarships.map((s) => (
                    <li key={s._id}>
                      <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                        <span className="font-semibold text-gray-900 dark:text-white">{s.title}</span>
                        <span className="text-gray-600 dark:text-gray-400"> · {s.provider}</span>
                        {s.deadline && <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">Deadline: {formatDate(s.deadline)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {savedAdmissions.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Saved admissions</h2>
                <ul className="space-y-3">
                  {savedAdmissions.map((a) => (
                    <li key={a._id}>
                      <Link to={`${ROUTES.ADMISSIONS}/${a.slug || a._id}`} className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition">
                        <span className="font-semibold text-gray-900 dark:text-white">{a.program}</span>
                        <span className="text-gray-600 dark:text-gray-400"> · {a.institution}</span>
                        {a.deadline && <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">Deadline: {formatDate(a.deadline)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
