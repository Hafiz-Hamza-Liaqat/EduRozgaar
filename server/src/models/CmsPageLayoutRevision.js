import mongoose from 'mongoose';

const pageBlockSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    globalBlockId: { type: String },
  },
  { _id: false },
);

const revisionSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    draftBlocks: { type: [pageBlockSnapshotSchema], default: [] },
    publishedBlocks: { type: [pageBlockSnapshotSchema], default: [] },
    seo: {
      seoTitle: String,
      metaDescription: String,
      canonicalUrl: String,
      ogImageUrl: String,
      twitterCard: String,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const cmsPageLayoutRevisionSchema = new mongoose.Schema(
  {
    pageKey: { type: String, required: true, trim: true, index: true },
    locale: { type: String, required: true, default: 'en', index: true },
    version: { type: Number, required: true },
    action: {
      type: String,
      enum: ['draft_save', 'publish', 'restore'],
      required: true,
    },
    timeline: {
      type: String,
      enum: ['draft', 'published'],
      required: true,
    },
    changeNote: { type: String, default: '' },
    reachedProduction: { type: Boolean, default: false },
    isCurrentDraft: { type: Boolean, default: false },
    isCurrentPublished: { type: Boolean, default: false },
    restoredFromVersion: { type: Number },
    snapshot: { type: revisionSnapshotSchema, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByEmail: { type: String, default: '' },
    layoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'CmsPageLayout' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

cmsPageLayoutRevisionSchema.index({ pageKey: 1, locale: 1, version: 1 }, { unique: true });
cmsPageLayoutRevisionSchema.index({ pageKey: 1, locale: 1, createdAt: -1 });
cmsPageLayoutRevisionSchema.index({ pageKey: 1, locale: 1, timeline: 1, createdAt: -1 });

export const CmsPageLayoutRevision = mongoose.model('CmsPageLayoutRevision', cmsPageLayoutRevisionSchema);
