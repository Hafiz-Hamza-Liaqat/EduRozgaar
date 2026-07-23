import mongoose from 'mongoose';

export const portfolioReferenceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    technologies: { type: [String], default: [] },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileDocument' },
    featured: { type: Boolean, default: false },
  },
  { _id: false }
);

export const PortfolioReference = portfolioReferenceSchema;
