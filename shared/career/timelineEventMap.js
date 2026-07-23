/**
 * Maps CareerEventBus domain events → timeline verbs (C.8.0.4).
 */

export const CAREER_EVENT_TO_TIMELINE = {
  TalentProfileCreated: {
    verb: 'profile.created',
    objectType: 'talent_profile',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.aggregateId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      visibility: event.payload?.visibility,
      hydrationSource: event.payload?.hydrationSource,
    }),
  },
  TalentProfileUpdated: {
    verb: 'profile.updated',
    objectType: 'talent_profile',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.aggregateId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      changedSections: event.payload?.changedSections,
      status: event.payload?.status,
    }),
  },
  ResumeVersionCreated: {
    verb: 'resume.created',
    objectType: 'resume_version',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      resumeVersionId: event.payload?.resumeVersionId,
      isPrimary: event.payload?.isPrimary,
    }),
  },
  ResumePublished: {
    verb: 'resume.updated',
    objectType: 'resume_version',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      resumeVersionId: event.payload?.resumeVersionId,
      sourceVersion: event.payload?.sourceVersion,
    }),
  },
  ApplicationCreated: {
    verb: 'application.created',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      opportunityType: event.payload?.opportunityType,
      opportunityId: event.payload?.opportunityId,
      pipelineStage: event.payload?.pipelineStage,
    }),
  },
  ApplicationUpdated: {
    verb: 'application.updated',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => event.payload,
  },
  StageChanged: {
    verb: 'application.stage_changed',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      fromStage: event.payload?.fromStage,
      toStage: event.payload?.toStage,
      opportunityType: event.payload?.opportunityType,
    }),
  },
  ApplicationWithdrawn: {
    verb: 'application.withdrawn',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      fromStage: event.payload?.fromStage,
      toStage: event.payload?.toStage,
    }),
  },
  NoteAdded: {
    verb: 'application.note_added',
    objectType: 'note',
    objectIdFrom: (event) => event.payload?.noteId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      applicationId: String(event.aggregateId),
      visibility: event.payload?.visibility,
    }),
  },
  ReminderCreated: {
    verb: 'application.reminder_created',
    objectType: 'reminder',
    objectIdFrom: (event) => event.payload?.reminderId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      applicationId: String(event.aggregateId),
      title: event.payload?.title,
      remindAt: event.payload?.remindAt,
    }),
  },
  DocumentAttached: {
    verb: 'application.document_attached',
    objectType: 'document',
    objectIdFrom: (event) => event.payload?.documentReferenceId || event.payload?.documentRefId || event.payload?.profileDocumentId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      applicationId: String(event.aggregateId),
      role: event.payload?.role,
      label: event.payload?.label,
    }),
  },
  OfferAccepted: {
    verb: 'offer.accepted',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      fromStage: event.payload?.fromStage,
      toStage: event.payload?.toStage,
    }),
  },
  ApplicationArchived: {
    verb: 'application.archived',
    objectType: 'application',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => event.payload,
  },
  ContactAdded: {
    verb: 'application.contact_added',
    objectType: 'contact',
    objectIdFrom: (event) => event.payload?.contactId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      applicationId: String(event.aggregateId),
      name: event.payload?.name,
      role: event.payload?.role,
    }),
  },
  InterviewScheduled: {
    verb: 'application.interview_scheduled',
    objectType: 'interview',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      scheduledAt: event.payload?.scheduledAt,
      mode: event.payload?.mode,
    }),
  },
  DocumentCreated: {
    verb: 'document.uploaded',
    objectType: 'document',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      documentType: event.payload?.documentType,
      label: event.payload?.label,
      versionNumber: event.payload?.versionNumber,
    }),
  },
  DocumentUpdated: {
    verb: 'document.updated',
    objectType: 'document',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => event.payload,
  },
  DocumentVersionCreated: {
    verb: 'document.version_created',
    objectType: 'document',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      versionGroupId: event.payload?.versionGroupId,
      versionNumber: event.payload?.versionNumber,
    }),
  },
  DocumentArchived: {
    verb: 'document.archived',
    objectType: 'document',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => event.payload,
  },
  CredentialIssued: {
    verb: 'credential.earned',
    objectType: 'credential',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({
      title: event.payload?.title,
      issuer: event.payload?.issuer,
      skillName: event.payload?.skillName,
      score: event.payload?.score,
    }),
  },
  CredentialVerified: {
    verb: 'credential.verified',
    objectType: 'credential',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({ title: event.payload?.title, issuer: event.payload?.issuer }),
  },
  CredentialRevoked: {
    verb: 'credential.revoked',
    objectType: 'credential',
    objectIdFrom: (event) => event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.actor?.id,
    metadataFrom: (event) => ({ title: event.payload?.title }),
  },
  CareerScoreUpdated: {
    verb: 'score.improved',
    objectType: 'score_snapshot',
    objectIdFrom: (event) => event.payload?.snapshotId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      scoreType: event.payload?.scoreType,
      overall: event.payload?.overall,
      previousOverall: event.payload?.previousOverall,
      delta: event.payload?.delta,
      version: event.payload?.version,
    }),
  },
  AssessmentStarted: {
    verb: 'assessment.started',
    objectType: 'assessment_attempt',
    objectIdFrom: (event) => event.payload?.attemptId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      assessmentId: event.payload?.assessmentId,
      title: event.payload?.title,
      slug: event.payload?.slug,
    }),
  },
  AssessmentCompleted: {
    verb: 'assessment.completed',
    objectType: 'assessment_attempt',
    objectIdFrom: (event) => event.payload?.attemptId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      assessmentId: event.payload?.assessmentId,
      score: event.payload?.score,
      passed: event.payload?.passed,
      title: event.payload?.title,
    }),
  },
  AssessmentPassed: {
    verb: 'assessment.passed',
    objectType: 'assessment_attempt',
    objectIdFrom: (event) => event.payload?.attemptId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      assessmentId: event.payload?.assessmentId,
      score: event.payload?.score,
      credentialId: event.payload?.credentialId,
      title: event.payload?.title,
    }),
  },
  AssessmentFailed: {
    verb: 'assessment.failed',
    objectType: 'assessment_attempt',
    objectIdFrom: (event) => event.payload?.attemptId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.userId || event.actor?.id,
    metadataFrom: (event) => ({
      assessmentId: event.payload?.assessmentId,
      score: event.payload?.score,
      title: event.payload?.title,
    }),
  },
  // Employer Intelligence (C.8.5)
  CandidateViewed: {
    verb: 'hiring.candidate_viewed',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      jobId: event.payload?.jobId,
      pipelineStage: event.payload?.pipelineStage,
      employerId: event.actor?.id,
    }),
  },
  CandidateShortlisted: {
    verb: 'hiring.candidate_shortlisted',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      fromStage: event.payload?.fromStage,
      toStage: event.payload?.toStage,
      employerId: event.actor?.id,
    }),
  },
  InterviewCompleted: {
    verb: 'hiring.interview_completed',
    objectType: 'interview',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      outcome: event.payload?.outcome,
      employerId: event.actor?.id,
    }),
  },
  OfferSent: {
    verb: 'hiring.offer_sent',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      toStage: event.payload?.toStage,
      employerId: event.actor?.id,
    }),
  },
  OfferRejected: {
    verb: 'hiring.offer_rejected',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({ employerId: event.actor?.id }),
  },
  CandidateRejected: {
    verb: 'hiring.candidate_rejected',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      fromStage: event.payload?.fromStage,
      toStage: event.payload?.toStage,
      employerId: event.actor?.id,
    }),
  },
  CandidateHired: {
    verb: 'hiring.candidate_hired',
    objectType: 'application',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      toStage: event.payload?.toStage,
      employerId: event.actor?.id,
    }),
  },
  HiringNoteAdded: {
    verb: 'hiring.note_added',
    objectType: 'note',
    objectIdFrom: (event) => event.payload?.legacyApplicationId || event.aggregateId,
    subjectTalentProfileIdFrom: (event) => event.payload?.talentProfileId,
    userIdFrom: (event) => event.payload?.candidateUserId,
    metadataFrom: (event) => ({
      notePreview: event.payload?.notePreview,
      employerId: event.actor?.id,
    }),
  },
};

