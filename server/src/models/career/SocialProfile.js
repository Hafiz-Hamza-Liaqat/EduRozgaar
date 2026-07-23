import mongoose from 'mongoose';

export const socialProfileSchema = new mongoose.Schema(
  {
    linkedInUrl: { type: String, trim: true, default: '' },
    githubUrl: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    twitterUrl: { type: String, trim: true, default: '' },
    websiteUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const SocialProfile = socialProfileSchema;
