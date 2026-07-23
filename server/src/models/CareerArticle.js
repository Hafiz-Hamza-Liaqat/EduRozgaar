import mongoose from 'mongoose';
import { careerArticleSlug } from '../utils/slugify.js';
import { translationFieldDefinition, applySlugLocaleIndex, ensureTranslationGroupHook } from './mixins/translationFields.js';

const careerArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String },
    metaDescription: { type: String },
    relatedArticleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CareerArticle' }],
    views: { type: Number, default: 0 },
    imageUrl: { type: String },
    ...translationFieldDefinition,
  },
  { timestamps: true }
);

careerArticleSchema.index({ status: 1, publishedAt: -1 });
careerArticleSchema.index({ category: 1, status: 1 });
careerArticleSchema.index({ title: 'text', content: 'text' });
applySlugLocaleIndex(careerArticleSchema);
ensureTranslationGroupHook(careerArticleSchema);

careerArticleSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = careerArticleSlug(this.title);
  }
  next();
});

export const CareerArticle = mongoose.model('CareerArticle', careerArticleSchema);
