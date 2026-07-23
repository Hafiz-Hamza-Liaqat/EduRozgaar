import { useTranslation } from 'react-i18next';
import { Panel, EmptyHint } from './Panel';

export default function VerifiedSkillsSummaryWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const skills = data?.skills || [];
  return (
    <Panel title={t('employer:widgetVerifiedSkills')}>
      {!skills.length ? <EmptyHint>{t('employer:noVerifiedSkills')}</EmptyHint> : (
        <ul className="space-y-1 text-sm">
          {skills.map((s) => (
            <li key={s.name} className="flex justify-between gap-2">
              <span className="truncate">{s.name}</span>
              <span className="text-gray-500">{s.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
