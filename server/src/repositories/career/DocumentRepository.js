import { Document } from '../../models/career/Document.js';

export const DocumentRepository = {
  async findById(id) {
    return Document.findById(id).lean();
  },

  async findByIdForUser(id, userId) {
    return Document.findOne({ _id: id, userId, status: { $ne: 'deleted' } }).lean();
  },

  async findByUser(userId, { documentType, parentType, status = 'active', currentOnly = true } = {}) {
    const filter = { userId, status };
    if (documentType) filter.documentType = documentType;
    if (parentType) filter.parentType = parentType;
    if (currentOnly) filter.isCurrentVersion = true;
    return Document.find(filter).sort({ updatedAt: -1 }).lean();
  },

  async findByProfileId(talentProfileId, options = {}) {
    const filter = { talentProfileId, status: options.status || 'active' };
    if (options.documentType) filter.documentType = options.documentType;
    if (options.currentOnly !== false) filter.isCurrentVersion = true;
    return Document.find(filter).sort({ updatedAt: -1 }).lean();
  },

  async findVersionsByGroup(versionGroupId, userId) {
    return Document.find({ versionGroupId, userId, status: { $ne: 'deleted' } })
      .sort({ versionNumber: -1 })
      .lean();
  },

  async create(data) {
    return Document.create(data);
  },

  async updateById(id, patch) {
    return Document.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  },

  async markVersionsNotCurrent(versionGroupId, exceptId) {
    await Document.updateMany(
      { versionGroupId, _id: { $ne: exceptId } },
      { $set: { isCurrentVersion: false } }
    );
  },

  async softDeleteById(id) {
    return Document.findByIdAndUpdate(id, { $set: { status: 'deleted', isCurrentVersion: false } }, { new: true }).lean();
  },

  async archiveById(id) {
    return Document.findByIdAndUpdate(id, { $set: { status: 'archived', isCurrentVersion: false } }, { new: true }).lean();
  },

  async findByLegacyProfileDocumentId(legacyProfileDocumentId) {
    return Document.findOne({ legacyProfileDocumentId, status: { $ne: 'deleted' } }).lean();
  },

  async countAll() {
    return Document.countDocuments({ status: { $ne: 'deleted' } });
  },

  async countWithLegacyLink() {
    return Document.countDocuments({
      legacyProfileDocumentId: { $ne: null },
      status: { $ne: 'deleted' },
    });
  },
};
