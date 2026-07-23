import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { adminApi } from '../../services/listingsService';
import { AdminRouteGuard } from '../../components/admin/AdminRouteGuard';
import { PERMISSIONS } from '../../config/rbac';

export default function GrowthDashboard() {
  const { t } = useTranslation(['admin', 'common']);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraperRunning, setScraperRunning] = useState(false);

  useEffect(() => {
    adminApi.growthDashboard()
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(e.response?.data?.error || t('common:failedToLoad')))
      .finally(() => setLoading(false));
  }, [t]);

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
      <div className="max-w-5xl min-w-0 w-full">
        <SeoHead title={t('admin:growthDashboard')} noindex />
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
      <div className="max-w-5xl min-w-0 w-full">
        <SeoHead title={t('admin:growthDashboard')} noindex />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <AdminRouteGuard anyPermission={[PERMISSIONS.ANALYTICS_READ, PERMISSIONS.SCRAPER_RUN]}>
      <SeoHead title={t('admin:growthDashboard')} noindex />
      <div className="max-w-5xl min-w-0 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin:growthDashboard')}</h1>
          <button
            type="button"
            onClick={runScraper}
            disabled={scraperRunning}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover btn-theme disabled:opacity-50 text-sm"
          >
            {scraperRunning ? t('admin:scraperRunning') : t('admin:runScraperNow')}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('admin:growthIntro')}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin:totalUsers')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.totalUsers ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin:newToday')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.newUsersToday ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin:dau')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.dailyActiveUsers ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin:recommendedClicksToday')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.recommendedClicksToday ?? 0}</p>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin:scraper')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><p className="text-sm text-gray-500">{t('admin:scrapedListings')}</p><p className="text-xl font-bold">{data?.scraper?.scrapedListingsCount ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">{t('admin:totalJobsAdded')}</p><p className="text-xl font-bold">{data?.scraper?.totalJobsAdded ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">{t('admin:totalAdmissionsAdded')}</p><p className="text-xl font-bold">{data?.scraper?.totalAdmissionsAdded ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">{t('admin:runs')}</p><p className="text-xl font-bold">{data?.scraper?.totalRuns ?? 0}</p></div>
          </div>
          {data?.scraper?.lastRuns?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin:lastRuns')}</p>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                {data.scraper.lastRuns.slice(0, 5).map((r) => (
                  <li key={r._id}>
                    {t('admin:lastRunEntry', {
                      date: new Date(r.runAt).toLocaleString(),
                      status: r.status,
                      jobs: r.jobsAdded,
                      admissions: r.admissionsAdded,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin:trendingSearches7dShort')}</h2>
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
            <p className="text-gray-500 text-sm">{t('admin:noSearchData')}</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin:newsletter')}</h2>
          <p className="text-sm text-gray-500 mb-2">{t('admin:newsletterTotalSent', { count: data?.newsletter?.totalSent ?? 0 })}</p>
          {data?.newsletter?.lastLogs?.length > 0 ? (
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              {data.newsletter.lastLogs.slice(0, 5).map((l) => (
                <li key={l._id}>{t('admin:newsletterLogEntry', { date: new Date(l.sentAt).toLocaleString(), count: l.sentCount, subject: l.subject })}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">{t('admin:noNewsletterLogs')}</p>
          )}
        </section>
      </div>
    </AdminRouteGuard>
  );
}
