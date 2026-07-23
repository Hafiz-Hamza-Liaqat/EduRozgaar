import mongoose from 'mongoose';

const searchQueryLogSchema = new mongoose.Schema(
  {
    query: { type: String, default: '', index: true },
    locale: { type: String, default: 'en' },
    entityTypes: { type: [String], default: [] },
    resultCount: { type: Number, default: 0 },
    clickedResult: {
      entityType: String,
      entityId: String,
      url: String,
    },
    responseTimeMs: { type: Number, default: 0 },
    source: { type: String, enum: ['public', 'admin', 'suggestions'], default: 'public' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ipHash: { type: String, default: '' },
  },
  { timestamps: true },
);

searchQueryLogSchema.index({ createdAt: -1 });

export const SearchQueryLog = mongoose.model('SearchQueryLog', searchQueryLogSchema);
