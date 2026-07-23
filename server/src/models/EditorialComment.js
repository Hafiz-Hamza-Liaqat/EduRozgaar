import mongoose from 'mongoose';
import { WORKFLOW_RESOURCES } from '../../../shared/workflow/resources.js';

const editorialCommentSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, enum: WORKFLOW_RESOURCES, index: true },
    entityId: { type: String, required: true, index: true },
    scope: { type: String, enum: ['page', 'block', 'field'], default: 'page' },
    targetId: { type: String, default: '' },
    fieldKey: { type: String, default: '' },
    body: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: '' },
    authorEmail: { type: String, default: '' },
    resolved: { type: Boolean, default: false, index: true },
    reviewRound: { type: Number, default: 0 },
  },
  { timestamps: true }
);

editorialCommentSchema.index({ entityType: 1, entityId: 1, resolved: 1 });

export const EditorialComment = mongoose.model('EditorialComment', editorialCommentSchema);
