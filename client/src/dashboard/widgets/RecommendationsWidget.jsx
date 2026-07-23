import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

/**
 * Recommendations placeholder — uses server-composed listing data when available.
 * @param {{ data?: object }} props
 */
export function RecommendationsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);

  const jobs = data?.jobs || [];
  const scholarships = data?.scholarships || [];
  const admissions = data?.admissions || [];
  const isEmpty = jobs.length + scholarships.length + admissions.length === 0;

  return (
    <WidgetShell title={t('dashboard:widgets.recommendations')}>
      {data?.placeholder || isEmpty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.recommendationsPlaceholder')}</p>
      ) : (
        <div className="space-y-4 text-sm">
          {jobs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dashboard:widgets.recommendedJobs')}</p>
              <ul className="space-y-1">
                {jobs.map((j) => (
                  <li key={j._id}>
                    <Link to={`${ROUTES.JOBS}/${j.slug || j._id}`} className="text-primary dark:text-mint hover:underline">
                      {j.title}
                    </Link>
                    {j.company ? <span className="text-gray-500 dark:text-gray-400"> · {j.company}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scholarships.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dashboard:widgets.recommendedScholarships')}</p>
              <ul className="space-y-1">
                {scholarships.map((s) => (
                  <li key={s._id}>
                    <Link to={`${ROUTES.SCHOLARSHIPS}/${s.slug || s._id}`} className="text-primary dark:text-mint hover:underline">
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {admissions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('dashboard:widgets.recommendedAdmissions')}</p>
              <ul className="space-y-1">
                {admissions.map((a) => (
                  <li key={a._id}>
                    <Link to={`${ROUTES.ADMISSIONS}/${a.slug || a._id}`} className="text-primary dark:text-mint hover:underline">
                      {a.program}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
