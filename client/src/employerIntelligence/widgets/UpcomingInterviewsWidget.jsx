import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants';
import { Panel, EmptyHint } from './Panel';

export default function UpcomingInterviewsWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const interviews = data?.interviews || [];
  return (
    <Panel title={t('employer:widgetUpcomingInterviews')}>
      {!interviews.length ? <EmptyHint>{t('employer:noInterviews')}</EmptyHint> : (
        <ul className="space-y-2">
          {interviews.map((i) => (
            <li key={i.legacyApplicationId} className="text-sm">
              <Link className="text-primary dark:text-mint hover:underline" to={`${ROUTES.EMPLOYER_INTELLIGENCE_CANDIDATES}/${i.legacyApplicationId}`}>
                {i.displayName || t('employer:unnamedCandidate')}
              </Link>
              <div className="text-xs text-gray-500">
                {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : '—'} · {i.mode || '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
