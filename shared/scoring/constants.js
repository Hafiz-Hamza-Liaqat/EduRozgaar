/**
 * Career scoring shared constants (C.8.2).
 */

export const CAREER_SCORE_TYPES = [
  'career_readiness',
  'resume_strength',
  'job_match',
  'employer_match', // alias — same engine as job_match
  'technical_readiness',
  'interview_readiness',
  'learning_progress',
];

/** Providers registered for career_readiness foundation */
export const SCORE_PROVIDER_IDS = [
  'profile_completeness',
  'resume_quality',
  'verified_skills',
  'document_completeness',
  'application_engagement',
  'skill_coverage',
  'job_requirement_match',
];

export const SCORING_EVENTS = [
  'CareerScoreComputed',
  'CareerScoreUpdated',
  'ScoreSnapshotCreated',
  'ReadinessUpdated',
];
