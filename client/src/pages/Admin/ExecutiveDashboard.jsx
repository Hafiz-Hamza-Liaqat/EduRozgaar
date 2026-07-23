import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { adminApi } from '../../services/listingsService';
import { SimpleBarChart, SimpleHorizontalChart } from '../../components/admin/SimpleBarChart';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/rbac';
import { AdminRouteGuard } from '../../components/admin/AdminRouteGuard';

function MetricCard({ label, value, sub }) {
  const display = value == null ? '—' : typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{display}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { t } = useTranslation(['admin', 'common']);
  const { can, role } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasAnalytics = can(PERMISSIONS.ANALYTICS_READ);

  useEffect(() => {
    if (!hasAnalytics) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    adminApi.executiveDashboard()
      .then(({ data: d }) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.error || t('common:failedToLoad')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hasAnalytics, role, t]);

  const handleExport = (format) => {
    adminApi.exportData('analytics', format);
  };

  if (!hasAnalytics) {
    return (
      <AdminRouteGuard permission={PERMISSIONS.ANALYTICS_READ}>
        <p className="text-gray-500">{t('admin:noAnalyticsAccess')}</p>
      </AdminRouteGuard>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 dark:text-red-400">{error}</p>;
  }

  const cards = data?.cards || {};
  const charts = data?.charts || {};

  const cardItems = [
    { label: t('admin:totalUsers'), value: cards.totalUsers },
    { label: t('admin:activeToday'), value: cards.activeToday },
    { label: t('admin:activeWeek'), value: cards.activeWeek },
    { label: t('admin:activeMonth'), value: cards.activeMonth },
    { label: t('admin:newToday'), value: cards.newUsersToday },
    { label: t('admin:newUsersMonth'), value: cards.newUsersMonth },
    { label: t('admin:employers'), value: cards.employers },
    { label: t('admin:verifiedEmployers'), value: cards.verifiedEmployers },
    { label: t('admin:jobs'), value: cards.jobs },
    { label: t('admin:pendingJobs'), value: cards.pendingJobs },
    { label: t('admin:applications'), value: cards.applications },
    { label: 'Applications today', value: cards.applicationsToday },
    { label: 'Applications (30d)', value: cards.applicationsMonth },
    { label: 'Resumes created', value: cards.resumesCreated },
    { label: 'Resume AI scans', value: cards.resumeAiUsage },
    { label: 'Resume downloads (30d)', value: cards.resumeDownloads },
    { label: 'Scholarship saves', value: cards.scholarshipSaves },
    { label: 'Admission saves', value: cards.admissionSaves },
    { label: 'Emails sent today', value: cards.emailsSentToday },
    { label: 'Queue pending', value: cards.queuePending },
    { label: t('admin:scholarships'), value: cards.scholarships },
    { label: t('admin:admissions'), value: cards.admissions },
    { label: t('admin:blogs'), value: cards.blogs },
    { label: t('admin:careerArticles'), value: cards.careerArticles },
    { label: t('admin:foreignStudies'), value: cards.foreignStudies },
    { label: t('admin:resumeTemplates'), value: cards.resumeTemplates },
    { label: t('admin:revenue'), value: cards.revenue, sub: 'PKR' },
    { label: t('admin:pendingPayments'), value: cards.pendingPayments },
    { label: t('admin:pendingReports'), value: cards.pendingReports },
    { label: t('admin:advertisements'), value: cards.advertisements },
  ];

  return (
    <AdminRouteGuard permission={PERMISSIONS.ANALYTICS_READ}>
      <SeoHead title={t('admin:executiveDashboard')} noindex />
      <div className="max-w-6xl min-w-0 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin:executiveDashboard')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('admin:dataSource')}: {data?.dataSource || 'mongodb'}
              {data?.generatedAt && ` · ${new Date(data.generatedAt).toLocaleString()}`}
            </p>
          </div>
          {can(PERMISSIONS.EXPORT_DATA) && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleExport('csv')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                CSV
              </button>
              <button type="button" onClick={() => handleExport('xlsx')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                Excel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {cardItems.map((c) => (
            <MetricCard key={c.label} label={c.label} value={c.value} sub={c.sub} />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:dailyActiveUsers')}</h2>
            <SimpleBarChart data={charts.dailyActiveUsers} labelKey="date" valueKey="value" emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:monthlyRegistrations')}</h2>
            <SimpleBarChart data={charts.monthlyRegistrations} emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:applicationsChart')}</h2>
            <SimpleBarChart data={charts.applications} labelKey="date" valueKey="value" emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:jobsPostedChart')}</h2>
            <SimpleBarChart data={charts.jobsPosted} labelKey="date" valueKey="value" emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:revenueChart')}</h2>
            <SimpleBarChart data={charts.revenue} labelKey="date" valueKey="value" emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:employerGrowth')}</h2>
            <SimpleBarChart data={charts.employerGrowth} labelKey="date" valueKey="value" emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:trafficSources')}</h2>
            <SimpleHorizontalChart data={charts.trafficSources} emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin:contentPublishing')}</h2>
            <SimpleHorizontalChart data={charts.contentPublishing} emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Devices (30d)</h2>
            <SimpleHorizontalChart data={charts.deviceStats} emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Browsers (30d)</h2>
            <SimpleHorizontalChart data={charts.browserStats} emptyLabel={t('admin:noData')} />
          </section>
          <section className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Countries (30d)</h2>
            <SimpleHorizontalChart data={charts.countryStats} emptyLabel={t('admin:noData')} />
          </section>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
