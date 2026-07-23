import mongoose from 'mongoose';
import {
  PIPELINE_STAGES,
  OPPORTUNITY_APPLICATION_STATUSES,
  OPPORTUNITY_APPLICATION_SOURCES,
  STAGE_TEMPLATE_IDS,
} from '../../../../shared/career/constants.js';
import { opportunityReferenceSchema } from './OpportunityReference.js';
import { stageHistorySchema } from './StageHistory.js';
import { applicationNoteSchema } from './ApplicationNote.js';
import { applicationDocumentReferenceSchema } from './ApplicationDocumentReference.js';
import { reminderReferenceSchema } from './ReminderReference.js';
import { applicationActivityReferenceSchema } from './ApplicationActivityReference.js';
import { applicationContactSchema, interviewScheduleSchema } from './ApplicationContact.js';

const opportunityApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true, index: true },
    opportunityRef: { type: opportunityReferenceSchema, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', default: null },
    pipelineStage: { type: String, enum: PIPELINE_STAGES, required: true },
    stageTemplateId: { type: String, enum: STAGE_TEMPLATE_IDS, required: true },
    source: { type: String, enum: OPPORTUNITY_APPLICATION_SOURCES, default: 'platform' },
    status: { type: String, enum: OPPORTUNITY_APPLICATION_STATUSES, default: 'active' },
    title: { type: String, trim: true, default: '' },
    externalUrl: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    locale: { type: String, trim: true, default: 'en' },
    market: { type: String, trim: true, default: '' },
    legacyApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
    stageHistory: { type: [stageHistorySchema], default: [] },
    notes: { type: [applicationNoteSchema], default: [] },
    documentReferences: { type: [applicationDocumentReferenceSchema], default: [] },
    reminderReferences: { type: [reminderReferenceSchema], default: [] },
    activityReferences: { type: [applicationActivityReferenceSchema], default: [] },
    contacts: { type: [applicationContactSchema], default: [] },
    interview: { type: interviewScheduleSchema, default: () => ({}) },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    appliedAt: { type: Date },
    archivedAt: { type: Date },
  },
  { timestamps: true, collection: 'opportunityApplications' }
);

opportunityApplicationSchema.index(
  { talentProfileId: 1, 'opportunityRef.opportunityType': 1, 'opportunityRef.opportunityId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'active',
      'opportunityRef.opportunityId': { $type: 'objectId' },
    },
  }
);
opportunityApplicationSchema.index({ userId: 1, pipelineStage: 1, status: 1 });
opportunityApplicationSchema.index({ talentProfileId: 1, pipelineStage: 1 });
opportunityApplicationSchema.index({ 'opportunityRef.opportunityType': 1, 'opportunityRef.opportunityId': 1 });

export const OpportunityApplication = mongoose.model('OpportunityApplication', opportunityApplicationSchema);
