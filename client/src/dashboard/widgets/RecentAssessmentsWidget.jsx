import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function RecentAssessmentsWidget({ data }) {
  const { t } = useTranslation(['dashboard', 'assessments']);
  const items = data?.recentAttempts || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.recentAssessments')}
      action={(
        <Link to={ROUTES.ASSESSMENTS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:viewAllArrow')}
        </Link>
      )}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {t('dashboard:widgets.assessmentsPublished', { count: data?.publishedCount ?? 0 })}
        {data?.inProgressCount ? ` · ${t('dashboard:widgets.assessmentsInProgress', { count: data.inProgressCount })}` : ''}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noAssessments')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {items.map((a) => (
            <li key={a._id} className="flex justify-between gap-2">
              <span className="text-gray-900 dark:text-white">
                {a.passed ? t('dashboard:widgets.assessmentPassed') : t('dashboard:widgets.assessmentScored')}
                {a.score != null ? ` · ${a.score}%` : ''}
              </span>
              {a.scoredAt ? (
                <time className="text-xs text-gray-500 shrink-0" dateTime={a.scoredAt}>
                  {new Date(a.scoredAt).toLocaleDateString()}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
