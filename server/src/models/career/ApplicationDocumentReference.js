import mongoose from 'mongoose';
import { APPLICATION_DOCUMENT_ROLES } from '../../../../shared/career/constants.js';

export const applicationDocumentReferenceSchema = new mongoose.Schema(
  {
    profileDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileDocument', default: null },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    label: { type: String, trim: true, default: '' },
    role: { type: String, enum: APPLICATION_DOCUMENT_ROLES, default: 'other' },
    url: { type: String, trim: true, default: '' },
    attachedAt: { type: Date, default: Date.now },
    attachedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);
