import { QuestionBank } from '../../models/career/QuestionBank.js';
import { Question } from '../../models/career/Question.js';

export const QuestionBankRepository = {
  async findById(id) {
    return QuestionBank.findById(id).lean();
  },

  async findBySlug(slug) {
    return QuestionBank.findOne({ slug }).lean();
  },

  async create(data) {
    return QuestionBank.create(data);
  },

  async updateById(id, patch) {
    return QuestionBank.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  async listQuestions(questionBankId, { includeAnswers = false } = {}) {
    const docs = await Question.find({ questionBankId, status: 'active' }).sort({ createdAt: 1 }).lean();
    if (includeAnswers) return docs;
    return docs.map((q) => ({
      _id: q._id,
      prompt: q.prompt,
      questionType: q.questionType,
      options: q.options,
      difficulty: q.difficulty,
      tags: q.tags,
    }));
  },

  async createQuestion(data) {
    return Question.create(data);
  },

  async countQuestions(questionBankId) {
    return Question.countDocuments({ questionBankId, status: 'active' });
  },
};
