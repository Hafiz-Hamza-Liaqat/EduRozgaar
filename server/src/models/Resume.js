import mongoose from 'mongoose';

const personalInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    professionalTitle: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    province: { type: String, trim: true, default: '' },
    linkedInUrl: { type: String, trim: true, default: '' },
    githubUrl: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    profilePhotoUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, default: '' },
    university: { type: String, trim: true, default: '' },
    fieldOfStudy: { type: String, trim: true, default: '' },
    graduationYear: { type: String, trim: true, default: '' },
    gpa: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const skillsSchema = new mongoose.Schema(
  {
    technical: { type: [String], default: [] },
    soft: { type: [String], default: [] },
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const projectEntrySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    technologies: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const referenceEntrySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const awardEntrySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const volunteerEntrySchema = new mongoose.Schema(
  {
    organization: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const publicationEntrySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    publisher: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const membershipEntrySchema = new mongoose.Schema(
  {
    organization: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    since: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, default: 'My Resume' },
    template: { type: String, enum: ['modern-professional', 'minimal-ats', 'creative-portfolio', 'academic-cv'], default: 'modern-professional' },
    personalInfo: { type: personalInfoSchema, default: () => ({}) },
    careerObjective: { type: String, trim: true, default: '' },
    education: [educationEntrySchema],
    skills: { type: skillsSchema, default: () => ({ technical: [], soft: [] }) },
    experience: [experienceEntrySchema],
    projects: [projectEntrySchema],
    certifications: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    references: [referenceEntrySchema],
    awards: [awardEntrySchema],
    volunteerExperience: [volunteerEntrySchema],
    publications: [publicationEntrySchema],
    interests: [{ type: String, trim: true }],
    professionalMemberships: [membershipEntrySchema],
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = mongoose.model('Resume', resumeSchema);
