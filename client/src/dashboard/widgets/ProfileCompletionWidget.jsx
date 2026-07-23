import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function ProfileCompletionWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.profileCompletion')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell
      title={t('dashboard:widgets.profileCompletion')}
      action={(
        <Link to={ROUTES.TALENT_PROFILE} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:editProfile')}
        </Link>
      )}
    >
      <div className="mb-3">
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${data.completionPercent || 0}%` }}
            role="progressbar"
            aria-valuenow={data.completionPercent || 0}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{data.completionPercent || 0}%</p>
      </div>
      <ul className="space-y-1 text-sm" role="list">
        {(data.checks || []).map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span aria-hidden="true">{c.ok ? '✓' : '○'}</span>
            {t(`dashboard:widgets.${c.labelKey}`, { defaultValue: c.key })}
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}
