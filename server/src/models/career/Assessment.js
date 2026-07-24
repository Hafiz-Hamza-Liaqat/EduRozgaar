import mongoose from 'mongoose';
import {
  ASSESSMENT_STATUSES,
  ASSESSMENT_PROCTORING_LEVELS,
  ASSESSMENT_CATEGORY_FAMILIES,
} from '../../../../shared/career/assessmentConstants.js';

/** Ordered section within an assessment — references question bank or inline question ids. */
export const assessmentSectionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    questionCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

/** Deterministic rule hooks (time, shuffle, max attempts overrides). */
export const assessmentRuleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

/** When attempt passes, optionally issue a Credential via CredentialPlatform. */
export const assessmentCredentialRuleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    skillName: { type: String, trim: true, default: '' },
    credentialTitle: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: 'Strideto Assessments' },
    minScore: { type: Number, min: 0, max: 100, default: null },
    expiryDays: { type: Number, min: 0, default: 365 },
    autoVerify: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Canonical Assessment definition (C.8.4).
 * Optionally bridges to legacy Quiz via legacyQuizId — does not replace Exam Prep.
 */
const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    categorySlug: { type: String, required: true, trim: true, index: true },
    family: { type: String, enum: ASSESSMENT_CATEGORY_FAMILIES, default: 'general_employment' },
    status: { type: String, enum: ASSESSMENT_STATUSES, default: 'draft', index: true },
    durationMinutes: { type: Number, default: 30, min: 1 },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 3, min: 1 },
    employerVisible: { type: Boolean, default: true },
    proctoringLevel: { type: String, enum: ASSESSMENT_PROCTORING_LEVELS, default: 'none' },
    locale: { type: String, trim: true, default: 'en' },
    market: { type: String, trim: true, default: '' },
    skillName: { type: String, trim: true, default: '' },
    questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', default: null },
    legacyQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    sections: { type: [assessmentSectionSchema], default: [] },
    rules: { type: [assessmentRuleSchema], default: [] },
    credentialRule: { type: assessmentCredentialRuleSchema, default: () => ({}) },
    publishedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'assessments' }
);

assessmentSchema.index({ status: 1, categorySlug: 1, publishedAt: -1 });
assessmentSchema.index({ family: 1, status: 1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
