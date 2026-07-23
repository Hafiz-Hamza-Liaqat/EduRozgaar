import { Assessment } from '../../models/career/Assessment.js';

export const AssessmentRepository = {
  async findPublished({ categorySlug, family, limit = 50, skip = 0 } = {}) {
    const filter = { status: 'published' };
    if (categorySlug) filter.categorySlug = categorySlug;
    if (family) filter.family = family;
    return Assessment.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  async findBySlug(slug) {
    return Assessment.findOne({ slug }).lean();
  },

  async findById(id) {
    return Assessment.findById(id).lean();
  },

  async create(data) {
    return Assessment.create(data);
  },

  async updateById(id, patch) {
    return Assessment.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  async countPublished() {
    return Assessment.countDocuments({ status: 'published' });
  },
};
