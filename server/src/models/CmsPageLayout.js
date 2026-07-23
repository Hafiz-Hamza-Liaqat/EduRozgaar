import mongoose from 'mongoose';
import { translationFieldDefinition } from './mixins/translationFields.js';

const pageBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    globalBlockId: { type: String },
  },
  { _id: false }
);

const cmsPageLayoutSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, trim: true },
    locale: { type: String, required: true, default: 'en' },
    title: { type: String, trim: true },
    seoTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    ogImageUrl: String,
    twitterCard: { type: String, default: 'summary_large_image' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    draftBlocks: { type: [pageBlockSchema], default: [] },
    publishedBlocks: { type: [pageBlockSchema], default: [] },
    publishedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revisionCounter: { type: Number, default: 0 },
    currentDraftRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsPageLayoutRevision' },
    currentPublishedRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsPageLayoutRevision' },
    ...translationFieldDefinition,
  },
  { timestamps: true }
);

cmsPageLayoutSchema.index({ pageKey: 1, locale: 1 }, { unique: true });
cmsPageLayoutSchema.index({ translationGroupId: 1, locale: 1 });
cmsPageLayoutSchema.index({ status: 1 });

export const CmsPageLayout = mongoose.model('CmsPageLayout', cmsPageLayoutSchema);
