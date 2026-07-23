import mongoose from 'mongoose';

const cmsBlockTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'general', trim: true },
    description: { type: String, default: '', trim: true },
    blockType: { type: String, required: true, trim: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    previewImageUrl: { type: String, default: '' },
    favorite: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

cmsBlockTemplateSchema.index({ name: 1 });
cmsBlockTemplateSchema.index({ category: 1 });
cmsBlockTemplateSchema.index({ blockType: 1 });
cmsBlockTemplateSchema.index({ favorite: -1, name: 1 });

export const CmsBlockTemplate = mongoose.model('CmsBlockTemplate', cmsBlockTemplateSchema);
