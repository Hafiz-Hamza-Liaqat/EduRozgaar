import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const resumeTemplateCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    templateId: {
      type: String,
      enum: ['modern-professional', 'minimal-ats', 'creative-portfolio', 'academic-cv'],
      required: true,
    },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    previewUrl: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'active'], default: 'active' },
  },
  { timestamps: true }
);

resumeTemplateCatalogSchema.index({ status: 1 });
resumeTemplateCatalogSchema.index({ templateId: 1 });

resumeTemplateCatalogSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name);
  }
  next();
});

export const ResumeTemplateCatalog = mongoose.model('ResumeTemplateCatalog', resumeTemplateCatalogSchema);
