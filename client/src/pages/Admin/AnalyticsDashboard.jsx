import { useState, useEffect } from 'react';
import { SeoHead } from '../../components/seo';
import { v1Api } from '../../services/listingsService';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    v1Api.analyticsDashboard()
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(e.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SeoHead title="Analytics" noindex />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SeoHead title="Analytics" noindex />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Analytics Dashboard" description="Engagement and notification metrics." noindex />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Engagement and notification metrics. Placeholder for revenue and ad analytics.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily active users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.dailyActiveUsers ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Recommended clicks today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.recommendedClicksToday ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Notifications sent today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.notificationsSentToday ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Notifications opened today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.notificationsOpenedToday ?? 0}</p>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending searches (last 7 days)</h2>
          {data?.trendingSearches?.length > 0 ? (
            <ul className="space-y-2">
              {data.trendingSearches.map((s, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.query}</span>
                  <span className="text-gray-500 dark:text-gray-400">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No search data yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
