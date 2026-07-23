import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function GoalsTargetsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  if (!data) {
    return (
      <WidgetShell title={t('dashboard:widgets.goalsTargets')}>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.unavailable')}</p>
      </WidgetShell>
    );
  }

  const goals = data.goals || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.goalsTargets')}
      action={(
        <Link to={ROUTES.TALENT_PROFILE} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:editProfile')}
        </Link>
      )}
    >
      {data.preferredRole ? (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span className="text-gray-500 dark:text-gray-400">{t('dashboard:widgets.preferredRole')}: </span>
          {data.preferredRole}
        </p>
      ) : null}
      {goals.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noGoals')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {goals.map((g, idx) => (
            <li key={`${g.title}-${idx}`} className="flex justify-between gap-2">
              <span className="text-gray-900 dark:text-white">{g.title || t('dashboard:widgets.untitledGoal')}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{g.status}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
