import { useTranslation } from 'react-i18next';
import { Panel, EmptyHint } from './Panel';

export default function HiringTasksWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const tasks = data?.tasks || [];
  return (
    <Panel title={t('employer:widgetHiringTasks')}>
      {!tasks.length ? <EmptyHint>{t('employer:noTasks')}</EmptyHint> : (
        <ul className="space-y-2 text-sm">
          {tasks.map((task) => (
            <li key={task.key} className="flex justify-between">
              <span>{t(`employer:${task.labelKey}`)}</span>
              <span className="font-semibold">{task.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
