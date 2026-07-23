import { ProfileDocument } from '../../models/career/ProfileDocument.js';

export const ProfileDocumentRepository = {
  async findByProfileId(talentProfileId, { includeDeleted = false } = {}) {
    const filter = { talentProfileId };
    if (!includeDeleted) filter.status = { $ne: 'deleted' };
    return ProfileDocument.find(filter).sort({ updatedAt: -1 }).lean();
  },

  async findByIdForUser(id, userId) {
    return ProfileDocument.findOne({ _id: id, userId, status: { $ne: 'deleted' } }).lean();
  },

  async create(data) {
    return ProfileDocument.create(data);
  },

  async updateById(id, patch) {
    return ProfileDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  async softDeleteById(id) {
    return ProfileDocument.findByIdAndUpdate(id, { $set: { status: 'deleted' } }, { new: true });
  },
};
