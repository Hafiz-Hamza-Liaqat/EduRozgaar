import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function RecommendedScholarshipsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const items = data?.items || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.recommendedScholarships')}
      action={(
        <Link to={ROUTES.SCHOLARSHIPS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      {data?.placeholder || items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.recommendationsPlaceholder')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((s) => (
            <li key={s._id}>
              <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="text-primary dark:text-mint hover:underline">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
