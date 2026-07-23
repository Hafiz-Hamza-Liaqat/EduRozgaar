import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function RecommendedAdmissionsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.recommendedAdmissions')}
      action={(
        <Link to={ROUTES.ADMISSIONS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      {data?.placeholder || items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.recommendationsPlaceholder')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((a) => (
            <li key={a._id}>
              <Link to={`${ROUTES.ADMISSIONS}/${a.slug || a._id}`} className="text-primary dark:text-mint hover:underline">
                {a.program}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
