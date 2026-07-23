import mongoose from 'mongoose';
import { WORKFLOW_RESOURCES } from '../../../shared/workflow/resources.js';

const LOCK_TTL_MS = 30 * 60 * 1000;

const contentLockSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, enum: WORKFLOW_RESOURCES },
    entityId: { type: String, required: true },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lockedByName: { type: String, default: '' },
    lockedByEmail: { type: String, default: '' },
    lockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

contentLockSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

contentLockSchema.statics.defaultExpiry = function defaultExpiry() {
  return new Date(Date.now() + LOCK_TTL_MS);
};

export const ContentLock = mongoose.model('ContentLock', contentLockSchema);
export const CONTENT_LOCK_TTL_MS = LOCK_TTL_MS;
