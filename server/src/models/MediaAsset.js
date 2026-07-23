import mongoose from 'mongoose';

const metadataSchema = new mongoose.Schema(
  {
    credit: { type: String, default: '', trim: true },
    copyright: { type: String, default: '', trim: true },
    photographer: { type: String, default: '', trim: true },
    license: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const variantsSchema = new mongoose.Schema(
  {
    thumbnail: { type: String, default: '' },
    medium: { type: String, default: '' },
    large: { type: String, default: '' },
    original: { type: String, default: '' },
  },
  { _id: false },
);

const mediaAssetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    originalFilename: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    altText: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    folder: { type: String, default: 'general', trim: true },
    tags: { type: [String], default: [] },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checksum: { type: String, required: true, trim: true },
    storageProvider: { type: String, default: 'local', trim: true },
    storageKey: { type: String, default: '', trim: true },
    storageUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: '', trim: true },
    mediumUrl: { type: String, default: '', trim: true },
    largeUrl: { type: String, default: '', trim: true },
    variants: { type: variantsSchema, default: () => ({}) },
    metadata: { type: metadataSchema, default: () => ({}) },
    /** Per-locale alt/caption/description — shared file, localizable metadata (C.7.0.8) */
    localizedMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

mediaAssetSchema.index({ checksum: 1 });
mediaAssetSchema.index({ folder: 1, createdAt: -1 });
mediaAssetSchema.index({ tags: 1 });
mediaAssetSchema.index({ filename: 'text', originalFilename: 'text', altText: 'text', caption: 'text' });
mediaAssetSchema.index({ mimeType: 1 });
mediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
