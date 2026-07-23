import { useTranslation } from 'react-i18next';

/**
 * L.2.8 — Deterministic score explainability panel (no black-box scores).
 */
export function ScoreExplainPanel({
  title,
  overall,
  explanation,
  strengths = [],
  missing = [],
  factors = [],
  className = '',
}) {
  const { t } = useTranslation('dashboard');

  const exp = explanation && typeof explanation === 'object' ? explanation : null;
  const score = overall ?? exp?.overall ?? null;
  const strList = strengths.length ? strengths : (exp?.strengths || []);
  const missList = missing.length ? missing : (exp?.missing || []);
  const factorList = factors.length ? factors : (exp?.factors || []);
  const improvements = exp?.howToImprove || exp?.improvements || [];

  if (score == null && !factorList.length) return null;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4 space-y-3 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {score != null && (
          <span className="text-2xl font-bold text-primary dark:text-mint">{score}%</span>
        )}
      </div>
      {(exp?.summary || exp?.explanation) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{exp.summary || exp.explanation}</p>
      )}
      {factorList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('scoreBreakdown', { defaultValue: 'Breakdown' })}</p>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {factorList.slice(0, 8).map((f) => (
              <li key={f.providerId || f.key || f.label}>
                {f.explanation || f.label}
                {f.score != null && <span className="text-gray-500"> — {f.score}%</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {strList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">{t('strengths', { defaultValue: 'Strengths' })}</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
            {strList.map((s) => (
              <li key={s}>✓ {s}</li>
            ))}
          </ul>
        </div>
      )}
      {missList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">{t('missing', { defaultValue: 'Missing' })}</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
            {missList.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {improvements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{t('howToImprove', { defaultValue: 'How to improve' })}</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
            {improvements.slice(0, 6).map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[10px] text-gray-400">{t('deterministicScoreNote', { defaultValue: 'Deterministic score — explainable rules, no AI.' })}</p>
    </div>
  );
}
