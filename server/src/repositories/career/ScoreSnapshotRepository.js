import { ScoreSnapshot } from '../../models/career/ScoreSnapshot.js';

export const ScoreSnapshotRepository = {
  async create(data) {
    return ScoreSnapshot.create(data);
  },

  async findLatest(talentProfileId, scoreType) {
    return ScoreSnapshot.findOne({ talentProfileId, scoreType }).sort({ computedAt: -1 }).lean();
  },

  async findLatestByUser(userId, scoreType) {
    return ScoreSnapshot.findOne({ userId, scoreType }).sort({ computedAt: -1 }).lean();
  },

  async findHistory(talentProfileId, scoreType, { limit = 20 } = {}) {
    return ScoreSnapshot.find({ talentProfileId, scoreType })
      .sort({ computedAt: -1 })
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();
  },

  async findHistoryByUser(userId, scoreType, { limit = 20 } = {}) {
    return ScoreSnapshot.find({ userId, scoreType })
      .sort({ computedAt: -1 })
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();
  },

  async countAll() {
    return ScoreSnapshot.countDocuments({});
  },
};
