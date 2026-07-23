import mongoose from 'mongoose';

const navChildSchema = new mongoose.Schema(
  {
    label: String,
    labelUr: String,
    labelAr: String,
    path: String,
    external: { type: Boolean, default: false },
    icon: String,
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const navItemSchema = new mongoose.Schema(
  {
    label: String,
    labelUr: String,
    labelAr: String,
    path: String,
    external: { type: Boolean, default: false },
    icon: String,
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    children: [navChildSchema],
  },
  { _id: false }
);

const footerLinkSchema = new mongoose.Schema(
  { label: String, labelUr: String, labelAr: String, path: String, external: { type: Boolean, default: false } },
  { _id: false }
);

const footerColumnSchema = new mongoose.Schema(
  { title: String, titleUr: String, titleAr: String, links: [footerLinkSchema] },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  { platform: String, url: String, icon: String },
  { _id: false }
);

const footerPromoSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    title: String,
    titleUr: String,
    titleAr: String,
    description: String,
    descriptionUr: String,
    descriptionAr: String,
    ctaLabel: String,
    ctaLabelUr: String,
    ctaLabelAr: String,
    ctaUrl: String,
    ctaExternal: { type: Boolean, default: false },
    imageUrl: String,
    icon: String,
  },
  { _id: false }
);

const cmsNavigationSchema = new mongoose.Schema(
  {
    placement: { type: String, enum: ['header', 'footer'], required: true },
    locale: { type: String, required: true, default: 'en' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,
    items: [navItemSchema],
    columns: [footerColumnSchema],
    promoColumn: footerPromoSchema,
    socialLinks: [socialLinkSchema],
    contact: {
      email: String,
      phone: String,
      address: String,
    },
    newsletterText: String,
    newsletterTextUr: String,
    newsletterTextAr: String,
    copyrightText: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cmsNavigationSchema.index({ placement: 1, locale: 1 }, { unique: true });

export const CmsNavigation = mongoose.model('CmsNavigation', cmsNavigationSchema);
