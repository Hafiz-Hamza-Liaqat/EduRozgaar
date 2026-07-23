/**
 * Deterministic employer candidate ranking (C.8.5) — configurable weights, explainable factors.
 * No AI / hidden scoring.
 */
import { loadRankingConfig, DEFAULT_RANKING_VERSION } from '../../../../shared/employer/rankingWeights.js';

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function scoreReadiness(card) {
  const overall = card?.readiness?.overall;
  if (overall == null) return 0;
  return clamp01(Number(overall) / 100);
}

function scoreVerifiedAssessments(card) {
  const skills = card?.verifiedSkills || [];
  if (!skills.length) return 0;
  const avg = skills.reduce((s, v) => s + (Number(v.score) || 0), 0) / skills.length;
  const density = Math.min(1, skills.length / 5);
  return clamp01((clamp01(avg / 100) * 0.7) + (density * 0.3));
}

function scoreExperience(card) {
  const years = Number(card?.experienceYears);
  if (Number.isFinite(years) && years > 0) return clamp01(years / 10);
  const entries = card?.experienceSummary?.length || 0;
  return clamp01(entries / 4);
}

function scoreProfileCompleteness(card) {
  if (card?.profileCompleteness != null) return clamp01(Number(card.profileCompleteness) / 100);
  let hits = 0;
  const checks = [
    card?.basic?.displayName,
    card?.headline,
    card?.location,
    card?.workPreference,
    (card?.verifiedSkills || []).length,
    card?.resumeVersion,
    (card?.credentials || []).length,
  ];
  for (const c of checks) if (c) hits += 1;
  return clamp01(hits / checks.length);
}

function scoreRecentActivity(card) {
  const at = card?.recentActivityAt ? new Date(card.recentActivityAt).getTime() : 0;
  if (!at) return 0;
  const days = (Date.now() - at) / (24 * 60 * 60 * 1000);
  if (days <= 7) return 1;
  if (days <= 30) return 0.6;
  if (days <= 90) return 0.3;
  return 0.1;
}

const FACTOR_SCORERS = {
  readiness: scoreReadiness,
  verified_assessments: scoreVerifiedAssessments,
  experience: scoreExperience,
  profile_completeness: scoreProfileCompleteness,
  recent_activity: scoreRecentActivity,
};

/**
 * @param {object} card - employer candidate card projection
 * @param {string} [version]
 * @returns {{ score: number, version: string, weights: object, factors: Array }}
 */
export function rankCandidate(card, version = DEFAULT_RANKING_VERSION) {
  const config = loadRankingConfig(version);
  const weights = config.ranking;
  const factors = [];
  let total = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const scorer = FACTOR_SCORERS[key];
    const raw = scorer ? scorer(card) : 0;
    const weighted = clamp01(raw) * Number(weight);
    total += weighted;
    factors.push({
      key,
      weight: Number(weight),
      rawScore: Math.round(clamp01(raw) * 1000) / 1000,
      contribution: Math.round(weighted * 1000) / 1000,
      explanationKey: `ranking.factor.${key}`,
    });
  }

  return {
    score: Math.round(total * 1000) / 1000,
    percent: Math.round(total * 100),
    version: config.version,
    weights: { ...weights },
    factors,
    deterministic: true,
    aiUsed: false,
  };
}

export function rankCandidates(cards, version = DEFAULT_RANKING_VERSION) {
  return (cards || [])
    .map((card) => ({
      ...card,
      ranking: rankCandidate(card, version),
    }))
    .sort((a, b) => (b.ranking?.score || 0) - (a.ranking?.score || 0));
}

export const EmployerRankingService = {
  rankCandidate,
  rankCandidates,
  getWeights: (version) => {
    const config = loadRankingConfig(version || DEFAULT_RANKING_VERSION);
    return { version: config.version, weights: { ...config.ranking } };
  },
};
