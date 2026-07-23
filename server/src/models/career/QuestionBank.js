import mongoose from 'mongoose';

/**
 * QuestionBank aggregate — wraps or replaces ad-hoc Mcq collections for career assessments.
 */
const questionBankSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    categorySlug: { type: String, trim: true, default: '', index: true },
    legacyQuizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    questionCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    locale: { type: String, trim: true, default: 'en' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'questionBanks' }
);

questionBankSchema.index({ status: 1, categorySlug: 1 });

export const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
