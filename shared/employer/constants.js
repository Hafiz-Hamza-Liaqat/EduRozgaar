/**
 * Employer intelligence domain constants (C.8.5).
 */

export const EMPLOYER_INTELLIGENCE_EVENTS = [
  'CandidateViewed',
  'CandidateShortlisted',
  'InterviewScheduled',
  'InterviewCompleted',
  'OfferSent',
  'OfferAccepted',
  'OfferRejected',
  'CandidateRejected',
  'CandidateHired',
  'HiringNoteAdded',
];

/** Map legacy Application.status → pipelineStage (read projection only). */
export const LEGACY_STATUS_TO_PIPELINE = {
  submitted: 'applied',
  applied: 'applied',
  viewed: 'viewed',
  shortlisted: 'screening',
  interview: 'interview',
  hired: 'accepted',
  rejected: 'rejected',
};

export const PIPELINE_TO_LEGACY_STATUS = {
  interested: 'submitted',
  preparing: 'submitted',
  applied: 'applied',
  viewed: 'viewed',
  screening: 'shortlisted',
  assessment: 'shortlisted',
  interview: 'interview',
  offer: 'interview',
  negotiation: 'interview',
  accepted: 'hired',
  joined: 'hired',
  rejected: 'rejected',
  withdrawn: 'rejected',
};
