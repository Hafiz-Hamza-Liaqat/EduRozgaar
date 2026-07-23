import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants';
import { Panel, EmptyHint } from './Panel';

export default function CandidateRankingsWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const candidates = data?.candidates || [];
  return (
    <Panel title={t('employer:widgetCandidateRankings')}>
      {!candidates.length ? <EmptyHint>{t('employer:noCandidates')}</EmptyHint> : (
        <ul className="space-y-2">
          {candidates.map((c) => (
            <li key={c.legacyApplicationId} className="text-sm flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="font-medium text-primary dark:text-mint hover:underline truncate block"
                  to={`${ROUTES.EMPLOYER_INTELLIGENCE_CANDIDATES}/${c.legacyApplicationId}`}
                >
                  {c.displayName || t('employer:unnamedCandidate')}
                </Link>
                <div className="text-xs text-gray-500 truncate">{c.headline || c.jobTitle}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold">{c.ranking?.percent ?? '—'}%</div>
                <div className="text-xs text-gray-500">{t('employer:readinessShort')}: {c.readiness ?? '—'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
