import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function InterviewScheduleWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.interviewSchedule')}
      action={(
        <Link to={ROUTES.APPLICATIONS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noInterviews')}</p>
      ) : (
        <ul className="space-y-3 text-sm" role="list">
          {items.map((item) => (
            <li key={item.applicationId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
              <Link
                to={`${ROUTES.APPLICATIONS}/${item.applicationId}`}
                className="font-medium text-primary dark:text-mint hover:underline"
              >
                {item.title}
              </Link>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                <time dateTime={item.scheduledAt}>{new Date(item.scheduledAt).toLocaleString()}</time>
                {item.mode ? ` · ${item.mode}` : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
