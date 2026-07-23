import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function UpcomingDeadlinesWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.upcomingDeadlines')}
      action={(
        <Link to={ROUTES.APPLICATIONS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noDeadlines')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((item) => (
            <li key={`${item.applicationId}-${item.at}`} className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <Link
                to={`${ROUTES.APPLICATIONS}/${item.applicationId}`}
                className="text-primary dark:text-mint hover:underline font-medium"
              >
                {item.title}
              </Link>
              <time className="text-gray-500 dark:text-gray-400" dateTime={item.at}>
                {new Date(item.at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
