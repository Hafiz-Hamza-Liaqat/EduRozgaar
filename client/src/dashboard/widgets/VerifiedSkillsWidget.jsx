import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { WidgetShell } from '../WidgetShell';

export function VerifiedSkillsWidget({ data }) {
  const { t } = useTranslation(['dashboard']);
  const skills = data?.skills || [];

  return (
    <WidgetShell
      title={t('dashboard:widgets.verifiedSkillsAssessments')}
      action={(
        <Link to={ROUTES.ASSESSMENTS} className="text-sm text-primary dark:text-mint hover:underline">
          {t('dashboard:widgets.takeAssessment')}
        </Link>
      )}
    >
      {skills.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard:widgets.noVerifiedSkills')}</p>
      ) : (
        <ul className="space-y-2 text-sm" role="list">
          {skills.map((s) => (
            <li key={s._id} className="flex justify-between gap-2">
              <span className="text-gray-900 dark:text-white">{s.skillName || s.title}</span>
              {s.score != null ? (
                <span className="tabular-nums text-gray-500 dark:text-gray-400">{s.score}%</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
