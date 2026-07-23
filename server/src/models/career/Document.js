import mongoose from 'mongoose';
import {
  CANONICAL_DOCUMENT_TYPES,
  DOCUMENT_PARENT_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_VISIBILITY,
  DOCUMENT_DOWNLOAD_PERMISSIONS,
} from '../../../../shared/career/constants.js';

const documentSchema = new mongoose.Schema(
  {
    parentType: { type: String, enum: DOCUMENT_PARENT_TYPES, default: 'talent_profile', index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    talentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TalentProfile', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, required: true },
    documentType: { type: String, enum: CANONICAL_DOCUMENT_TYPES, default: 'other' },
    mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    versionGroupId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    versionNumber: { type: Number, default: 1, min: 1 },
    isCurrentVersion: { type: Boolean, default: true, index: true },
    tags: { type: [String], default: [] },
    expiresAt: { type: Date },
    visibility: { type: String, enum: DOCUMENT_VISIBILITY, default: 'private' },
    downloadPermission: { type: String, enum: DOCUMENT_DOWNLOAD_PERMISSIONS, default: 'owner_only' },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'active' },
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    legacyProfileDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileDocument' },
  },
  {
    timestamps: true,
    collection: 'documents',
  }
);

documentSchema.index({ userId: 1, status: 1, updatedAt: -1 });
documentSchema.index({ talentProfileId: 1, documentType: 1, isCurrentVersion: 1 });
documentSchema.index({ versionGroupId: 1, versionNumber: -1 });

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
