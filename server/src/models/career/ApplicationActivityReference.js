import mongoose from 'mongoose';

export const applicationActivityReferenceSchema = new mongoose.Schema(
  {
    activityType: { type: String, trim: true, required: true },
    referenceId: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    occurredAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);
