import mongoose from 'mongoose';

/**
 * Canonical analytics event store (C.7.0.5).
 * Additive fields — existing listingType/listingId retained for backward compatibility.
 */
const analyticsSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, index: true },
    entityType: { type: String, default: null, index: true },
    entityId: { type: String, default: null, index: true },
    // Legacy fields (kept)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    listingType: {
      type: String,
      enum: ['job', 'scholarship', 'admission', 'blog', 'foreign_study'],
      default: null,
    },
    listingId: { type: mongoose.Schema.Types.ObjectId },
    page: { type: String, default: '' },
    referrer: { type: String, default: '' },
    country: { type: String, default: '' },
    province: { type: String, default: '' },
    device: { type: String, default: '' },
    browser: { type: String, default: '' },
    sessionId: { type: String, default: '', index: true },
    locale: { type: String, default: 'en', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
analyticsSchema.index({ locale: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsSchema);
