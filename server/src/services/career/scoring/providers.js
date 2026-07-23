/**
 * Deterministic score providers for career_readiness (C.8.2) + L.2.8 extensions.
 * No AI — rules only; explanations and improvements are human-readable strings.
 */
import { evaluateProfileCompleteness } from '../../../../../shared/scoring/profileCompletenessRules.js';
import { evaluateResumeQuality } from '../../../../../shared/scoring/resumeQualityRules.js';
import { computeJobMatch } from '../../../../../shared/scoring/jobMatchLogic.js';

function evidence(type, id, label) {
  return { type, id: id ? String(id) : null, label: label || type };
}

export const profileCompletenessProvider = {
  id: 'profile_completeness',
  scoreTypes: ['career_readiness', 'resume_strength'],
  async compute(ctx) {
    const result = evaluateProfileCompleteness(ctx.profile || {});
    return {
      score: result.score,
      explanation: result.explanation,
      evidence: [
        evidence('talent_profile', ctx.profile?._id, 'TalentProfile'),
        ...result.checks.filter((c) => c.ok).map((c) => evidence('profile_field', c.key, c.key)),
      ],
      improvements: result.improvements,
      strengths: result.strengths,
      missing: result.missing,
    };
  },
};

export const resumeQualityProvider = {
  id: 'resume_quality',
  scoreTypes: ['career_readiness', 'resume_strength'],
  async compute(ctx) {
    const result = evaluateResumeQuality({
      profile: ctx.profile || {},
      resumeVersions: ctx.resumeVersions || [],
    });
    return {
      score: result.score,
      explanation: result.explanation,
      evidence: result.primaryVersionId
        ? [evidence('resume_version', result.primaryVersionId, 'Primary resume')]
        : [],
      improvements: result.improvements,
      strengths: result.strengths,
      missing: result.missing,
      suggestions: result.suggestions,
    };
  },
};

export const jobRequirementMatchProvider = {
  id: 'job_requirement_match',
  scoreTypes: ['job_match', 'employer_match'],
  async compute(ctx) {
    const primary = (ctx.resumeVersions || []).find((v) => v.isPrimary) || (ctx.resumeVersions || [])[0];
    const match = computeJobMatch({
      profile: ctx.profile,
      job: ctx.job,
      verifiedSkills: ctx.verifiedSkills || [],
      credentials: ctx.credentials || [],
      readinessOverall: ctx.readinessOverall,
      readinessSnapshot: ctx.readinessSnapshot,
      profileCompletionScore: ctx.profileCompletionScore,
      primaryResumeSnapshot: primary?.snapshot || {},
    });
    return {
      score: match.overall,
      explanation: match.explanation,
      evidence: (match.strengths || []).slice(0, 8).map((s) => evidence('match_strength', null, s)),
      improvements: match.improvements,
      strengths: match.strengths,
      missing: match.missing,
      missingRequirements: match.missingRequirements,
      factors: match.factors,
      meta: { jobId: match.jobId, version: match.version },
    };
  },
};

export const verifiedSkillsProvider = {
  id: 'verified_skills',
  scoreTypes: ['career_readiness', 'technical_readiness'],
  async compute(ctx) {
    const creds = ctx.credentials || [];
    const verified = creds.filter((c) => c.verificationStatus === 'active' || c.status === 'active');
    const withSkill = verified.filter((c) => c.skillName);
    let score = 0;
    if (verified.length === 0) score = 0;
    else if (verified.length === 1) score = 40;
    else if (verified.length === 2) score = 65;
    else if (verified.length >= 3) score = 85;
    if (withSkill.length >= 2) score = Math.min(100, score + 15);

    const improvements = [];
    if (verified.length < 3) improvements.push('Earn or verify more credentials');
    if (withSkill.length === 0) improvements.push('Link credentials to skill names');

    return {
      score,
      explanation: `${verified.length} verified credential(s); ${withSkill.length} linked to skills.`,
      evidence: verified.slice(0, 5).map((c) => evidence('credential', c._id, c.title || c.skillName)),
      improvements,
    };
  },
};

