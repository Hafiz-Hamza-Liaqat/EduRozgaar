import { useTranslation } from 'react-i18next';
import { Panel, EmptyHint } from './Panel';

export default function PipelineMetricsWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const counts = data?.counts || {};
  const stages = data?.stages || Object.keys(counts);
  if (!stages.length) return <Panel title={t('employer:widgetPipelineMetrics')}><EmptyHint>{t('employer:noData')}</EmptyHint></Panel>;
  return (
    <Panel title={t('employer:widgetPipelineMetrics')}>
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <div key={stage} className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs">
            <span className="text-gray-500">{stage}</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{counts[stage] || 0}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
