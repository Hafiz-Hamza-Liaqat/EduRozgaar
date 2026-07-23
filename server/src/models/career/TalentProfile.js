import mongoose from 'mongoose';
import {
  TALENT_PROFILE_STATUSES,
  TALENT_PROFILE_VISIBILITY,
  SKILL_LEVELS,
  SKILL_SOURCES,
  SKILL_CATEGORIES,
} from '../../../../shared/career/constants.js';
import { socialProfileSchema } from './SocialProfile.js';
import { careerPreferenceSchema } from './CareerPreference.js';
import { languageSkillSchema } from './LanguageSkill.js';
import { certificationReferenceSchema } from './CertificationReference.js';
import { portfolioReferenceSchema } from './PortfolioReference.js';
import { personalInfoSchema } from './PersonalInfo.js';

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, default: '' },
    institution: { type: String, trim: true, default: '' },
    fieldOfStudy: { type: String, trim: true, default: '' },
    startYear: { type: String, trim: true, default: '' },
    endYear: { type: String, trim: true, default: '' },
    gpa: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    startDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    achievements: { type: [String], default: [] },
  },
  { _id: false }
);

const skillEntrySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    level: { type: String, enum: SKILL_LEVELS, default: 'intermediate' },
    source: { type: String, enum: SKILL_SOURCES, default: 'self_reported' },
    yearsOfExperience: { type: Number },
    category: { type: String, enum: SKILL_CATEGORIES, default: 'technical' },
  },
  { _id: false }
);

const careerGoalSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    targetDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    availableFrom: { type: Date },
    noticePeriodDays: { type: Number },
    hoursPerWeek: { type: Number },
  },
  { _id: false }
);

const talentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: String, enum: TALENT_PROFILE_STATUSES, default: 'draft' },
    displayName: { type: String, trim: true, default: '' },
    headline: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    publicSlug: { type: String, trim: true, sparse: true, unique: true },
    visibility: { type: String, enum: TALENT_PROFILE_VISIBILITY, default: 'private' },
    locale: { type: String, trim: true, default: 'en' },
    market: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    personal: { type: personalInfoSchema, default: () => ({}) },
    socialProfile: { type: socialProfileSchema, default: () => ({}) },
    preferences: { type: careerPreferenceSchema, default: () => ({}) },
    availability: { type: availabilitySchema, default: () => ({}) },
    education: { type: [educationEntrySchema], default: [] },
    experience: { type: [experienceEntrySchema], default: [] },
    skills: { type: [skillEntrySchema], default: [] },
    languages: { type: [languageSkillSchema], default: [] },
    certificationReferences: { type: [certificationReferenceSchema], default: [] },
    portfolioReferences: { type: [portfolioReferenceSchema], default: [] },
    careerGoals: { type: [careerGoalSchema], default: [] },
    interests: { type: [String], default: [] },
    hydrationSource: { type: String, enum: ['manual', 'resume', 'user', 'migration'], default: 'manual' },
    legacyResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  },
  { timestamps: true }
);

talentProfileSchema.index({ visibility: 1, market: 1 });
talentProfileSchema.index({ status: 1, updatedAt: -1 });

export const TalentProfile = mongoose.model('TalentProfile', talentProfileSchema);
