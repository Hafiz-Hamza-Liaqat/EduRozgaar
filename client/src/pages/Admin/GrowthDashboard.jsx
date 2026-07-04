import { useState, useEffect } from 'react';
import { SeoHead } from '../../components/seo';
import { adminApi } from '../../services/listingsService';

export default function GrowthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraperRunning, setScraperRunning] = useState(false);

  useEffect(() => {
    adminApi.growthDashboard()
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const runScraper = () => {
    setScraperRunning(true);
    adminApi.scraperRun()
      .then(() => {
        setScraperRunning(false);
        adminApi.growthDashboard().then(({ data: d }) => setData(d)).catch(() => {});
      })
      .catch(() => setScraperRunning(false));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SeoHead title="Growth Dashboard" noindex />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SeoHead title="Growth Dashboard" noindex />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Growth Dashboard" noindex />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Growth Dashboard</h1>
          <button
            type="button"
            onClick={runScraper}
            disabled={scraperRunning}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover btn-theme disabled:opacity-50 text-sm"
          >
            {scraperRunning ? 'Running...' : 'Run scraper now'}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Users, engagement, scraper stats, and newsletter. Placeholders for revenue & mobile app metrics.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.totalUsers ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">New today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.newUsersToday ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">DAU</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.dailyActiveUsers ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Recommended clicks today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.recommendedClicksToday ?? 0}</p>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scraper</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><p className="text-sm text-gray-500">Scraped listings</p><p className="text-xl font-bold">{data?.scraper?.scrapedListingsCount ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">Total jobs added</p><p className="text-xl font-bold">{data?.scraper?.totalJobsAdded ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">Total admissions added</p><p className="text-xl font-bold">{data?.scraper?.totalAdmissionsAdded ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">Runs</p><p className="text-xl font-bold">{data?.scraper?.totalRuns ?? 0}</p></div>
          </div>
          {data?.scraper?.lastRuns?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last runs</p>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                {data.scraper.lastRuns.slice(0, 5).map((r) => (
                  <li key={r._id}>
                    {new Date(r.runAt).toLocaleString()} – {r.status} – jobs: {r.jobsAdded}, admissions: {r.admissionsAdded}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending searches (7d)</h2>
          {data?.trendingSearches?.length > 0 ? (
            <ul className="space-y-2">
              {data.trendingSearches.map((s, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.query}</span>
                  <span className="text-gray-500">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No search data yet.</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Newsletter</h2>
          <p className="text-sm text-gray-500 mb-2">Total sent (last 10): {data?.newsletter?.totalSent ?? 0}</p>
          {data?.newsletter?.lastLogs?.length > 0 ? (
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              {data.newsletter.lastLogs.slice(0, 5).map((l) => (
                <li key={l._id}>{new Date(l.sentAt).toLocaleString()} – {l.sentCount} – {l.subject}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No newsletter logs yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
