import mongoose from 'mongoose';
import { CAREER_SCORE_TYPES } from '../../../../shared/scoring/constants.js';

const evidenceSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: '' },
    id: { type: String, trim: true, default: null },
    label: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const factorSchema = new mongoose.Schema(
  {
    providerId: { type: String, required: true, trim: true },
    score: { type: Number, min: 0, max: 100, required: true },
    weight: { type: Number, min: 0, max: 1, required: true },
    explanation: { type: String, trim: true, default: '' },
    evidence: { type: [evidenceSchema], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * Append-only score snapshot (C.8.2). Never update in place.
 */
const scoreSnapshotSchema = new mongoose.Schema(
  {
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scoreType: { type: String, enum: CAREER_SCORE_TYPES, required: true },
    version: { type: String, required: true, trim: true },
    overall: { type: Number, min: 0, max: 100, required: true },
    factors: { type: [factorSchema], default: [] },
    computedAt: { type: Date, default: Date.now, required: true },
    validUntil: { type: Date },
    previousOverall: { type: Number, min: 0, max: 100 },
    delta: { type: Number },
  },
  { timestamps: true, collection: 'scoreSnapshots' }
);

scoreSnapshotSchema.index({ talentProfileId: 1, scoreType: 1, computedAt: -1 });
scoreSnapshotSchema.index({ userId: 1, scoreType: 1, computedAt: -1 });

export const ScoreSnapshot = mongoose.model('ScoreSnapshot', scoreSnapshotSchema);
