import mongoose from 'mongoose';
import { ASSESSMENT_ATTEMPT_STATUSES } from '../../../../shared/career/assessmentConstants.js';

export const assessmentAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    legacyMcqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mcq' },
    selectedIndex: { type: Number },
    selectedIndexes: { type: [Number], default: [] },
    correct: { type: Boolean, default: false },
  },
  { _id: false }
);

/** Immutable scored result attached once attempt is scored. */
export const assessmentResultSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100, required: true },
    correctCount: { type: Number, min: 0, required: true },
    totalQuestions: { type: Number, min: 0, required: true },
    passed: { type: Boolean, required: true },
    passingScore: { type: Number, min: 0, max: 100 },
    durationSeconds: { type: Number, min: 0 },
    scoredAt: { type: Date, default: Date.now },
    credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential', default: null },
    employerVisibleSummary: {
      skillName: { type: String, default: '' },
      score: { type: Number },
      passed: { type: Boolean },
      completedAt: { type: Date },
      credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential' },
    },
  },
  { _id: false }
);

/**
 * AssessmentAttempt aggregate (C.8.4).
 * One write path for start → submit → score.
 */
const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ASSESSMENT_ATTEMPT_STATUSES, default: 'started', index: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    scoredAt: { type: Date },
    answers: { type: [assessmentAnswerSchema], default: [] },
    result: { type: assessmentResultSchema, default: null },
    questionSnapshot: [{
      questionId: mongoose.Schema.Types.ObjectId,
      legacyMcqId: mongoose.Schema.Types.ObjectId,
      prompt: String,
      options: [String],
      correctIndex: Number,
    }],
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'assessmentAttempts' }
);

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });
assessmentAttemptSchema.index({ talentProfileId: 1, scoredAt: -1 });

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