export function mapCareerEventToTimelineInput(event) {
  const mapping = CAREER_EVENT_TO_TIMELINE[event.eventType];
  if (!mapping) return null;

  const subjectTalentProfileId = mapping.subjectTalentProfileIdFrom(event);
  if (!subjectTalentProfileId) return null;

  return {
    subjectTalentProfileId: String(subjectTalentProfileId),
    userId: mapping.userIdFrom(event) ? String(mapping.userIdFrom(event)) : undefined,
    actorType: event.actor?.type || 'system',
    actorId: event.actor?.id ? String(event.actor.id) : null,
    verb: mapping.verb,
    objectType: mapping.objectType,
    objectId: mapping.objectIdFrom(event) ? String(mapping.objectIdFrom(event)) : '',
    metadata: mapping.metadataFrom(event) || {},
    locale: event.locale,
    careerEventId: event.eventId,
    careerEventType: event.eventType,
    occurredAt: event.occurredAt ? new Date(event.occurredAt) : new Date(),
  };
}

export function listTimelineHandledCareerEvents() {
  return Object.keys(CAREER_EVENT_TO_TIMELINE);
}

/**
 * Domain events intentionally NOT mapped to timeline (C.8.5A).
 * TimelineEventCreated is meta (would recurse). Scoring events use score.improved selectively elsewhere.
 */
export const INTENTIONAL_NON_TIMELINE_CAREER_EVENTS = [
  'TimelineEventCreated',
  'CareerScoreComputed',
  'ScoreSnapshotCreated',
  'ReadinessUpdated',
  'AssessmentPublished',
];

export function isIntentionalNonTimelineCareerEvent(eventType) {
  return INTENTIONAL_NON_TIMELINE_CAREER_EVENTS.includes(eventType);
}
