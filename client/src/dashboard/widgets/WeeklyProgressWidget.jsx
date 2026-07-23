import { useTranslation } from 'react-i18next';
import { WidgetShell } from '../WidgetShell';

export function WeeklyProgressWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.weeklyProgress')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  const rows = [
    { key: 'apps', label: t('dashboard:widgets.weekAppsUpdated'), value: data.applicationsUpdated ?? 0 },
    { key: 'events', label: t('dashboard:widgets.weekTimelineEvents'), value: data.timelineEvents ?? 0 },
    { key: 'creds', label: t('dashboard:widgets.weekCredentials'), value: data.credentialsEarned ?? 0 },
  ];

  return (
    <WidgetShell title={t('dashboard:widgets.weeklyProgress')}>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="list">
        {rows.map((r) => (
          <li key={r.key} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{r.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.label}</p>
          </li>
        ))}
      </ul>
      {data.readinessDelta != null ? (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          {t('dashboard:widgets.weekReadinessDelta', {
            delta: data.readinessDelta >= 0 ? `+${data.readinessDelta}` : data.readinessDelta,
            overall: data.readinessOverall ?? '—',
          })}
        </p>
      ) : null}
    </WidgetShell>
  );
}
