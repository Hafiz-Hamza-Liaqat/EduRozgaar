import mongoose from 'mongoose';
import {
  PROFILE_DOCUMENT_STATUSES,
  PROFILE_DOCUMENT_TYPES,
  TALENT_PROFILE_VISIBILITY,
} from '../../../../shared/career/constants.js';

const profileDocumentSchema = new mongoose.Schema(
  {
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, trim: true, required: true },
    documentType: { type: String, enum: PROFILE_DOCUMENT_TYPES, default: 'other' },
    mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    visibility: { type: String, enum: TALENT_PROFILE_VISIBILITY, default: 'private' },
    status: { type: String, enum: PROFILE_DOCUMENT_STATUSES, default: 'uploaded' },
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

profileDocumentSchema.index({ talentProfileId: 1, status: 1 });
profileDocumentSchema.index({ userId: 1, documentType: 1 });

export const ProfileDocument = mongoose.model('ProfileDocument', profileDocumentSchema);
