import { useTranslation } from 'react-i18next';
import { Panel, EmptyHint } from './Panel';

export default function EmployerRecentActivityWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const activity = data?.activity || [];
  return (
    <Panel title={t('employer:widgetRecentActivity')}>
      {!activity.length ? <EmptyHint>{t('employer:noData')}</EmptyHint> : (
        <ul className="space-y-2 text-sm">
          {activity.map((a) => (
            <li key={a.legacyApplicationId} className="flex justify-between gap-2">
              <span className="text-gray-700 dark:text-gray-200">{a.pipelineStage}</span>
              <span className="text-xs text-gray-500">{a.at ? new Date(a.at).toLocaleDateString() : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
