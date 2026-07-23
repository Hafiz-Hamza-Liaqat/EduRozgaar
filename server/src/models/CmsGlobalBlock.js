import mongoose from 'mongoose';

const cmsGlobalBlockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    blockType: { type: String, required: true, trim: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

cmsGlobalBlockSchema.index({ name: 1 });
cmsGlobalBlockSchema.index({ blockType: 1 });
cmsGlobalBlockSchema.index({ enabled: 1 });

export const CmsGlobalBlock = mongoose.model('CmsGlobalBlock', cmsGlobalBlockSchema);
