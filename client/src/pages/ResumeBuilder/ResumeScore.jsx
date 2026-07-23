import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { evaluateResumeQuality } from '@shared/scoring/resumeQualityRules.js';

/**
 * L.2.8 — Client uses canonical shared resume quality rules (same as ScoringService provider).
 */
export function ResumeScore({ resume, profile = null }) {
  const { t } = useTranslation('resume');
  const result = useMemo(
    () => evaluateResumeQuality({
      profile: profile || {},
      resumeVersions: resume ? [{ isPrimary: true, title: 'Resume', status: 'draft', snapshot: resume }] : [],
    }),
    [resume, profile],
  );

  const { score, suggestions } = {
    score: result.score,
    suggestions: result.suggestions || result.improvements || [],
  };

  const color = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('resumeScoreTitle')}</h3>
      <p className={`text-2xl font-bold ${color}`}>{t('scoreOutOf', { score })}</p>
      {result.strengths?.length > 0 && (
        <ul className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 space-y-0.5">
          {result.strengths.slice(0, 4).map((s) => (
            <li key={s}>✓ {s}</li>
          ))}
        </ul>
      )}
      {suggestions.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {suggestions.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
