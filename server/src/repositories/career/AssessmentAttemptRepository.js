import { AssessmentAttempt } from '../../models/career/AssessmentAttempt.js';

export const AssessmentAttemptRepository = {
  async create(data) {
    return AssessmentAttempt.create(data);
  },

  async findById(id) {
    return AssessmentAttempt.findById(id).lean();
  },

  async findByIdForUser(id, userId) {
    return AssessmentAttempt.findOne({ _id: id, userId }).lean();
  },

  async updateById(id, patch) {
    return AssessmentAttempt.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  async countByUserAndAssessment(userId, assessmentId) {
    return AssessmentAttempt.countDocuments({
      userId,
      assessmentId,
      status: { $in: ['started', 'in_progress', 'submitted', 'scored'] },
    });
  },

  async findOpenAttempt(userId, assessmentId) {
    return AssessmentAttempt.findOne({
      userId,
      assessmentId,
      status: { $in: ['started', 'in_progress'] },
    }).lean();
  },

  async listForUser(userId, { limit = 20 } = {}) {
    return AssessmentAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();
  },

  async listScoredForUser(userId, { limit = 10 } = {}) {
    return AssessmentAttempt.find({ userId, status: 'scored' })
      .sort({ scoredAt: -1 })
      .limit(limit)
      .lean();
  },
};
