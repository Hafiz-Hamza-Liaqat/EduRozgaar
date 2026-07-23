import mongoose from 'mongoose';

const searchDocumentSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    locale: { type: String, default: 'en', index: true },
    title: { type: String, default: '', index: true },
    slug: { type: String, default: '' },
    url: { type: String, default: '' },
    summary: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    category: { type: String, default: '', index: true },
    province: { type: String, default: '', index: true },
    country: { type: String, default: '', index: true },
    tags: { type: [String], default: [] },
    publishedAt: { type: Date, index: true },
    updatedAt: { type: Date },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, default: 'active', index: true },
    searchable: { type: Boolean, default: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    searchText: { type: String, default: '' },
    indexedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

searchDocumentSchema.index({ entityType: 1, entityId: 1, locale: 1 }, { unique: true });
searchDocumentSchema.index({ title: 'text', summary: 'text', searchText: 'text', tags: 'text' });
searchDocumentSchema.index({ searchable: 1, status: 1, entityType: 1 });

export const SearchDocument = mongoose.model('SearchDocument', searchDocumentSchema);
