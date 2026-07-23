import mongoose from 'mongoose';
import { blogSlug } from '../utils/slugify.js';
import { translationFieldDefinition } from './mixins/translationFields.js';

const sectionSchema = new mongoose.Schema(
  { title: String, body: String },
  { _id: false }
);

const cmsStaticPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    locale: { type: String, required: true, default: 'en' },
    title: { type: String, required: true },
    heading: String,
    content: String,
    sections: [sectionSchema],
    pageType: {
      type: String,
      enum: ['about', 'contact', 'faq', 'privacy', 'terms', 'cookies', 'disclaimer', 'refund', 'careers', 'advertise', 'help', 'support', 'services', 'license', 'custom'],
      default: 'custom',
    },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,
    scheduledAt: Date,
    lastUpdatedManually: Date,
    seoTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    ogImageUrl: String,
    twitterCard: { type: String, default: 'summary_large_image' },
    schemaType: { type: String, default: 'WebPage' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ...translationFieldDefinition,
  },
  { timestamps: true }
);

cmsStaticPageSchema.index({ slug: 1, locale: 1 }, { unique: true });
cmsStaticPageSchema.index({ translationGroupId: 1, locale: 1 });
cmsStaticPageSchema.index({ status: 1, pageType: 1 });

cmsStaticPageSchema.pre('save', function (next) {
  if (!this.slug && this.title) this.slug = blogSlug(this.title);
  next();
});

export const CmsStaticPage = mongoose.model('CmsStaticPage', cmsStaticPageSchema);
