import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

/**
 * @param {{ data?: object }} props
 */
export function ProfileSummaryWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.profileSummary')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  const resumeLabel = data.resumeStatus === 'none'
    ? t('dashboard:widgets.resumeNone')
    : t(`dashboard:widgets.resumeStatus.${data.resumeStatus}`, { defaultValue: data.resumeStatus });

  return (
    <WidgetShell
      title={t('dashboard:widgets.profileSummary')}
      action={(
        <Link to={ROUTES.TALENT_PROFILE} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:editProfile')}
        </Link>
      )}
    >
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.completion')}</p>
          <div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${data.completionPercent || 0}%` }}
              role="progressbar"
              aria-valuenow={data.completionPercent || 0}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-1 text-gray-900 dark:text-white font-medium">{data.completionPercent || 0}%</p>
        </div>
        {data.headline ? (
          <div>
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.headline')}</p>
            <p className="text-gray-900 dark:text-white">{data.headline}</p>
          </div>
        ) : null}
        {data.preferredRole ? (
          <div>
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.preferredRole')}</p>
            <p className="text-gray-900 dark:text-white">{data.preferredRole}</p>
          </div>
        ) : null}
        {data.preferredLocation ? (
          <div>
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.preferredLocation')}</p>
            <p className="text-gray-900 dark:text-white">{data.preferredLocation}</p>
          </div>
        ) : null}
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.resumeStatus')}</p>
          <p className="text-gray-900 dark:text-white">{resumeLabel}</p>
        </div>
      </div>
    </WidgetShell>
  );
}
