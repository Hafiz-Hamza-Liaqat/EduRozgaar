/**
 * Canonical timeline verb registry (C.8.0.4).
 */

export const TIMELINE_VERBS = [
  'profile.created',
  'profile.updated',
  'resume.created',
  'resume.updated',
  'application.created',
  'application.updated',
  'application.stage_changed',
  'application.withdrawn',
  'application.archived',
  'application.note_added',
  'application.reminder_created',
  'application.document_attached',
  'application.contact_added',
  'application.interview_scheduled',
  'offer.accepted',
  'document.uploaded',
  'document.updated',
  'document.version_created',
  'document.archived',
  'credential.earned',
  'credential.verified',
  'credential.revoked',
  'score.improved',
  'assessment.started',
  'assessment.completed',
  'assessment.passed',
  'assessment.failed',
  // Employer Intelligence (C.8.5)
  'hiring.candidate_viewed',
  'hiring.candidate_shortlisted',
  'hiring.interview_completed',
  'hiring.offer_sent',
  'hiring.offer_rejected',
  'hiring.candidate_rejected',
  'hiring.candidate_hired',
  'hiring.note_added',
];

export const TIMELINE_OBJECT_TYPES = [
  'talent_profile',
  'resume_version',
  'application',
  'document',
  'note',
  'reminder',
  'credential',
  'contact',
  'interview',
  'score_snapshot',
  'assessment',
  'assessment_attempt',
];

export const TIMELINE_VISIBILITY_LEVELS = ['private', 'employer_scoped', 'public'];

/** Default visibility per verb. */
export const TIMELINE_VERB_VISIBILITY = {
  'profile.created': 'private',
  'profile.updated': 'private',
  'resume.created': 'private',
  'resume.updated': 'private',
  'application.created': 'private',
  'application.updated': 'private',
  'application.stage_changed': 'private',
  'application.withdrawn': 'private',
  'application.archived': 'private',
  'application.note_added': 'private',
  'application.reminder_created': 'private',
  'application.document_attached': 'private',
  'application.contact_added': 'private',
  'application.interview_scheduled': 'private',
  'offer.accepted': 'private',
  'document.uploaded': 'private',
  'document.updated': 'private',
  'document.version_created': 'private',
  'document.archived': 'private',
  'credential.earned': 'private',
  'credential.verified': 'private',
  'credential.revoked': 'private',
  'score.improved': 'private',
  'assessment.started': 'private',
  'assessment.completed': 'private',
  'assessment.passed': 'private',
  'assessment.failed': 'private',
  'hiring.candidate_viewed': 'employer_scoped',
  'hiring.candidate_shortlisted': 'employer_scoped',
  'hiring.interview_completed': 'employer_scoped',
  'hiring.offer_sent': 'employer_scoped',
  'hiring.offer_rejected': 'employer_scoped',
  'hiring.candidate_rejected': 'employer_scoped',
  'hiring.candidate_hired': 'employer_scoped',
  'hiring.note_added': 'employer_scoped',
};

export function defaultVisibilityForVerb(verb) {
  return TIMELINE_VERB_VISIBILITY[verb] || 'private';
}
