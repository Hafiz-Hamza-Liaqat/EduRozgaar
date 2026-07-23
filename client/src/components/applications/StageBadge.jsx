import { useTranslation } from 'react-i18next';
import { stageBadgeClass } from '../../utils/applicationUi';

export function StageBadge({ stage, className = '' }) {
  const { t } = useTranslation(['applications']);
  if (!stage) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadgeClass(stage)} ${className}`}
      aria-label={t('applications:stageBadge', { stage: t(`applications:stages.${stage}`, { defaultValue: stage }) })}
    >
      {t(`applications:stages.${stage}`, { defaultValue: stage })}
    </span>
  );
}
