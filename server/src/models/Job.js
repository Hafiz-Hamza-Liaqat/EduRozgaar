import mongoose from 'mongoose';
import { jobSlug } from '../utils/slugify.js';
import { translationFieldDefinition, applySlugLocaleIndex, ensureTranslationGroupHook } from './mixins/translationFields.js';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    company: { type: String, required: true },
    organization: { type: String }, // alias / display name
    location: { type: String },
    province: { type: String },
    city: { type: String },
    category: { type: String },
    type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
    jobType: { type: String, enum: ['Government', 'Private', 'Internship'], default: 'Private' },
    educationRequirement: { type: String },
    experience: { type: String },
    applyType: { type: String, enum: ['external', 'internal'], default: 'external' },
    applicationLink: { type: String }, // external apply URL (e.g. PPSC, university portal)
    description: { type: String },
    requirements: [{ type: String }],
    applicationInstructions: { type: String },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPlan' },
    planType: { type: String, enum: ['free', 'starter', 'standard', 'premium'], default: null },
    expiresAt: { type: Date },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'active' },
    deadline: { type: Date },
    logoUrl: { type: String },
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    /** L.2.8 — optional headcount; null = unlimited */
    totalSeats: { type: Number, default: null, min: 1 },
    autoCloseWhenFilled: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    urgent: { type: Boolean, default: false },
    boostLevel: { type: Number, default: 0 },
    paidUntil: { type: Date },
    source: { type: String, enum: ['manual', 'scraper', 'employer'], default: 'manual' },
    salaryRange: { type: String },
    skillsRequired: [{ type: String }],
    applyEmail: { type: String },
    scrapedAt: { type: Date },
    sourceUrl: { type: String },
    sourceWebsite: { type: String }, // e.g. PPSC, FPSC, LinkedIn, Rozee.pk
    externalId: { type: String, unique: true, sparse: true }, // unique per source for dedup
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
    responsibilities: [{ type: String }],
    benefits: [{ type: String }],
    gender: { type: String },
    salaryCurrency: { type: String, default: 'PKR' },
    gallery: [{ type: String }],
    seoTitle: { type: String },
    metaDescription: { type: String },
    ...translationFieldDefinition,
  },
  { timestamps: true }
);

jobSchema.index({ sourceWebsite: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ province: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ title: 'text', company: 'text', location: 'text', province: 'text' });
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ status: 1, approvalStatus: 1 });
jobSchema.index({ expiresAt: 1 });
applySlugLocaleIndex(jobSchema);
ensureTranslationGroupHook(jobSchema);

jobSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = jobSlug(this.title, this.province || this.location || '');
  }
  next();
});

export const Job = mongoose.model('Job', jobSchema);
