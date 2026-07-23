import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function RecommendedJobsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.recommendedJobs')}
      action={(
        <Link to={ROUTES.JOBS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      {data?.placeholder || items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.recommendationsPlaceholder')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((j) => (
            <li key={j._id}>
              <Link to={`${ROUTES.JOBS}/${j.slug || j._id}`} className="text-primary dark:text-mint hover:underline">
                {j.title}
              </Link>
              {j.company ? <span className="text-gray-500 dark:text-gray-400"> · {j.company}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
