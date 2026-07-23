import mongoose from 'mongoose';

const ctaSchema = new mongoose.Schema(
  { label: String, url: String, style: { type: String, default: 'primary' }, external: { type: Boolean, default: false } },
  { _id: false }
);

const statSchema = new mongoose.Schema(
  { label: String, value: String, icon: String },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  { quote: String, author: String, role: String, avatarUrl: String },
  { _id: false }
);

const partnerLogoSchema = new mongoose.Schema(
  { name: String, imageUrl: String, url: String },
  { _id: false }
);

const resourceItemSchema = new mongoose.Schema(
  { label: String, description: String, path: String, icon: String },
  { _id: false }
);

const countryItemSchema = new mongoose.Schema(
  { name: String, path: String, query: String },
  { _id: false }
);

const sectionToggleSchema = new mongoose.Schema(
  { enabled: { type: Boolean, default: true }, title: String, limit: Number },
  { _id: false }
);

const cmsHomepageSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true, default: 'en' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,
    scheduledAt: Date,
    hero: {
      headline: String,
      subheadline: String,
      backgroundImageUrl: String,
      mobileImageUrl: String,
      ctas: [ctaSchema],
    },
    stats: [statSchema],
    sections: {
      featuredJobs: { type: sectionToggleSchema, default: () => ({ enabled: true, limit: 8 }) },
      featuredScholarships: { type: sectionToggleSchema, default: () => ({ enabled: true, limit: 6 }) },
      featuredAdmissions: { type: sectionToggleSchema, default: () => ({ enabled: true, limit: 6 }) },
      testimonials: {
        enabled: { type: Boolean, default: false },
        title: String,
        items: [testimonialSchema],
      },
      partners: {
        enabled: { type: Boolean, default: false },
        title: String,
        logos: [partnerLogoSchema],
      },
      studentResources: {
        enabled: { type: Boolean, default: true },
        items: [resourceItemSchema],
      },
      foreignStudyCountries: {
        enabled: { type: Boolean, default: true },
        items: [countryItemSchema],
      },
      newsletter: {
        enabled: { type: Boolean, default: true },
        title: String,
        subtitle: String,
      },
    },
    seoTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    ogImageUrl: String,
    twitterCard: { type: String, default: 'summary_large_image' },
    schemaType: { type: String, default: 'WebPage' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cmsHomepageSchema.index({ locale: 1 }, { unique: true });
cmsHomepageSchema.index({ status: 1 });

export const CmsHomepage = mongoose.model('CmsHomepage', cmsHomepageSchema);
