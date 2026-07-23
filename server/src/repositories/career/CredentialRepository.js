import { Credential } from '../../models/career/Credential.js';

export const CredentialRepository = {
  async findByProfileId(talentProfileId) {
    return Credential.find({ talentProfileId, verificationStatus: { $ne: 'revoked' } })
      .sort({ issuedAt: -1, createdAt: -1 })
      .lean();
  },

  async findByIdForUser(id, userId) {
    return Credential.findOne({ _id: id, userId }).lean();
  },

  async create(data) {
    return Credential.create(data);
  },

  async updateById(id, patch) {
    return Credential.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  async countAll() {
    return Credential.countDocuments({});
  },
};
