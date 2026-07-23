/**
 * L.2.8 — Deterministic skill gap analysis (extends Readiness, no AI).
 */
import { buildDeterministicLearningRecommendations } from '../career/learningRecommendations.js';
import { DEGREE_ROADMAPS } from '../career/degreeRoadmaps.js';

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function profileSkillNames(profile) {
  return (profile?.skills || []).map((s) => norm(typeof s === 'string' ? s : s.name)).filter(Boolean);
}

function verifiedSkillNames(verifiedSkills = [], credentials = []) {
  const fromV = verifiedSkills.map((s) => norm(s.skillName || s.title || ''));
  const fromC = credentials
    .filter((c) => c.verificationStatus === 'active' || c.status === 'active')
    .map((c) => norm(c.skillName || c.title || ''));
  return [...new Set([...fromV, ...fromC].filter(Boolean))];
}

/**
 * @param {object} params
 * @returns {object} skill gap payload for dashboard widget
 */
export function buildSkillGapAnalysis({
  profile = {},
  verifiedSkills = [],
  credentials = [],
  readinessImprovements = [],
  targetJob = null,
  careerGoalTitle = null,
} = {}) {
  const current = [...new Set([...profileSkillNames(profile), ...verifiedSkillNames(verifiedSkills, credentials)])];

  let targetSkills = [];
  if (targetJob) {
    targetSkills = [
      ...(targetJob.skillsRequired || []),
      ...(targetJob.requirements || []),
    ].map((s) => norm(String(s))).filter((s) => s.length > 2);
  } else if (careerGoalTitle) {
    const roadmap = DEGREE_ROADMAPS.find((r) =>
      norm(careerGoalTitle).includes(norm(r.id))
      || r.relatedDegrees.some((d) => norm(careerGoalTitle).includes(norm(d))),
    );
    targetSkills = (roadmap?.requiredSkills || []).map(norm);
  }

  targetSkills = [...new Set(targetSkills)];
  const missing = targetSkills.filter((t) => !current.some((c) => c.includes(t) || t.includes(c)));
  const matched = targetSkills.filter((t) => current.some((c) => c.includes(t) || t.includes(c)));

  const learning = buildDeterministicLearningRecommendations({
    profile,
    credentials,
    recentAssessmentCategories: verifiedSkills.map((s) => s.categorySlug || s.category).filter(Boolean),
  });

  const recommendedAssessments = (learning.items || [])
    .filter((i) => i.type === 'assessment')
    .slice(0, 5);

  const milestones = (profile.careerGoals || [])
    .filter((g) => g.status === 'active')
    .map((g) => ({
      title: g.title,
      targetDate: g.targetDate,
      status: g.status,
      progress: g.status === 'completed' ? 100 : matched.length && targetSkills.length
        ? Math.round((matched.length / targetSkills.length) * 100)
        : 0,
    }));

  return {
    currentSkills: current.slice(0, 20).map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: missing.slice(0, 12).map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    matchedSkills: matched.slice(0, 12).map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    recommendedAssessments,
    recommendedLearning: (learning.items || []).slice(0, 6),
    careerGoalProgress: milestones,
    milestones,
    readinessImprovements: (readinessImprovements || []).slice(0, 8),
    targetLabel: targetJob?.title || careerGoalTitle || 'Your career profile',
    deterministic: true,
    aiUsed: false,
  };
}
