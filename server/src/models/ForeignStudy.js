import mongoose from 'mongoose';
import { foreignStudySlug } from '../utils/slugify.js';

const foreignStudySchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    program: { type: String },
    slug: { type: String, required: true, unique: true },
    level: { type: String, enum: ['Undergraduate', 'Graduate', 'PhD', 'Short Course', 'Other'], default: 'Other' },
    institution: { type: String },
    requirements: [{ type: String }],
    deadline: { type: Date },
    description: { type: String },
    link: { type: String },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'active' },
    imageUrl: { type: String },
    visaInfo: { type: String },
    costOfLiving: { type: String },
    studentLife: { type: String },
    languageTests: [{ type: String }],
    scholarshipsInfo: { type: String },
    intakes: [{ type: String }],
    seoTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

foreignStudySchema.index({ country: 1, status: 1 });
foreignStudySchema.index({ level: 1, status: 1 });
foreignStudySchema.index({ deadline: 1, status: 1 });

foreignStudySchema.pre('save', function (next) {
  if (!this.slug && this.country) {
    this.slug = foreignStudySlug(this.country, this.program || '');
  }
  next();
});

export const ForeignStudy = mongoose.model('ForeignStudy', foreignStudySchema);
