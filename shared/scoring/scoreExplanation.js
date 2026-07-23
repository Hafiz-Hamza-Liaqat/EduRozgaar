/**
 * L.2.8 — Unified explainability builder for all score types.
 */

export function buildUnifiedScoreExplanation(snapshotOrResult, scoreType = 'career_readiness') {
  if (!snapshotOrResult) return null;

  const overall = snapshotOrResult.overall ?? snapshotOrResult.score ?? 0;
  const factors = snapshotOrResult.factors || [];
  const improvements = snapshotOrResult.improvements
    || factors.flatMap((f) => f.improvements || []).filter(Boolean);

  const increased = factors
    .filter((f) => (f.score ?? 0) >= 70)
    .map((f) => ({
      providerId: f.providerId || f.key,
      score: f.score,
      explanation: f.explanation,
    }));

  const reduced = factors
    .filter((f) => (f.score ?? 0) < 70)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map((f) => ({
      providerId: f.providerId || f.key,
      score: f.score,
      explanation: f.explanation,
      improvements: f.improvements || [],
    }));

  const titles = {
    career_readiness: 'Career Readiness',
    resume_strength: 'Resume Quality',
    job_match: 'Job Match',
    technical_readiness: 'Technical Readiness',
  };

  return {
    scoreType,
    title: titles[scoreType] || scoreType,
    overall,
    summary: snapshotOrResult.summary
      || snapshotOrResult.explanation
      || `${titles[scoreType] || scoreType}: ${overall}/100`,
    factors,
    strengths: snapshotOrResult.strengths || increased.map((i) => i.explanation).filter(Boolean),
    missing: snapshotOrResult.missing || snapshotOrResult.missingRequirements || [],
    whatIncreased: increased,
    whatReduced: reduced,
    improvements: [...new Set(improvements)].slice(0, 12),
    howToImprove: [...new Set(improvements)].slice(0, 8),
    deterministic: snapshotOrResult.deterministic !== false,
    aiUsed: false,
    version: snapshotOrResult.version,
    computedAt: snapshotOrResult.computedAt,
  };
}