export const documentCompletenessProvider = {
  id: 'document_completeness',
  scoreTypes: ['career_readiness', 'resume_strength'],
  async compute(ctx) {
    const docs = (ctx.documents || []).filter((d) => d.status !== 'deleted' && d.status !== 'archived');
    const types = new Set(docs.map((d) => d.documentType));
    const hasResume = types.has('resume') || types.has('cv');
    const hasCert = types.has('certificate');
    const hasCover = types.has('cover_letter');
    const hasTranscript = types.has('transcript');
    const slots = [
      { ok: hasResume, label: 'Upload a resume or CV document' },
      { ok: hasCert, label: 'Upload at least one certificate' },
      { ok: docs.length >= 2, label: 'Keep at least two active documents' },
      { ok: hasCover || hasTranscript || docs.length >= 3, label: 'Add cover letter, transcript, or more documents' },
    ];
    const done = slots.filter((s) => s.ok).length;
    const score = Math.round((done / slots.length) * 100);
    return {
      score,
      explanation: `${docs.length} active document(s); coverage ${done}/${slots.length}.`,
      evidence: docs.slice(0, 5).map((d) => evidence('document', d._id, d.label || d.documentType)),
      improvements: slots.filter((s) => !s.ok).map((s) => s.label),
    };
  },
};

export const applicationEngagementProvider = {
  id: 'application_engagement',
  scoreTypes: ['career_readiness'],
  async compute(ctx) {
    const apps = ctx.applications || [];
    const active = apps.filter((a) => a.status === 'active');
    const stages = new Set(active.map((a) => a.pipelineStage));
    const advanced = active.filter((a) =>
      ['screening', 'assessment', 'interview', 'offer', 'negotiation', 'accepted', 'joined'].includes(a.pipelineStage)
    );
    const applied = active.filter((a) =>
      !['interested', 'preparing'].includes(a.pipelineStage)
    );

    let score = 0;
    if (active.length === 0) score = 10;
    else if (active.length === 1) score = 35;
    else if (active.length === 2) score = 50;
    else score = 65;
    if (applied.length > 0) score = Math.min(100, score + 15);
    if (advanced.length > 0) score = Math.min(100, score + 15);
    if (stages.has('interview') || stages.has('offer')) score = Math.min(100, score + 5);

    const improvements = [];
    if (active.length === 0) improvements.push('Track your first application');
    else if (applied.length === 0) improvements.push('Move applications past preparing into applied');
    if (advanced.length === 0 && active.length > 0) {
      improvements.push('Follow up so applications progress to screening or interview');
    }

    return {
      score,
      explanation: `${active.length} active application(s); ${advanced.length} in advanced stages.`,
      evidence: active.slice(0, 5).map((a) => evidence('application', a._id, a.title || a.pipelineStage)),
      improvements,
    };
  },
};

export const skillCoverageProvider = {
  id: 'skill_coverage',
  scoreTypes: ['career_readiness', 'technical_readiness'],
  async compute(ctx) {
    const skills = ctx.profile?.skills || [];
    const technical = skills.filter((s) => s.category === 'technical' || !s.category);
    const advanced = skills.filter((s) => s.level === 'advanced' || s.level === 'expert');
    const verified = skills.filter((s) => s.source === 'verified');

    let score = 0;
    if (skills.length === 0) score = 0;
    else if (skills.length < 3) score = 25;
    else if (skills.length < 6) score = 50;
    else score = 70;
    if (technical.length >= 3) score = Math.min(100, score + 10);
    if (advanced.length >= 1) score = Math.min(100, score + 10);
    if (verified.length >= 1) score = Math.min(100, score + 10);

    const improvements = [];
    if (skills.length < 6) improvements.push('Add more skills to your profile (aim for 6+)');
    if (advanced.length === 0) improvements.push('Mark proficiency levels for key skills');
    if (verified.length === 0) improvements.push('Verify skills via credentials or assessments');

    return {
      score,
      explanation: `${skills.length} skill(s); ${advanced.length} advanced/expert; ${verified.length} verified.`,
      evidence: skills.slice(0, 8).map((s) => evidence('skill', s.name, s.name)),
      improvements,
    };
  },
};

export const ALL_FOUNDATION_PROVIDERS = [
  profileCompletenessProvider,
  resumeQualityProvider,
  verifiedSkillsProvider,
  documentCompletenessProvider,
  applicationEngagementProvider,
  skillCoverageProvider,
  jobRequirementMatchProvider,
];

/** Canonical profile completion — use everywhere instead of local formulas. */
export function getCanonicalProfileCompletion(profile) {
  return evaluateProfileCompleteness(profile || {}).score;
}

/** Canonical resume quality score. */
export function getCanonicalResumeQuality(profile, resumeVersions) {
  return evaluateResumeQuality({ profile, resumeVersions }).score;
}
