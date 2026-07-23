import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

/**
 * Career health overview — readiness + tracker + profile signals (composition data only).
 */
export function CareerHealthWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.careerHealth')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  const tiles = [
    { label: t('dashboard:widgets.readinessOverall'), value: data.readinessScore == null ? '—' : data.readinessScore },
    { label: t('dashboard:widgets.trackerActive'), value: data.activeApplications ?? 0 },
    { label: t('dashboard:widgets.trackerInterviews'), value: data.interviewsScheduled ?? 0 },
    { label: t('dashboard:widgets.completion'), value: `${data.profileCompletion ?? 0}%` },
  ];

  return (
    <WidgetShell
      title={t('dashboard:widgets.careerHealth')}
      action={(
        <Link to={ROUTES.APPLICATIONS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:widgets.openTracker')}
        </Link>
      )}
    >
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {t(`dashboard:widgets.health.${data.healthLabel}`, { defaultValue: data.healthLabel })}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{tile.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tile.label}</p>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
