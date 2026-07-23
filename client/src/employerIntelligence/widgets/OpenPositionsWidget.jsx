import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants';
import { Panel, EmptyHint } from './Panel';

export default function OpenPositionsWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const positions = data?.positions || [];
  return (
    <Panel title={t('employer:widgetOpenPositions')}>
      {!positions.length ? <EmptyHint>{t('employer:noJobsYet')}</EmptyHint> : (
        <ul className="space-y-2">
          {positions.map((p) => (
            <li key={p._id} className="text-sm flex justify-between gap-2">
              <Link className="text-primary dark:text-mint hover:underline truncate" to={`${ROUTES.EMPLOYER_INTELLIGENCE_CANDIDATES}?jobId=${p._id}`}>
                {p.title}
              </Link>
              <span className="text-gray-500 shrink-0">{p.applicationsCount || 0}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
