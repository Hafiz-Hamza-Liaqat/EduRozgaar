import mongoose from 'mongoose';

const cmsBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    locale: { type: String, default: 'en' },
    headline: String,
    subheadline: String,
    ctaLabel: String,
    ctaUrl: String,
    ctaExternal: { type: Boolean, default: false },
    backgroundImageUrl: String,
    mobileImageUrl: String,
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,
    scheduledStart: Date,
    scheduledEnd: Date,
    placement: { type: String, default: 'homepage' },
    seoTitle: String,
    metaDescription: String,
    ogImageUrl: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cmsBannerSchema.index({ locale: 1, placement: 1, order: 1 });
cmsBannerSchema.index({ status: 1, active: 1 });

export const CmsBanner = mongoose.model('CmsBanner', cmsBannerSchema);
