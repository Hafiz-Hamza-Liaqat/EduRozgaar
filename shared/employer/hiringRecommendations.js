/**
 * L.2.8 — Deterministic employer hiring recommendations (advisory only).
 * Never outputs Hire / Reject / automated decisions.
 */

const FORBIDDEN_ACTIONS = new Set(['hire', 'reject', 'auto_hire', 'auto_reject']);

/**
 * @param {object} card — employer candidate card with scores
 * @returns {object[]}
 */
export function buildHiringRecommendations(card = {}) {
  const recs = [];
  const match = card.jobMatch?.overall ?? card.jobMatch?.score ?? null;
  const readiness = card.readiness?.overall ?? 0;
  const resumeQ = card.resumeStrength?.overall ?? card.resumeQuality?.score ?? 0;
  const completeness = card.profileCompleteness ?? 0;
  const verified = card.verifiedSkills || [];
  const verifiedNames = verified.map((s) => String(s.skillName || s.title || '').toLowerCase());
  const expYears = card.experienceYears ?? 0;
  const hasPortfolio = Boolean(card.hasPortfolio || (card.portfolioCount ?? 0) > 0);

  function push(action, reasonKey, reason, evidence = []) {
    const key = action.toLowerCase().replace(/\s+/g, '_');
    if (FORBIDDEN_ACTIONS.has(key)) return;
    recs.push({
      action,
      actionKey: key,
      reasonKey,
      reason,
      evidence,
      deterministic: true,
      aiUsed: false,
      advisory: true,
    });
  }

  if (match != null && match >= 70 && readiness >= 60) {
    push('invite_for_interview', 'employer.reco.inviteInterview', 'Strong job match and readiness scores.', [
      { type: 'job_match', value: match },
      { type: 'readiness', value: readiness },
    ]);
  }

  if (match != null && match >= 55 && match < 70) {
    push('keep_in_talent_pool', 'employer.reco.talentPool', 'Moderate job match — worth reviewing later.', [
      { type: 'job_match', value: match },
    ]);
  }

  if (!hasPortfolio && (card.jobTitle || '').toLowerCase().includes('design')) {
    push('request_portfolio', 'employer.reco.requestPortfolio', 'No portfolio linked; role may require work samples.', [
      { type: 'portfolio', value: false },
    ]);
  } else if (!hasPortfolio && verified.length >= 2) {
    push('request_portfolio', 'employer.reco.requestPortfolioOptional', 'Portfolio would complement verified skills.', []);
  }

  const techVerified = verified.filter((s) => (s.score ?? 0) >= 70).length;
  if (techVerified >= 2 && readiness >= 65) {
    push('strong_technical_candidate', 'employer.reco.strongTechnical', 'Multiple verified technical assessments with solid readiness.', [
      { type: 'verified_count', value: techVerified },
    ]);
  }

  if (expYears < 1 && (card.jobType === 'internship' || (card.jobTitle || '').toLowerCase().includes('intern'))) {
    push('suitable_for_internship', 'employer.reco.internship', 'Experience band aligns with internship role.', [
      { type: 'experience_years', value: expYears },
    ]);
  } else if (expYears >= 1 && expYears <= 3 && match != null && match >= 50) {
    push('suitable_for_junior_role', 'employer.reco.juniorRole', 'Experience level fits junior positions.', [
      { type: 'experience_years', value: expYears },
    ]);
  }

  if (!verifiedNames.some((n) => n.includes('english'))) {
    push('needs_english_assessment', 'employer.reco.needsEnglish', 'English proficiency not verified via assessment.', []);
  }

  if (!verifiedNames.some((n) => n.includes('communication'))) {
    push('needs_communication_assessment', 'employer.reco.needsCommunication', 'Communication skills not verified via assessment.', []);
  }

  if (completeness < 70 || resumeQ < 60) {
    push('complete_profile_recommended', 'employer.reco.completeProfile', 'Profile or resume quality below recommended threshold before advancing.', [
      { type: 'profile_completeness', value: completeness },
      { type: 'resume_quality', value: resumeQ },
    ]);
  }

  const assessGaps = (card.jobMatch?.missing || []).slice(0, 3);
  for (const gap of assessGaps) {
    if (verifiedNames.some((n) => n.includes(gap.toLowerCase()))) continue;
    push(
      'request_technical_assessment',
      'employer.reco.requestAssessment',
      `Consider verifying: ${gap}`,
      [{ type: 'skill_gap', label: gap }],
    );
    break;
  }

  return recs.slice(0, 8);
}
