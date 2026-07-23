import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants';
import { Panel, EmptyHint } from './Panel';

export default function RecommendedCandidatesWidget({ data }) {
  const { t } = useTranslation(['employer']);
  const candidates = data?.candidates || [];
  return (
    <Panel title={t('employer:widgetRecommendedCandidates')}>
      <p className="text-xs text-gray-500 mb-2">{t('employer:rankingDeterministicHint')}</p>
      {!candidates.length ? <EmptyHint>{t('employer:noCandidates')}</EmptyHint> : (
        <ul className="space-y-2 text-sm">
          {candidates.map((c) => (
            <li key={c.legacyApplicationId}>
              <Link className="text-primary dark:text-mint hover:underline" to={`${ROUTES.EMPLOYER_INTELLIGENCE_CANDIDATES}/${c.legacyApplicationId}`}>
                {c.displayName || t('employer:unnamedCandidate')}
              </Link>
              <span className="text-xs text-gray-500 ml-2">{c.ranking?.percent ?? '—'}%</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
