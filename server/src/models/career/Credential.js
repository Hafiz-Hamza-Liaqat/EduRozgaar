import mongoose from 'mongoose';
import { CREDENTIAL_STATUSES, CREDENTIAL_SOURCES } from '../../../../shared/career/constants.js';

const credentialSchema = new mongoose.Schema(
  {
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, required: true },
    issuer: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    verificationStatus: { type: String, enum: CREDENTIAL_STATUSES, default: 'pending_verification' },
    source: { type: String, enum: CREDENTIAL_SOURCES, default: 'manual' },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    assessmentAttemptId: { type: mongoose.Schema.Types.ObjectId },
    skillName: { type: String, trim: true, default: '' },
    score: { type: Number, min: 0, max: 100 },
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

credentialSchema.index({ talentProfileId: 1, verificationStatus: 1 });
credentialSchema.index({ userId: 1, issuedAt: -1 });

export const Credential = mongoose.model('Credential', credentialSchema);
