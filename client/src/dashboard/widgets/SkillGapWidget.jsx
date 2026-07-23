import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WidgetShell } from '../WidgetShell';

export function SkillGapWidget({ data }) {
  const { t } = useTranslation('dashboard');
  if (!data) return null;

  return (
    <WidgetShell title={t('widgets.skillGap', { defaultValue: 'Skill gap analysis' })}>
      <p className="text-xs text-gray-500 mb-3">{data.targetLabel}</p>
      {data.missingSkills?.length > 0 ? (
        <div className="mb-3">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">{t('missingSkills', { defaultValue: 'Missing skills' })}</p>
          <ul className="text-sm space-y-0.5 text-gray-700 dark:text-gray-300">
            {data.missingSkills.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('noSkillGaps', { defaultValue: 'No major skill gaps for your current target.' })}</p>
      )}
      {data.recommendedAssessments?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">{t('recommendedAssessments', { defaultValue: 'Recommended assessments' })}</p>
          <ul className="text-sm space-y-1">
            {data.recommendedAssessments.map((a) => (
              <li key={a.id || a.href}>
                <Link to={a.href} className="text-primary dark:text-mint hover:underline">{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.milestones?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{t('careerMilestones', { defaultValue: 'Career milestones' })}</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400">
            {data.milestones.slice(0, 3).map((m) => (
              <li key={m.title}>{m.title} {m.progress != null && `(${m.progress}%)`}</li>
            ))}
          </ul>
        </div>
      )}
    </WidgetShell>
  );
}
