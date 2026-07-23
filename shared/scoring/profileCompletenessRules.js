/**
 * L.2.8 — Canonical profile completeness rules (single source of truth).
 * Used by ScoringService providers, dashboard, and employer candidate cards.
 */

export const PROFILE_COMPLETENESS_CHECKS = [
  { key: 'displayName', label: 'Add a display name', test: (p) => Boolean(p?.displayName) },
  { key: 'headline', label: 'Add a professional headline', test: (p) => Boolean(p?.headline) },
  {
    key: 'summary',
    label: 'Write a longer summary (40+ chars)',
    test: (p) => Boolean(p?.summary && String(p.summary).trim().length >= 40),
  },
  { key: 'education', label: 'Add education history', test: (p) => (p?.education?.length || 0) > 0 },
  { key: 'experience', label: 'Add work experience', test: (p) => (p?.experience?.length || 0) > 0 },
  { key: 'skills', label: 'Add at least 3 skills', test: (p) => (p?.skills?.length || 0) >= 3 },
  { key: 'languages', label: 'Add languages', test: (p) => (p?.languages?.length || 0) > 0 },
  { key: 'avatar', label: 'Upload a profile photo', test: (p) => Boolean(p?.avatarUrl) },
];

/**
 * @param {object} profile TalentProfile-like object
 * @returns {{ score: number; done: number; total: number; strengths: string[]; missing: string[]; improvements: string[]; checks: object[] }}
 */
export function evaluateProfileCompleteness(profile = {}) {
  const checks = PROFILE_COMPLETENESS_CHECKS.map((c) => ({
    key: c.key,
    label: c.label,
    ok: c.test(profile),
  }));
  const done = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const score = total > 0 ? Math.round((done / total) * 100) : 0;
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const strengths = checks.filter((c) => c.ok).map((c) => c.key);
  return {
    score,
    done,
    total,
    strengths,
    missing,
    improvements: missing,
    checks,
    explanation: `Profile completeness ${done}/${total} fields filled.`,
  };
}
