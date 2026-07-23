import mongoose from 'mongoose';

const backgroundJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'email',
        'notification',
        'scheduled_newsletter',
        'scholarship_reminder',
        'admission_reminder',
        'subscription_expiry',
        'retry_email',
        'scheduled_publish',
        'search_reindex',
        'analytics_aggregate',
        'media_process',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'dead'],
      default: 'pending',
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    dedupKey: { type: String, sparse: true, unique: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    scheduledAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

backgroundJobSchema.index({ status: 1, scheduledAt: 1 });
backgroundJobSchema.index({ type: 1, status: 1, createdAt: -1 });

export const BackgroundJob = mongoose.model('BackgroundJob', backgroundJobSchema);
