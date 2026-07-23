import mongoose from 'mongoose';

const contentReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contentType: { type: String, enum: ['job', 'employer', 'blog', 'scholarship', 'ad', 'other'], required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed', 'action_taken'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

contentReportSchema.index({ status: 1, createdAt: -1 });

export const ContentReport = mongoose.model('ContentReport', contentReportSchema);
