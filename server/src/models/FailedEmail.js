import mongoose from 'mongoose';

const failedEmailSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String },
    template: { type: String },
    error: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

failedEmailSchema.index({ createdAt: -1 });

export const FailedEmail = mongoose.model('FailedEmail', failedEmailSchema);
